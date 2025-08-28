// index.js
import "dotenv/config.js"; // ✅ loads .env automatically
import { Client, GatewayIntentBits } from "discord.js";

// === Create Discord Client ===
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// === Ready Event ===
client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// === Error Handling ===
client.on("error", (err) => {
  console.error("❌ Discord client error:", err);
});
client.on("shardError", (err) => {
  console.error("❌ Shard error:", err);
});

// === Check and Login ===
const token = process.env.DISCORD_TOKEN?.trim();
if (!token) {
  console.error("❌ No DISCORD_TOKEN found in environment variables!");
  process.exit(1);
}

client.login(token).catch((err) => {
  console.error("❌ Login failed:", err);
});
