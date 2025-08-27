import { google } from "googleapis";

// 1️⃣ Google Auth using your service account JSON file
const auth = new google.auth.GoogleAuth({
  keyFile: "pnpl_service_account.json",  // <-- your JSON file
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

// 2️⃣ Sheets client
const sheets = google.sheets({ version: "v4", auth });

// 3️⃣ Function to get rows from a sheet
async function getSheetData(spreadsheetId, sheetName) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:Z`,
  });
  return res.data.values; // rows as array of arrays
}

// 4️⃣ Test function
async function main() {
  const spreadsheetId = process.env.SPREADSHEET_ID; // make sure this is set
  const rows = await getSheetData(spreadsheetId, "LogoMaster");
  console.log(rows);
}

main().catch(console.error);
