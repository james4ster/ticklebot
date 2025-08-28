// wheelBot-render.js
import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import { google } from 'googleapis';

// Discord client
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Use the existing Render secret
const CREDENTIALS = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

const SPREADSHEET_ID = process.env.SPREADSHEET_ID; // your spreadsheet ID secret

// Function to fetch logos from Google Sheets
async function getLogos() {
  const auth = new google.auth.GoogleAuth({
    credentials: CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'LogoMaster!D2:D', // only column D for logos
  });

  return res.data.values?.flat().filter(Boolean) || [];
}

// Discord ready
client.once('ready', () => console.log(`Logged in as ${client.user.tag}!`));

// Command handler
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;
  if (interaction.commandName === 'spin') {
    await interaction.deferReply();

    const logos = await getLogos();
    if (!logos.length) return interaction.editReply('No logos to spin!');

    const msg = await interaction.editReply({ content: '🎡 Spinning the wheel...' });

    // Simulate spinning
    for (let i = 0; i < 6; i++) {
      const randomLogo = logos[Math.floor(Math.random() * logos.length)];
      const embed = new EmbedBuilder()
        .setTitle('🎡 Spinning...')
        .setImage(randomLogo);
      await msg.edit({ embeds: [embed] });
      await new Promise(res => setTimeout(res, 500));
    }

    // Final selection
    const finalLogo = logos[Math.floor(Math.random() * logos.length)];
    const finalEmbed = new EmbedBuilder()
      .setTitle('🎉 Wheel stopped! Selected logo:')
      .setImage(finalLogo);
    await msg.edit({ embeds: [finalEmbed] });
  }
});

// Login
client.login(process.env.DISCORD_TOKEN);
