// === Imports ===
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js';
import fetch from 'node-fetch';
import express from 'express';
import fs from 'fs';

// Bot functionality
import { handleScheduleCommand } from './schedule.js';
import { nhlEmojiMap } from './nhlEmojiMap.js';
import { generateSeasonRecap } from './recap.js';
import { handleGuildMemberAdd } from './welcome.js';
import { parseSiriInput, postToDiscord } from './siriPost.js';

// === Imports for ELO Charting ===
import { getSheetData } from './nhl95-elo-chart/fetchELO.js';
import { flattenEloHistory } from './nhl95-elo-chart/processELO.js';
import { buildDatasets } from './nhl95-elo-chart/datasets.js';
import { renderChart } from './nhl95-elo-chart/renderChart.js';

// === QuickChart ===
import QuickChart from 'quickchart-js';

// === Discord Bot Setup ===
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,  // for welcome.js
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});
handleGuildMemberAdd(client); // optional, can comment out if not using welcome.js

// === GAS URLs ===
const reportsUrl = 'https://script.google.com/macros/s/AKfycbyMlsEWIiQOhojzLVe_VNirLVVhymltp1fMxLHH2XrVnQZbln2Qbhw36fDz6b1I4UqS/exec?report=reports';

// === Bot Online Confirmation ===
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// === Slash Command Handler ===
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === 'reports') {
    await interaction.reply({ content: '📡 Ed is getting your reports...', ephemeral: true });
    try {
      const res = await fetch(reportsUrl);
      const json = await res.json();
      if (json.error || !json.data) throw new Error(json.error || 'No data returned');
      const { ga, gf, shutouts } = json.data;

      await interaction.channel.send({
        content: `🎤 **Listen... Here are your reports. I love dragons!**`,
        embeds: [
          { title: "📊 Goals Against per Game - Min 30 GP", image: { url: ga } },
          { title: "🚀 Goals For per Game - Min 30 GP", image: { url: gf } },
          { title: "🧱 All-Time Shutouts", image: { url: shutouts } }
        ]
      });
    } catch (error) {
      console.error('❌ Error running reports:', error);
      await interaction.channel.send('❌ I messed up running your reports.');
    }
  }

  if (interaction.commandName === 'schedule') {
    return handleScheduleCommand(interaction);
  }

  if (interaction.commandName === 'myelo') {
    await interaction.reply({ content: '📈 Generating your ELO chart...', ephemeral: true });
    try {
      const chartUrl = await generateManagerEloChartQC(interaction.user.id);
      if (!chartUrl) return interaction.editReply('❌ No ELO data found for you.');

      await interaction.channel.send({
        embeds: [{ title: `${interaction.user.username}'s ELO History`, image: { url: chartUrl }, color: 0xff0000 }]
      });
      await interaction.editReply({ content: '✅ Done!', ephemeral: true });
    } catch (err) {
      console.error('❌ Error generating /myelo chart:', err);
      await interaction.editReply('❌ Failed to generate your ELO chart.');
    }
  }
});

// === Slash Command Registration ===
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
(async () => {
  try {
    console.log('🚀 Registering slash commands...');
    const commands = [
      new SlashCommandBuilder().setName('reports').setDescription('Ask Ed to run some reports'),
      new SlashCommandBuilder().setName('schedule').setDescription('Ask Ed to show your schedule'),
      new SlashCommandBuilder().setName('myelo').setDescription('Ask Ed to show ELO history')
    ].map(cmd => cmd.toJSON());

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
    console.log('✅ Slash commands registered.');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
})();

// === Express Server ===
const app = express();
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.send('🟢 TickleBot is alive and ready to serve!');
});

// Siri Score Endpoint
app.post('/api/siri-score', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) throw new Error("No text provided");

    const result = parseSiriInput(text);
    const message = `${result.awayTeam} ${result.awayScore} - ${result.homeTeam} ${result.homeScore}`;
    await postToDiscord(message);

    res.json({ message: "Your score was posted nerd" });
  } catch (err) {
    console.error('❌ Siri input error:', err);
    res.json({ success: false, message: "Error processing input. Make sure you said a valid score." });
  }
});

// Generate recap endpoint
app.post('/api/generate-recap', async (req, res) => {
  try {
    const teamStats = req.body;
    const recap = await generateSeasonRecap(teamStats);
    res.send(recap);
  } catch (err) {
    console.error('Error generating recap:', err);
    res.status(500).send('Internal Server Error');
  }
});

