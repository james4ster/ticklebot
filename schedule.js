import { nhlEmojiMap } from './nhlEmojiMap.js';
import { EmbedBuilder } from 'discord.js';

export async function handleScheduleCommand(interaction) {
  try {
    await interaction.deferReply();

    const discordId = interaction.user.id;
    const url = `https://script.google.com/macros/s/AKfycbxBqcP0J7vEfC-EavBD7kKMLP8wzjTymGoys5pgZwLD-TYokBEb5e3j7dL_dpOdFyiA/exec?report=schedule&discordId=${discordId}`;

    const res = await fetch(url);
    const json = await res.json();

    if (json.error) {
      return interaction.editReply(`❌ Failed to fetch your schedule: ${json.error}`);
    }

    const { record, schedule, userTeam, allTimeVsUpcoming, managerToTeam } = json.data;

    if (!schedule) {
      return interaction.editReply('❌ No schedule data found for your team.');
    }

    const emoji = (team) => nhlEmojiMap[team] || team;

    let message = `__**My name is Ed and my favorite movie is Nyad:**__\n\n`;
    message += `**Record:** ${record.wins}-${record.losses}-${record.ties}\n\n`;

    const formatGame = (game) => {
      const opponent = game.opponent;
      const isHome = game.homeSide;
      const homeTeam = isHome ? userTeam : opponent;
      const awayTeam = isHome ? opponent : userTeam;
      const vsString = `${emoji(homeTeam)} ${homeTeam} vs ${emoji(awayTeam)} ${awayTeam}`;
      const score = game.scoreString || '- — -';
      const outcome = game.result === 'W' ? '✅' : game.result === 'L' ? '❌' : '';
      return `${outcome} ${vsString} ${score}`;
    };

    if (schedule.wins.length) {
      message += `__**Wins:**__\n${schedule.wins.map(formatGame).join('\n')}\n\n`;
    }
    if (schedule.losses.length) {
      message += `__**Losses:**__\n${schedule.losses.map(formatGame).join('\n')}\n\n`;
    }
    if (schedule.unplayed.length) {
      message += `__**Upcoming Games:**__\n${schedule.unplayed.map(formatGame).join('\n')}\n\n`;
    }

    if (allTimeVsUpcoming && Object.keys(allTimeVsUpcoming).length) {
      message += `__**All Time Record vs Upcoming Opponents:**__\n`;
      for (const [manager, record] of Object.entries(allTimeVsUpcoming)) {
        const team = managerToTeam[manager];
        const teamEmoji = team ? nhlEmojiMap[team] || '' : '';
        message += `${teamEmoji} ${manager}: ${record.wins}-${record.losses}-${record.ties}\n`;
      }
    }

    if (message.length <= 2000) {
      // Send plain text if it fits within Discord's message limit
      await interaction.editReply(message);
    } else if (message.length <= 4096) {
      // Send as single embed if it fits within embed description limit
      const embed = new EmbedBuilder().setDescription(message);
      await interaction.editReply({ embeds: [embed] });
    } else {
      // Message too long: split into multiple embeds
      const chunks = splitMessage(message, 4096);
      const embeds = chunks.map(chunk => new EmbedBuilder().setDescription(chunk));
      await interaction.editReply({ embeds: [embeds[0]] });
      for (let i = 1; i < embeds.length; i++) {
        await interaction.followUp({ embeds: [embeds[i]] });
      }
    }

  } catch (error) {
    console.error('❌ Error in handleScheduleCommand:', error);
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply('❌ Failed to fetch your schedule.');
    } else {
      await interaction.reply('❌ Failed to fetch your schedule.');
    }
  }
}

function splitMessage(text, maxLength = 4096) {
  const lines = text.split('\n');
  const chunks = [];
  let chunk = '';

  for (const line of lines) {
    if ((chunk + line + '\n').length > maxLength) {
      chunks.push(chunk);
      chunk = '';
    }
    chunk += line + '\n';
  }

  if (chunk) chunks.push(chunk);
  return chunks;
}
