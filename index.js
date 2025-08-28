// index.js
import 'dotenv/config'; // optional if you use a local .env file
import { Client, GatewayIntentBits } from 'discord.js';

// Minimal bot setup
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// Triggered when bot logs in successfully
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// Debug: check token
console.log('DISCORD_TOKEN:', process.env.DISCORD_TOKEN);
console.log('Token length:', process.env.DISCORD_TOKEN?.length);

// Attempt login
console.log('Logging in...');
client.login(process.env.DISCORD_TOKEN?.trim())
  .then(() => console.log('🚀 Login successful'))
  .catch(err => console.error('❌ Login failed:', err));