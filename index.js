import 'dotenv/config'; // optional if you use a local .env file
import { Client, GatewayIntentBits } from 'discord.js';
import express from 'express';

// === Minimal bot setup ===
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

// === Express server to keep Render happy ===
const app = express();
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.send('🟢 TickleBot is alive and ready!');
});

// Example API endpoint
app.post('/api/example', (req, res) => {
  res.json({ message: 'This endpoint works!' });
});

// Start server on Render port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});
