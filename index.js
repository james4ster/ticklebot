import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js';
import fetch from 'node-fetch';
import express from 'express';

import { handleScheduleCommand } from './schedule.js'; // <== newly modularized
import { nhlEmojiMap } from './nhlEmojiMap.js'; // still used locally if needed

// === Discord Bot Setup ===
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// GAS URLs
=======
// === Replace with your deployed Google Apps Script URLs ===
const gaUrl = 'https://script.google.com/macros/s/AKfycbxMleuxVvUA1SphdI5xD9RNOaCkZ40UQi_6SZuYnUFyX9ixgY3HZPDOvcDTYJaiKDoK/exec?report=ga';
const gfUrl = 'https://script.google.com/macros/s/AKfycbxMleuxVvUA1SphdI5xD9RNOaCkZ40UQi_6SZuYnUFyX9ixgY3HZPDOvcDTYJaiKDoK/exec?report=gf';
const shutoutsUrl = 'https://script.google.com/macros/s/AKfycbxMleuxVvUA1SphdI5xD9RNOaCkZ40UQi_6SZuYnUFyX9ixgY3HZPDOvcDTYJaiKDoK/exec?report=shutouts';

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
      const responses = await Promise.all([
        fetch(gaUrl),
        fetch(gfUrl),
        fetch(shutoutsUrl)
      ]);

      for (const res of responses) {
        const text = await res.text();
        if (res.ok) {
          console.log('✅ GAS response:', text.substring(0, 200));
        } else {
          console.error('❌ GAS error:', res.status, text.substring(0, 200));
        }
      }

      await interaction.editReply('Listen....Here are your reports. My name is Ed and I love dragons!');
    } catch (error) {
      console.error('❌ Error running reports:', error);
      await interaction.editReply('❌ I messed up.');
      await interaction.editReply('🎤 Listen....Here are your reports. My Name is Ed and I love dragons!');
    } catch (error) {
      console.error('❌ Error running reports:', error);
      await interaction.editReply('❌ I messed up running your reports.');
    }
  }

  if (interaction.commandName === 'schedule') {
    return handleScheduleCommand(interaction); // ⬅️ Calls your modular /schedule logic
  }
});

// === Slash Command Registration (Uncomment and run once to register commands) ===



/*
>>>>>>> 4d8aead (Save local changes before rebase)
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

    console.log('✅ Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('❌ Failed to register slash commands:', error);

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
