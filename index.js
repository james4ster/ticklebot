import 'dotenv/config';
import express from 'express';
import { Client, GatewayIntentBits } from 'discord.js';

// --- Discord bot setup ---
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// Use the correct token environment variable
const token = process.env.DISCORD_TOKEN2?.trim();

console.log('Logging in...');
client.login(token)
  .then(() => console.log('🚀 Login successful'))
  .catch(err => console.error('❌ Login failed:', err));

// --- Express server to keep Render happy ---
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => res.send('Bot is alive!'));

app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});