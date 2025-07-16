  // === Imports ===
  import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js';
  import fetch from 'node-fetch';
  import express from 'express';

  import { handleScheduleCommand } from './schedule.js';
  import { nhlEmojiMap } from './nhlEmojiMap.js';

  // === Discord Bot Setup ===
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  // === GAS URLs ===
  const gaUrl = 'https://script.google.com/macros/s/AKfycbxJ8sllUfOitVMVESCTvlsOjlSBEAZL6z_bNjxaQ8_XdBw4OeEczJ_zFlkFToWRZJQL/exec?report=ga';
  const gfUrl = 'https://script.google.com/macros/s/AKfycbxJ8sllUfOitVMVESCTvlsOjlSBEAZL6z_bNjxaQ8_XdBw4OeEczJ_zFlkFToWRZJQL/exec?report=gf';
  const shutoutsUrl = 'https://script.google.com/macros/s/AKfycbxJ8sllUfOitVMVESCTvlsOjlSBEAZL6z_bNjxaQ8_XdBw4OeEczJ_zFlkFToWRZJQL/exec?report=shutouts';

  // === Bot Online Confirmation ===
  client.once('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
  });

  // === Slash Command Handler ===
  client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'reports') {
      await interaction.reply({ content: '📡 Running reports...', ephemeral: true });

      try {
        const responses = await Promise.all([
          fetch(gaUrl),
          fetch(gfUrl),
          fetch(shutoutsUrl)
        ]);

        const texts = await Promise.all(responses.map(res => res.text()));

        texts.forEach((text, i) => {
          const label = ['GA', 'GF', 'Shutouts'][i];
          console.log(`✅ ${label} Response:\n`, text.substring(0, 200));
        });

        await interaction.channel.send({
          content: `🎤 **Here are your reports**\n\n📊 **Goals Against**\n${texts[0]}\n\n🚀 **Goals For**\n${texts[1]}\n\n🧱 **Shutouts**\n${texts[2]}`
        });

      } catch (error) {
        console.error('❌ Error running reports:', error);
        await interaction.channel.send('❌ I messed up running your reports.');
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
