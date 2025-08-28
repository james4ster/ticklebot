// index.js
import 'dotenv/config';
import express from 'express';
import { Client, GatewayIntentBits } from 'discord.js';

// ✅ Render port or fallback
const PORT = process.env.PORT || 10000;

// --- Express server to keep Render happy ---
const app = express();
app.get('/', (req, res) => res.send('Bot is alive!'));
app.listen(PORT, () => console.log(`🌐 Web server running on port ${PORT}`));

// --- Discord bot setup ---
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// Triggered when bot logs in successfully
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// Debug: check token
console.log('DISCORD_TOKEN length:', process.env.DISCORD_TOKEN?.length);

// Attempt login
console.log('Logging in...');
client.login(process.env.DISCORD_TOKEN?.trim())
  .then(() => console.log('🚀 Login successful'))
  .catch(err => console.error('❌ Login failed:', err));