import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';

console.log('DISCORD_TOKEN:', process.env.DISCORD_TOKEN2);
console.log('Token length:', process.env.DISCORD_TOKEN2?.length);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

console.log('Logging in...');
client.login(process.env.DISCORD_TOKEN2?.trim())
  .then(() => console.log('🚀 Login successful'))
  .catch(err => console.error('❌ Login failed:', err));
