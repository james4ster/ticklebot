import { google } from 'googleapis';

// Parse the service account JSON from environment variable
const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

async function accessSpreadsheet() {
  // Create JWT auth client
  const auth = new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key,
    ['https://www.googleapis.com/auth/spreadsheets']
  );

  // Create Sheets API client
  const sheets = google.sheets({ version: 'v4', auth });

  // Your spreadsheet ID from URL
  const spreadsheetId = '19xiNC-8xF5q8iaro_thpxwyoaUSsPy1Xv28XSIEz5S8';

  // Range you want to read (example: first 1000 rows and columns A to Z in RawStandings)
  const range = 'RawStandings!A1:Z1000';

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('No data found.');
      return;
    }

    console.log('Data from sheet:');
    rows.forEach((row) => {
      console.log(row.join(', '));
    });
  } catch (error) {
    console.error('Error accessing spreadsheet:', error);
  }
}

// Run the function
accessSpreadsheet();
