// === Imports ===
console.log("🚀 Starting bot...");
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

// === Import for Wheel Spinning ===
import { spinWheel, draftState, getTeams } from './spinWheel.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';


// === Discord Bot Setup ===
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,  // Added to support the Welcome message (welcome.js)
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});
handleGuildMemberAdd(client); //

// === GAS URLs ===
const reportsUrl = 'https://script.google.com/macros/s/AKfycbyMlsEWIiQOhojzLVe_VNirLVVhymltp1fMxLHH2XrVnQZbln2Qbhw36fDz6b1I4UqS/exec?report=reports';

// === Bot Online Confirmation ===
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// === Slash Command Handler ===
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;


  // Spin the Wheel via /spinwheel
  if (interaction.commandName === 'spinwheel') {
    try {
      // 1️⃣ Pull teams from Google Sheets
      const teams = await getTeams(process.env.SPREADSHEET_ID, 'LogoMaster');

      draftState.remainingTeams = draftState.remainingTeams.length
        ? draftState.remainingTeams
        : teams;

      const coachId = interaction.user.id;
      if (!draftState.coachStatus[coachId]) {
        draftState.coachStatus[coachId] = { usedRespin: false, pendingPick: null };
      }

      // 2️⃣ Spin the wheel
      const { winner, wheelUrl } = await spinWheel(
        draftState.remainingTeams.map(t => t.name),
        process.env.WHEEL_API_KEY
      );

      const winnerObj = draftState.remainingTeams.find(t => t.name === winner);

      // 3️⃣ Handle first spin (allow respin)
      if (!draftState.coachStatus[coachId].usedRespin) {
        draftState.coachStatus[coachId].pendingPick = winnerObj;

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('respin_yes')
            .setLabel('Respin')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('respin_no')
            .setLabel('Keep')
            .setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({
          content: `🎡 The wheel landed on **${winnerObj.name}**! You have 1 respin. Do you want to spin again?\n[See the wheel](${wheelUrl})`,
          components: [row],
          embeds: [{ image: { url: winnerObj.logo } }],
          ephemeral: true
        });

      } else {
        // Already used respin → final pick
        draftState.remainingTeams = draftState.remainingTeams.filter(t => t.name !== winnerObj.name);

        await interaction.reply({
          content: `🎡 The wheel landed on **${winnerObj.name}**! This pick is final.\n[See the wheel](${wheelUrl})`,
          embeds: [{ image: { url: winnerObj.logo } }]
        });
      }

    } catch (err) {
      console.error('❌ Error running /spinwheel:', err);
      await interaction.reply({ content: '❌ Something went wrong with the wheel.', ephemeral: true });
    }
  }


  // === Button Handler for SpinWheel Respin ===
  if (interaction.isButton()) {
    const coachId = interaction.user.id;
    const status = draftState.coachStatus[coachId];

    // Only handle if there’s a pending pick
    if (!status || !status.pendingPick) return;

    if (interaction.customId === 'respin_yes') {
      // Mark respin as used
      status.usedRespin = true;

      // Spin again
      const { winner, wheelUrl } = await spinWheel(
        draftState.remainingTeams.map(t => t.name),
        process.env.WHEEL_API_KEY
      );

      const winnerObj = draftState.remainingTeams.find(t => t.name === winner);
      status.pendingPick = winnerObj; // update pending pick

      // Update original message with new wheel
      await interaction.update({
        content: `🎡 Respin result: **${winnerObj.name}**!\nYou must take this pick.\n[See the wheel](${wheelUrl})`,
        components: [],
        embeds: [{ image: { url: winnerObj.logo } }]
      });

      // Remove from remaining teams
      draftState.remainingTeams = draftState.remainingTeams.filter(t => t.name !== winnerObj.name);

      // Clear pending pick
      status.pendingPick = null;

    } else if (interaction.customId === 'respin_no') {
      // Coach chooses to keep the original pick
      const winnerObj = status.pendingPick;

      await interaction.update({
        content: `🎡 You kept **${winnerObj.name}**! Pick is final.`,
        components: [],
        embeds: [{ image: { url: winnerObj.logo } }]
      });

      // Remove from remaining teams
      draftState.remainingTeams = draftState.remainingTeams.filter(t => t.name !== winnerObj.name);

      // Clear pending pick
      status.pendingPick = null;
    }
  }

  // Generate Reports via /commands
  if (interaction.commandName === 'reports') {
    await interaction.reply({ content: '📡 Ed is getting your reports...', ephemeral: true });

    try {
      const res = await fetch(reportsUrl);
      const json = await res.json();

      if (json.error || !json.data) {
        throw new Error(json.error || 'No data returned');
      }

      const { ga, gf, shutouts } = json.data;

      await interaction.channel.send({
        content: `🎤 **Listen... Here are your reports.  I love dragons! **`,
        embeds: [
          {
            title: "📊 Goals Against per Game - Min 30 GP",
            image: { url: ga }
          },
          {
            title: "🚀 Goals For per Game - Min 30 GP",
            image: { url: gf }
          },
          {
            title: "🧱 All-Time Shutouts",
            image: { url: shutouts }
          }
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


  // Generate ELO Chart via /myelo
  if (interaction.commandName === 'myelo') {
    await interaction.reply({ content: '📈 Generating your ELO chart...', ephemeral: true });

    try {
      const chartUrl = await generateManagerEloChartQC(interaction.user.id);

      if (!chartUrl) {
        return interaction.editReply('❌ No ELO data found for you.');
      }

      await interaction.channel.send({
        embeds: [
          {
            title: `${interaction.user.username}'s ELO History`,
            image: { url: chartUrl },
            color: 0xff0000
          }
        ]
      });

      await interaction.editReply({ content: '✅ Done!', ephemeral: true });
    } catch (err) {
      console.error('❌ Error generating /myelo chart:', err);
      await interaction.editReply('❌ Failed to generate your ELO chart.');
    }
  }
});

// === Slash Command Registration (Run once or on updates) ===
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('🚀 Registering slash commands...');

    const commands = [
      new SlashCommandBuilder()
        .setName('reports')
        .setDescription('Ask Ed to run some reports'),
      new SlashCommandBuilder()
        .setName('schedule')
        .setDescription('Ask Ed to show your schedule'),
      new SlashCommandBuilder()
        .setName('myelo')
        .setDescription('Ask Ed to show ELO history'),
      new SlashCommandBuilder()   
        .setName('spinwheel')
        .setDescription('Spin the draft wheel to pick a team')
    ].map(cmd => cmd.toJSON());

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log('✅ Slash commands registered.');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
})();

// === Express Server to Keep Replit Awake & API Route ===
const app = express();
app.use(express.json()); // <== Added middleware to parse JSON bodies

// Add API endpoint to generate recap
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

// === Siri Score Endpoint ===
app.post('/api/siri-score', async (req, res) => {
  try {
    const { text } = req.body; // text comes from the Siri Shortcut
    if (!text) throw new Error("No text provided");

    const result = parseSiriInput(text);
    const message = `${result.awayTeam} ${result.awayScore} - ${result.homeTeam} ${result.homeScore}`;

    await postToDiscord(message);

    // Custom success message
    res.json({
       message: "Your score was posted nerd"
    });

  } catch (err) {
    console.error('❌ Siri input error:', err);
    res.json({
      success: false,
      message: "Error processing input. Make sure you said a valid score. Are you high?"
    });
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.send('🟢 TickleBot is alive and ready to serve!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});

// === Dynamic Message Listener Using phrases.json ===
const phrases = JSON.parse(fs.readFileSync('./phrases.json', 'utf-8'));
const repliedMessages = new Set();

client.on('messageCreate', async message => {
  if (message.author.bot || message.webhookId) return;
  if (repliedMessages.has(message.id)) return;

  // ✅ Reply if someone @mentions the bot
  const msgLower = message.content.toLowerCase();
  if (message.mentions.has(client.user) || msgLower.includes('ticklebot')) {
    repliedMessages.add(message.id);
    await message.reply("🐺 What do you want? I'm busy watching Nyad.");
    setTimeout(() => repliedMessages.delete(message.id), 10 * 60 * 1000);
    return;
  }

  if (message.reference) {
    const repliedTo = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
    if (repliedTo?.author?.bot) return;
  }

  //const msgLower = message.content.toLowerCase();
  const channelName = message.channel?.name;

  for (const phraseObj of phrases) {
    const triggers = phraseObj.triggers.map(trigger => trigger.toLowerCase());
    const channelMatches =
      !phraseObj.channel ||
      (Array.isArray(phraseObj.channel)
        ? phraseObj.channel.includes(channelName)
        : phraseObj.channel === channelName);

    const triggerMatches = triggers.some(trigger => {
      const regex = new RegExp(`\\b${trigger}\\b`, 'i');
      return regex.test(msgLower);
    });

    const isOnlyOT = triggers.length === 1 && (
      triggers[0] === "ot" || triggers[0] === "overtime"
    );

    const msgIsOT = /^ot[\.\!\?]*$/i.test(message.content.trim());
    const msgIsOvertime = /^overtime[\.\!\?]*$/i.test(message.content.trim());

    if (channelMatches && triggerMatches) {
      if (isOnlyOT && !(msgIsOT || msgIsOvertime)) continue;

      repliedMessages.add(message.id);
      message.reply(phraseObj.response);

      setTimeout(() => {
        repliedMessages.delete(message.id);
      }, 10 * 60 * 1000);

      break;
    }
  }
});


// === ELO Chart Functions ===
// === ELO Chart Functions (QuickChart, bucketed) ===
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

    const datasets = [
      {
        label: managerElo[0].manager,
          data: bucketedData,
          borderColor: "red",          // line color
          backgroundColor: "blue",     // default fill color (optional)
          pointBorderColor: "blue",    // outline of the points
          pointBackgroundColor: "blue",// fill color of the points
          pointRadius: 5,
          showLine: true
      },
    ];

    const chartConfig = {
      type: 'line',
      data: { datasets },
      options: {
        plugins: {
          legend: { display: true, position: 'right' },
          title: {
            display: true,
            text: 'Manager ELO History (bucketed - 15 Games)',
            font: { size: 20 },
          },
          datalabels: { // this enables labels above points
            display: true,
            align: 'top',
            formatter: (value) => Math.round(value.y),
            font: { weight: 'bold', size: 12 },
            color: 'black',
          },
        },
        scales: {
          x: {
            type: 'linear',
            title: { display: true, text: 'Games' },
            ticks: { stepSize: bucketSize },
          },
          y: {
            title: { display: true, text: 'ELO' },
          },
        },
      },
    };

    const qc = new QuickChart();
    qc.setConfig(chartConfig)
      .setWidth(1400)
      .setHeight(700)
      .setVersion('4'); // Chart.js v4

    const chartUrl = qc.getUrl();

    console.log(`📈 Manager ELO chart URL: ${chartUrl}`);
    return chartUrl;

  } catch (err) {
    console.error('❌ Error generating manager ELO chart (QuickChart):', err);
  }
}


// Example usage:
//generateManagerEloChartQC('582240735793774618');


// === Login to Discord ===
client.login(process.env.DISCORD_TOKEN)
.then(() => console.log("✅ Login initiated"))
.catch(err => console.error("❌ Login failed", err));