// === Dynamic Message Listener Using phrases.json ===
const phrases = JSON.parse(fs.readFileSync('./phrases.json', 'utf-8'));
const repliedMessages = new Set();

client.on('messageCreate', async message => {
  if (message.author.bot || message.webhookId) return;
  if (repliedMessages.has(message.id)) return;

  const msgLower = message.content.toLowerCase();
  if (message.mentions.has(client.user) || msgLower.includes('ticklebot')) {
    repliedMessages.add(message.id);
    await message.reply("🐺 What do you want? I'm busy watching Nyad.");
    setTimeout(() => repliedMessages.delete(message.id), 10 * 60 * 1000);
    return;
  }

  const channelName = message.channel?.name;
  for (const phraseObj of phrases) {
    const triggers = phraseObj.triggers.map(trigger => trigger.toLowerCase());
    const channelMatches =
      !phraseObj.channel ||
      (Array.isArray(phraseObj.channel) ? phraseObj.channel.includes(channelName) : phraseObj.channel === channelName);

    const triggerMatches = triggers.some(trigger => new RegExp(`\\b${trigger}\\b`, 'i').test(msgLower));
    const isOnlyOT = triggers.length === 1 && (triggers[0] === "ot" || triggers[0] === "overtime");
    const msgIsOT = /^ot[\.\!\?]*$/i.test(message.content.trim());
    const msgIsOvertime = /^overtime[\.\!\?]*$/i.test(message.content.trim());

    if (channelMatches && triggerMatches) {
      if (isOnlyOT && !(msgIsOT || msgIsOvertime)) continue;

      repliedMessages.add(message.id);
      message.reply(phraseObj.response);
      setTimeout(() => repliedMessages.delete(message.id), 10 * 60 * 1000);
      break;
    }
  }
});

// === ELO Chart Function ===
export async function generateManagerEloChartQC(managerDiscordId) {
  try {
    const eloRows = await getSheetData('ELOHistory!A:P');
    const adamRows = await getSheetData('AdamSetup!B12:D');
    const flatElo = flattenEloHistory(eloRows, adamRows);

    const managerElo = flatElo.filter(row => row.discordId === managerDiscordId);
    if (!managerElo.length) {
      console.log(`No ELO data for ${managerDiscordId}`);
      return;
    }

    const bucketSize = 15;
    const bucketedData = [];
    for (let i = 0; i < managerElo.length; i += bucketSize) {
      const chunk = managerElo.slice(i, i + bucketSize);
      if (chunk.length > 0) {
        const avgElo = chunk.reduce((sum, r) => sum + r.elo, 0) / chunk.length;
        bucketedData.push({ x: i + chunk.length, y: avgElo });
      }
    }

    const datasets = [{
      label: managerElo[0].manager,
      data: bucketedData,
      borderColor: "red",
      backgroundColor: "blue",
      pointBorderColor: "blue",
      pointBackgroundColor: "blue",
      pointRadius: 5,
      showLine: true
    }];

    const chartConfig = {
      type: 'line',
      data: { datasets },
      options: {
        plugins: {
          legend: { display: true, position: 'right' },
          title: { display: true, text: 'Manager ELO History (bucketed - 15 Games)', font: { size: 20 } }
        },
        scales: {
          x: { type: 'linear', title: { display: true, text: 'Games' }, ticks: { stepSize: bucketSize } },
          y: { title: { display: true, text: 'ELO' } }
        }
      }
    };

    const qc = new QuickChart();
    qc.setConfig(chartConfig).setWidth(1400).setHeight(700).setVersion('4');
    const chartUrl = qc.getUrl();
    console.log(`📈 Manager ELO chart URL: ${chartUrl}`);
    return chartUrl;
  } catch (err) {
    console.error('❌ Error generating manager ELO chart (QuickChart):', err);
  }
}

// === Discord Login ===
console.log('DISCORD_TOKEN length:', process.env.DISCORD_TOKEN?.length);
(async () => {
  try {
    await client.login(process.env.DISCORD_TOKEN);
    console.log(`✅ Logged in as ${client.user.tag}`);
  } catch (err) {
    console.error('❌ Discord login failed:', err);
    console.error(err.stack);
  }
})();

// === Express Port Binding (required for Render) ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});
