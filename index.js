// === Imports ===
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js';
import fetch from 'node-fetch';
import express from 'express';

import { handleScheduleCommand } from './schedule.js';
import { nhlEmojiMap } from './nhlEmojiMap.js';

// === Discord Bot Setup ===
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// === GAS URLs ===
const gaUrl = 'https://script.google.com/macros/s/AKfycbyXJYTr-D3kUQ2ZoDL4_5Mr19baxphM0TkSnV6XX-J9QT4e52wP2V9iKB68BROnceY7/exec?report=ga';
const gfUrl = 'https://script.google.com/macros/s/AKfycbyXJYTr-D3kUQ2ZoDL4_5Mr19baxphM0TkSnV6XX-J9QT4e52wP2V9iKB68BROnceY7/exec?report=gf';
const shutoutsUrl = 'https://script.google.com/macros/s/AKfycbyXJYTr-D3kUQ2ZoDL4_5Mr19baxphM0TkSnV6XX-J9QT4e52wP2V9iKB68BROnceY7/exec?report=shutouts';

// === Bot Online Confirmation ===
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// === Slash Command Handler ===
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === 'reports') {
    await interaction.deferReply();

    try {
      // Fetch all 3 chart URLs from GAS
      const responses = await Promise.all([
        fetch(gaUrl),
        fetch(gfUrl),
        fetch(shutoutsUrl)
      ]);

      const [gaChartUrl, gfChartUrl, shutoutsChartUrl] = await Promise.all(responses.map(res => res.text()));

      // Send embeds in the same channel
      await interaction.editReply({
        content: '🎤 Here are your reports:',
        embeds: [
          {
            title: "🛡️ All-Time Goals Against per Game (Min 30 GP)",
            image: { url: gaChartUrl },
            color: 0xe74c3c
          },
          {
            title: "🔥 All-Time Goals For per Game (Min 30 GP)",
            image: { url: gfChartUrl },
            color: 0x27ae60
          },
          {
            title: "🥅 All Time Shutouts",
            image: { url: shutoutsChartUrl },
            color: 0x3498db
          }
        ]
      });
    } catch (error) {
      console.error('❌ Error running reports:', error);
      await interaction.editReply('❌ I messed up running your reports.');
    }
  }

  if (interaction.commandName === 'schedule') {
    return handleScheduleCommand(interaction);
  }
});

// === Slash Command Registration (Run once or on updates) ===
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('🚀 Registering slash commands...');

    const commands = [
      new SlashCommandBuilder()
        .setName('reports')
        .setDescription('Run all the reports'),
      new SlashCommandBuilder()
        .setName('schedule')
        .setDescription('Get your remaining opponents')
    ].map(cmd => cmd.toJSON());

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log('✅ Slash commands registered.');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
})();

// === Express Server to Keep Replit Awake ===
const app = express();
app.get('/', (req, res) => {
  res.send('🟢 TickleBot is alive and ready to serve!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});

// === Login to Discord ===
client.login(process.env.DISCORD_TOKEN);
