// testRecap.js
import { generateSeasonRecap } from './recap.js';

const mockTeamStats = {
  manager: "Jamie",
  teamName: "TOR",               // Must match recap.js expected key
  record: "35-15-2",             // String format W-L-T
  streak: "W5",
  rival: "Montreal",
  biggestWin: "6–1 vs Rangers",
  worstLoss: "1–7 vs Capitals"
};

generateSeasonRecap(mockTeamStats)
  .then(recap => {
    console.log("=== Season Recap ===");
    console.log(recap);
  })
  .catch(err => {
    console.error("Error generating recap:", err);
  });
