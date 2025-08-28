  import 'dotenv/config';
  import express from 'express';
  import { Client, GatewayIntentBits } from 'discord.js';

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.once('ready', () => console.log(`✅ Logged in as ${client.user.tag}`));

  console.log('Logging in...');
  client.login(process.env.DISCORD_TOKEN?.trim())
    .then(() => console.log('🚀 Login successful'))
    .catch(err => console.error('❌ Login failed:', err));

  const app = express();
  const PORT = process.env.PORT || 10000;

  app.get('/', (req, res) => res.send('Bot is alive!'));
  app.listen(PORT, () => console.log(`🌐 Web server running on port ${PORT}`));
