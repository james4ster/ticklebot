// index.js
console.log("Running Node version:", process.version);

import dotenv from "dotenv";
import express from "express";
import { Client, GatewayIntentBits, REST, Routes } from "discord.js";

dotenv.config();

// === Discord bot setup ===
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// Example slash command
const commands = [
  {
    name: "ping",
    description: "Replies with Pong!",
  },
];

(async () => {
  try {
    console.log("🚀 Registering slash commands...");
    const rest = new REST({ version: "10" }).setToken(
      process.env.DISCORD_TOKEN?.trim()
    );
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });
    console.log("✅ Slash commands registered");
  } catch (error) {
    console.error("❌ Failed to register slash commands:", error);
  }
})();

// Slash command handler
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === "ping") {
    await interaction.reply("Pong!");
  }
});

// Start the Discord bot
client.login(process.env.DISCORD_TOKEN?.trim());

// === Express server for Render ===
const app = express();
const PORT = process.env.PORT || 10000;

app.get("/", (req, res) => {
  res.send("✅ TickleBot is running!");
});

app.listen(PORT, () => {
  console.log(`🌐 Express server running on port ${PORT}`);
});
