import { google } from 'googleapis';
import fs from 'fs';

const KEYFILE_PATH = './pnpl_service_account.json'; // path to your service account
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

export async function getSheetData(range) {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILE_PATH,
    scopes: SCOPES,
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = '19xiNC-8xF5q8iaro_thpxwyoaUSsPy1Xv28XSIEz5S8'; // put your Sheet ID

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  return response.data.values || [];
}
