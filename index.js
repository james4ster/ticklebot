import 'dotenv/config';
import express from 'express';
import { Client, GatewayIntentBits } from 'discord.js';

// Express server for Render
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => res.send('Bot is alive!'));

app.listen(PORT, () => console.log(`🌐 Web server running on port ${PORT}`));

// Discord bot
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Debug: check token
console.log(`DISCORD_TOKEN:[${process.env.DISCORD_TOKEN}]`);
console.log('Token length:', process.env.DISCORD_TOKEN?.length);

// Login
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN?.trim())
  .then(() => console.log('🚀 Login successful'))
  .catch(err => console.error('❌ Login failed:', err));