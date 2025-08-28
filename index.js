<<<<<<< HEAD

console.log('Running Node version:', process.version);

// === Imports ===
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js';
import fetch from 'node-fetch';
import fs from 'fs';
=======
import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
>>>>>>> minimal-render

client.once('ready', () => console.log(`✅ Logged in as ${client.user.tag}`));

<<<<<<< HEAD
// === Discord Bot Setup ===
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});
handleGuildMemberAdd(client); // optional

// === GAS URLs ===
const reportsUrl = 'https://script.google.com/macros/s/AKfycbyMlsEWIiQOhojzLVe_VNirLVVhymltp1fMxLHH2XrVnQZbln2Qbhw36fDz6b1I4UqS/exec?report=reports';

// === Discord Bot Ready Handler ===
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

  // /myelo disabled for now
  // if (interaction.commandName === 'myelo') {
  //   await interaction.reply({ content: '❌ /myelo disabled', ephemeral: true });
  // }
});

// === Slash Command Registration ===
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
(async () => {
  try {
    console.log('🚀 Registering slash commands...');
    const commands = [
      new SlashCommandBuilder().setName('reports').setDescription('Ask Ed to run some reports'),
      new SlashCommandBuilder().setName('schedule').setDescription('Ask Ed to show your schedule'),
      // new SlashCommandBuilder().setName('myelo').setDescription('Ask Ed to show ELO history')
    ].map(cmd => cmd.toJSON());

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
    console.log('✅ Slash commands registered.');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
})();

// === Discord Message Listener ===
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
});

// === Siri Score Endpoint (still usable for HTTP requests) ===
import express from 'express';
const app = express();
app.use(express.json());

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

// Health check endpoint
app.get('/', (req, res) => res.send('🟢 TickleBot background worker alive!'));

// Only bind Express port if you want web endpoints
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Express server running on port ${PORT}`));

// === Discord Login ===
client.on('error', (err) => {
  console.error('❌ Client error:', err);
});

client.on('shardError', (err) => {
  console.error('❌ Shard error:', err);
});

client.on('shardDisconnect', (event, id) => {
  console.warn(`⚠️ Shard ${id} disconnected:`, event);
});

console.log('Attempted Discord login...');
(async () => {
  try {
    await client.login(process.env.DISCORD_TOKEN);
    console.log(`✅ Logged in as ${client.user.tag}`);
  } catch (err) {
    console.error('❌ Discord login failed:', err);
  }
})();
=======
console.log('Logging in...');
client.login(process.env.DISCORD_TOKEN?.trim())
  .then(() => console.log('🚀 Login successful'))
  .catch(err => console.error('❌ Login failed:', err));
>>>>>>> minimal-render
