// === Imports ===
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js';
import fetch from 'node-fetch';
import express from 'express';

import { handleScheduleCommand } from './schedule.js';
import { nhlEmojiMap } from './nhlEmojiMap.js';
import { generateSeasonRecap } from './recap.js'; // <== Added import for recap function
import { handleGuildMemberAdd } from './welcome.js';  //

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

// === Dynamic Message Listener Using phrases.json ===
import fs from 'fs';
const phrases = JSON.parse(fs.readFileSync('./phrases.json', 'utf-8'));

const repliedMessages = new Set();

client.on('messageCreate', async message => {
  // Added webhookId check here as requested
  if (message.author.bot || message.webhookId) return;
  if (repliedMessages.has(message.id)) return;

  // Optional: prevent responding to replies that mention a bot
  if (message.reference) {
    const repliedTo = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
    if (repliedTo?.author?.bot) return;
  }

  const msg = message.content.toLowerCase();
  const channelName = message.channel?.name; // May be undefined in some contexts

  for (const phraseObj of phrases) {
    const triggers = phraseObj.triggers.map(trigger => trigger.toLowerCase());
    const channelMatches = !phraseObj.channel || phraseObj.channel === channelName;
    const messageHasTrigger = triggers.some(trigger => msg.includes(trigger));

    // Special case: skip "ot"/"overtime" if message contains "ticklebot" or "bot"
    const isOTTrigger = triggers.includes("ot") || triggers.includes("overtime");
    const shouldIgnoreOT = isOTTrigger && (msg.includes("ticklebot") || msg.includes("bot"));

    if (channelMatches && messageHasTrigger && !shouldIgnoreOT) {
      repliedMessages.add(message.id);
      message.reply(phraseObj.response);

      // Clear memory after 10 minutes
      setTimeout(() => {
        repliedMessages.delete(message.id);
      }, 10 * 60 * 1000);

      break;
    }
  }

});



// === Login to Discord ===
client.login(process.env.DISCORD_TOKEN);
