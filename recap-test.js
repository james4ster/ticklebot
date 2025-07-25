// recap-test.js
import { generateSeasonRecap } from './recap.js';

const mockSeasonData = {
  season: 14,
  managers: [
    {
      manager: "Nips",
      team: "DAL",
      record: "11-5-0",
      rank: 22,
      gf: 76,
      ga: 51,
      streak: "1W",
      goaldiff: 25,
      shutouts: 0,
      penaltyPtsSeason: 0,
      goalsForPerGame: 4.75,
      goalsAgainstPerGame: 3.1875,
      winsRankSeason: 1,
      pointsRankSeason: 1,
      pointsPctRankSeason: 2,
      goalsForRankSeason: 1,
      goalsAgainstRankSeason: 7,
      goalDiffRankSeason: 9,
      allTimeMostWinsRank: 57,
      allTimeMostLossRank: 123,
      allTimeGoalsForPerGameRank: 39,
      allTimeGoalsAgainstPerGameRank: 46,
      allTimeShutoutsRank: 103,
      allTimePointsRank: 55,
      allTimePointsPctRank: 36,
      allTimeGoalDiffRank: 26,
      discordID: "874726051790594051",
      nhlTeam: "DAL",
      nhlEmoji: "<:NHLStars:1355924768171360406>",
      championships: 3
    }
  ]
};

  generateSeasonRecap(mockSeasonData.managers[0])
  .then(recap => {
    console.log("=== Season Recap ===");
    console.log(recap);
  })
  .catch(err => {
    console.error("Error generating recap:", err);
  });
