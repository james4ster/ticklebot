// wheelBot.js
import { google } from 'googleapis';

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const CREDENTIALS = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

export async function spinWheel() {
  // Authenticate
  const auth = new google.auth.GoogleAuth({
    credentials: CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  // Fetch logos (column D)
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'LogoMaster!D2:D',
  });

  const logos = res.data.values?.flat().filter(Boolean);
  if (!logos || !logos.length) throw new Error('No logos found!');

  // Pick a random logo
  const randomLogo = logos[Math.floor(Math.random() * logos.length)];
  return randomLogo;
}
