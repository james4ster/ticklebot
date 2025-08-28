// index.js
import 'dotenv/config'; // Loads .env automatically
import express from 'express';
import { Client, GatewayIntentBits } from 'discord.js';

// === Discord Bot Setup ===
const client = new Client({
  intents: [GatewayIntentBits.Guilds] // minimal intent
});

// Triggered when bot logs in successfully
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// Debug token
console.log('DISCORD_TOKEN:', process.env.DISCORD_TOKEN);
console.log('Token length:', process.env.DISCORD_TOKEN?.length);

// Attempt login
console.log('Logging in...');
client.login(process.env.DISCORD_TOKEN?.trim())
  .then(() => console.log('🚀 Login successful'))
  .catch(err => console.error('❌ Login failed:', err));

// === Express Server to keep app alive / health check ===
const app = express();

// Health check endpoint
app.get('/', (req, res) => {
  res.send('🟢 TickleBot is alive and ready!');
});

// Use PORT from environment or default 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});
