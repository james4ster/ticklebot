// === Imports ===
import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

/*
// Full imports commented out for now
import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import fetch from 'node-fetch';
import express from 'express';
import fs from 'fs';

import { handleScheduleCommand } from './schedule.js';
import { nhlEmojiMap } from './nhlEmojiMap.js';
import { generateSeasonRecap } from './recap.js';
import { handleGuildMemberAdd } from './welcome.js';
import { parseSiriInput, postToDiscord } from './siriPost.js';

import { getSheetData } from './nhl95-elo-chart/fetchELO.js';
import { flattenEloHistory } from './nhl95-elo-chart/processELO.js';
import { buildDatasets } from './nhl95-elo-chart/datasets.js';
import { renderChart } from './nhl95-elo-chart/renderChart.js';

import QuickChart from 'quickchart-js';
*/

// === Discord Bot Setup ===
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

/*
// Optional: Welcome handler
// handleGuildMemberAdd(client);
*/

// === Debug: Show token length ===
console.log('DISCORD_TOKEN length:', process.env.DISCORD_TOKEN?.length);

// === Bot Online Confirmation ===
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

/*
// === All slash commands, Express server, Siri endpoint, message listeners, and ELO functions are commented out for now ===
*/

// === Login to Discord ===
(async () => {
  try {
    await client.login(process.env.DISCORD_TOKEN);
    console.log(`✅ Logged in as ${client.user.tag}`);
  } catch (err) {
    console.error('❌ Discord login failed:', err);
    console.error(err.stack);
  }
})();
