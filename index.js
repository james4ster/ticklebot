// === Imports ===
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js';
import fetch from 'node-fetch';
import express from 'express';

import { handleScheduleCommand } from './schedule.js';
import { nhlEmojiMap } from './nhlEmojiMap.js';
import { generateSeasonRecap } from './recap.js'; // <== Added import for recap function

// === Discord Bot Setup ===
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// === GAS URLs ===
const reportsUrl = 'https://script.google.com/macros/s/AKfycbxnXDsmWv-Rv7yU7nKeLh6vQ11r62DtevC-m1z3E05Hl0RnVwPQGlpRbntWo84IxfgF/exec?report=reports';

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
        .setDescription('Ask Ed to show your schedule')
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

// Health check endpoint
app.get('/', (req, res) => {
  res.send('🟢 TickleBot is alive and ready to serve!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});

// === Message Listener for "bs" and "down b" with duplicate reply prevention ===
const repliedMessages = new Set();

client.on('messageCreate', message => {
  if (message.author.bot) return; // ignore all bot messages

  if (repliedMessages.has(message.id)) return; // prevent duplicate replies

  const msg = message.content.toLowerCase();

  if (msg.includes('bs') || msg.includes('down b')) {
    repliedMessages.add(message.id);
    message.reply("🐺 Listen..... down vaginoids are not allowed in this league. If you want to watch a movie about an elderly woman swimming, I'll be your Huckleberry");

    // Remove from cache after 10 minutes to prevent memory leak
    setTimeout(() => {
      repliedMessages.delete(message.id);
    }, 10 * 60 * 1000);
  }
});

// === Login to Discord ===
client.login(process.env.DISCORD_TOKEN);
