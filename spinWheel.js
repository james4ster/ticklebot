import fetch from 'node-fetch';
import { GoogleSpreadsheet } from 'google-spreadsheet';

// Shared state
let draftState = {
  remainingTeams: [],
  coachStatus: {}
};


// Fetch teams from Google Sheets (LogoMaster tab)
export async function getTeams(spreadsheetId, sheetName) {
  const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  
  // --- v5+ authentication: pass creds in constructor ---
  const doc = new GoogleSpreadsheet(spreadsheetId, {
    client_email: creds.client_email,
    private_key: creds.private_key.replace(/\\n/g, '\n'),
  });

  await doc.loadInfo(); // load sheet info
  const sheet = doc.sheetsByTitle[sheetName];
  const rows = await sheet.getRows();

  return rows.map(row => ({
    name: row.Name,
    logo: row.Logo,
  }));
}

export { draftState };


// Spin the wheel using Wheel of Names API
export async function spinWheel(participants, apiKey) {
  const wheelResponse = await fetch('https://wheelofnames.com/api/v1/wheels', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify({ participants })
  });
  const wheelData = await wheelResponse.json();
  const wheelId = wheelData.id;

  const spinResponse = await fetch(`https://wheelofnames.com/api/v1/wheels/${wheelId}/spin`, {
    method: 'POST',
    headers: { 'x-api-key': apiKey }
  });
  const spinData = await spinResponse.json();

  return { winner: spinData.winner, wheelUrl: `https://wheelofnames.com/w/${wheelId}` };
}
