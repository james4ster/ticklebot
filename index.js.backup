// === Imports ===
console.log("🚀 Starting bot...");
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
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

// === Import for Wheel Spinning ===
import { spinWheel, draftState, getTeams } from './spinWheel.js';

// === Discord Bot Setup ===
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});
handleGuildMemberAdd(client);

// === GAS URLs ===
const reportsUrl = 'https://script.google.com/macros/s/AKfycbyMlsEWIiQOhojzLVe_VNirLVVhymltp1fMxLHH2XrVnQZbln2Qbhw36fDz6b1I4UqS/exec?report=reports';

// === Bot Online Confirmation ===
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// === Slash Command & Button Handler ===
client.on('interactionCreate', async interaction => {
  try {
    // === Button Handling first ===
    if (interaction.isButton()) {
      const coachId = interaction.user.id;
      const status = draftState.coachStatus[coachId];
      if (!status || !status.pendingPick) return;

      if (interaction.customId === 'respin_yes') {
        status.usedRespin = true;

        const { winner, wheelUrl } = await spinWheel(
          draftState.remainingTeams.map(t => t.name),
          process.env.WHEEL_API_KEY
        );
        const winnerObj = draftState.remainingTeams.find(t => t.name === winner);
        status.pendingPick = winnerObj;

        await interaction.update({
          content: `🎡 Respin result: **${winnerObj.name}**!\nYou must take this pick.\n[See the wheel](${wheelUrl})`,
          components: [],
          embeds: [{ image: { url: winnerObj.logo } }]
        });

        draftState.remainingTeams = draftState.remainingTeams.filter(t => t.name !== winnerObj.name);
        status.pendingPick = null;

      } else if (interaction.customId === 'respin_no') {
        const winnerObj = status.pendingPick;
        await interaction.update({
          content: `🎡 You kept **${winnerObj.name}**! Pick is final.`,
          components: [],
          embeds: [{ image: { url: winnerObj.logo } }]
        });

        draftState.remainingTeams = draftState.remainingTeams.filter(t => t.name !== winnerObj.name);
        status.pendingPick = null;
      }
      return;
    }

    // === Only handle commands below this ===
    if (!interaction.isCommand()) return;

    // === /spinwheel command ===
    if (interaction.commandName === 'spinwheel') {
      const teams = await getTeams(process.env.SPREADSHEET_ID, 'LogoMaster');
      if (!teams.length) {
        return interaction.reply({ content: '❌ Could not load teams.', ephemeral: true });
      }

      draftState.remainingTeams = draftState.remainingTeams.length
        ? draftState.remainingTeams
        : teams;

      const coachId = interaction.user.id;
      if (!draftState.coachStatus[coachId]) {
        draftState.coachStatus[coachId] = { usedRespin: false, pendingPick: null };
      }

      const { winner, wheelUrl } = await spinWheel(
        draftState.remainingTeams.map(t => t.name),
        process.env.WHEEL_API_KEY
      );
      const winnerObj = draftState.remainingTeams.find(t => t.name === winner);

      if (!draftState.coachStatus[coachId].usedRespin) {
        draftState.coachStatus[coachId].pendingPick = winnerObj;

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('respin_yes').setLabel('Respin').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('respin_no').setLabel('Keep').setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({
          content: `🎡 The wheel landed on **${winnerObj.name}**! You have 1 respin. Do you want to spin again?\n[See the wheel](${wheelUrl})`,
          components: [row],
          embeds: [{ image: { url: winnerObj.logo } }],
          ephemeral: true
        });
      } else {
        draftState.remainingTeams = draftState.remainingTeams.filter(t => t.name !== winnerObj.name);
        await interaction.reply({
          content: `🎡 The wheel landed on **${winnerObj.name}**! This pick is final.\n[See the wheel](${wheelUrl})`,
          embeds: [{ image: { url: winnerObj.logo } }]
        });
      }
    }

    // === /reports command ===
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

    // === /schedule command ===
    if (interaction.commandName === 'schedule') {
      return handleScheduleCommand(interaction);
    }

    // === /myelo command ===
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

  } catch (err) {
    console.error('❌ Error handling interaction:', err);
    if (!interaction.replied) {
      await interaction.reply({ content: '❌ Something went wrong.', ephemeral: true });
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
      new SlashCommandBuilder().setName('myelo').setDescription('Ask Ed to show ELO history'),
      new SlashCommandBuilder().setName('spinwheel').setDescription('Spin the draft wheel to pick a team')
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

app.post('/api/generate-recap', async (req, res) => {
  try {
    const recap = await generateSeasonRecap(req.body);
    res.send(recap);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

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

app.get('/', (req, res) => res.send('🟢 TickleBot is alive and ready to serve!'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Web server running on port ${PORT}`));

// === Dynamic Message Listener ===
const phrases = JSON.parse(fs.readFileSync('./phrases.json', 'utf-8'));
const repliedMessages = new Set();

client.on('messageCreate', async message => {
  if (message.author.bot || message.webhookId || repliedMessages.has(message.id)) return;

  const msgLower = message.content.toLowerCase();
  const channelName = message.channel?.name;

  // Reply to mentions
  if (message.mentions.has(client.user) || msgLower.includes('ticklebot')) {
    repliedMessages.add(message.id);
    await message.reply("🐺 What do you want? I'm busy watching Nyad.");
    setTimeout(() => repliedMessages.delete(message.id), 10 * 60 * 1000);
    return;
  }

  // Ignore replies to bots
  if (message.reference) {
    const repliedTo = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
    if (repliedTo?.author?.bot) return;
  }

  for (const phraseObj of phrases) {
    const triggers = phraseObj.triggers.map(t => t.toLowerCase());
    const channelMatches =
      !phraseObj.channel ||
      (Array.isArray(phraseObj.channel) ? phraseObj.channel.includes(channelName) : phraseObj.channel === channelName);

    const triggerMatches = triggers.some(trigger => new RegExp(`\\b${trigger}\\b`, 'i').test(msgLower));
    const isOnlyOT = triggers.length === 1 && (triggers[0] === "ot" || triggers[0] === "overtime");
    const msgIsOT = /^ot[\.\!\?]*$/i.test(message.content.trim());
    const msgIsOvertime = /^overtime[\.\!\?]*$/i.test(message.content.trim());

    if (channelMatches && triggerMatches && (!isOnlyOT || msgIsOT || msgIsOvertime)) {
      repliedMessages.add(message.id);
      await message.reply(phraseObj.response);
      setTimeout(() => repliedMessages.delete(message.id), 10 * 60 * 1000);
      break;
    }
  }
});

// === ELO Chart Functions ===
export async function generateManagerEloChartQC(managerDiscordId) {
  try {
    const eloRows = await getSheetData('ELOHistory!A:P');
    const adamRows = await getSheetData('AdamSetup!B12:D');
    const flatElo = flattenEloHistory(eloRows, adamRows);
    const managerElo = flatElo.filter(r => r.discordId === managerDiscordId);
    if (!managerElo.length) return;

    const bucketSize = 15;
    const bucketedData = [];
    for (let i = 0; i < managerElo.length; i += bucketSize) {
      const chunk = managerElo.slice(i, i + bucketSize);
      if (chunk.length) bucketedData.push({ x: i + chunk.length, y: chunk.reduce((sum, r) => sum + r.elo, 0) / chunk.length });
    }

    const datasets = [{ label: managerElo[0].manager, data: bucketedData, borderColor: "red", backgroundColor: "blue", pointBorderColor: "blue", pointBackgroundColor: "blue", pointRadius: 5, showLine: true }];
    const chartConfig = { type: 'line', data: { datasets }, options: { plugins: { legend: { display: true, position: 'right' }, title: { display: true, text: 'Manager ELO History (bucketed - 15 Games)', font: { size: 20 } } }, scales: { x: { type: 'linear', title: { display: true, text: 'Games' }, ticks: { stepSize: bucketSize } }, y: { title: { display: true, text: 'ELO' } } } } };
    const qc = new QuickChart();
    qc.setConfig(chartConfig).setWidth(1400).setHeight(700).setVersion('4');
    const chartUrl = qc.getUrl();
    console.log(`📈 Manager ELO chart URL: ${chartUrl}`);
    return chartUrl;
  } catch (err) {
    console.error('❌ Error generating manager ELO chart (QuickChart):', err);
  }
}

// === Login ===
client.login(process.env.DISCORD_TOKEN)
  .then(() => console.log("✅ Login initiated"))
  .catch(err => console.error("❌ Login failed", err));
