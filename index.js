import 'dotenv/config';
import express from 'express';
import { Client, GatewayIntentBits } from 'discord.js';

// --- Debug: show token ---
console.log('DISCORD_TOKEN2:', JSON.stringify(process.env.DISCORD_TOKEN2));
console.log('Token length:', process.env.DISCORD_TOKEN2?.length);

// --- Minimal Discord bot ---
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

console.log('Logging in...');
client.login(process.env.DISCORD_TOKEN2?.trim())  // <-- use the correct variable
  .then(() => console.log('🚀 Login successful'))
  .catch(err => console.error('❌ Login failed:', err));

// --- Express server to keep Render happy ---
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => res.send('Bot is alive!'));
app.listen(PORT, () => console.log(`🌐 Web server running on port ${PORT}`));
