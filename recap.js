export async function generateSeasonRecap(teamStats) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('❌ OPENROUTER_API_KEY not set.');
    return '❌ API key missing.';
  }

  const {
    manager,
    team = 'Unknown',
    record,
    streak,
    rank = 'unknown',            // Use rank instead of place here
    gf = 0,
    ga = 0,
    goaldiff = 0,
    shutouts = 0,
    penaltyPtsSeason = 0,
    goalsForPerGame = 0,
    goalsAgainstPerGame = 0,
    winsRankSeason = 'N/A',
    lossesRankSeason = 'N/A',    // Added losses rank for GA rank
    pointsRankSeason = 'N/A',
    pointsPctRankSeason = 'N/A',
    goalsForRankSeason = 'N/A',
    goalsAgainstRankSeason = 'N/A',
    goalDiffRankSeason = 'N/A',
    allTimeMostWinsRank = 'N/A',
    allTimeMostLossRank = 'N/A',
    allTimeGoalsForPerGameRank = 'N/A',
    allTimeGoalsAgainstPerGameRank = 'N/A',
    allTimeShutoutsRank = 'N/A',
    allTimePointsRank = 'N/A',
    allTimePointsPctRank = 'N/A',
    allTimeGoalDiffRank = 'N/A',
    discordID = '',
    nhlTeam = '',
    nhlEmoji = '',
    championships = 0
  } = teamStats;

  const prompt = `
Write a hilarious, slightly offensive season recap for this NHL '95 team in an online league. Include as many of the following stats and rankings as possible, and feel free to roast the manager:

Manager: ${manager}
Team: ${team} ${nhlEmoji}
Record: ${record}
Current Streak: ${streak}
Current Place in Standings: ${rank}
Goals For: ${gf}, Goals Against: ${ga}
Goals For Per Game: ${goalsForPerGame.toFixed(2)} (Rank: ${goalsForRankSeason} | All-Time Rank: ${allTimeGoalsForPerGameRank})
Goals Against Per Game: ${goalsAgainstPerGame.toFixed(2)} (Rank: ${goalsAgainstRankSeason} | All-Time Rank: ${allTimeGoalsAgainstPerGameRank})
Goal Differential: ${goaldiff} (Rank: ${goalDiffRankSeason} | All-Time Rank: ${allTimeGoalDiffRank})
Shutouts: ${shutouts} (All-Time Rank: ${allTimeShutoutsRank})
Penalty Points This Season: ${penaltyPtsSeason}
Championships Won: ${championships}

Season Ranks:
* Wins: ${winsRankSeason}
* Points: ${pointsRankSeason}
* Points %: ${pointsPctRankSeason}

All-Time Ranks:
* Most Wins: ${allTimeMostWinsRank}
* Most Losses: ${allTimeMostLossRank}
* Points: ${allTimePointsRank}
* Points %: ${allTimePointsPctRank}
* Goal Differential: ${allTimeGoalDiffRank}

Keep it under 200 words.
Use a dramatic, unfiltered hockey blogger voice that thrives on chaos and chirping.
Use humor, sarcasm, and spicy commentary.
`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://ticklebot.onrender.com',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.9,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenRouter API Error:', error);
      return '🚨 Could not generate recap. Blame the hockey gods.';
    }

    const data = await response.json();
    const recapText = data.choices[0].message.content.trim();

    const statsBreakout = `
Congrats on not quitting, ${manager}.

${nhlEmoji} ${team}
Record: ${record}
Current Streak: ${streak}
Current Place: ${rank}

Goals For: ${gf} 
Goals Against: ${ga}
Goals For Per Game: ${goalsForPerGame.toFixed(2)} (Rank: ${goalsForRankSeason} | All-Time Rank: ${allTimeGoalsForPerGameRank})
Goals Against Per Game: ${goalsAgainstPerGame.toFixed(2)} (Rank: ${goalsAgainstRankSeason} | All-Time Rank: ${allTimeGoalsAgainstPerGameRank})
Goal Differential: ${goaldiff} (Rank: ${goalDiffRankSeason} | All-Time Rank: ${allTimeGoalDiffRank})
Shutouts: ${shutouts} (All-Time Rank: ${allTimeShutoutsRank})
Penalty Points: ${penaltyPtsSeason}

Season Ranks:
* Wins: ${winsRankSeason}
* Points: ${pointsRankSeason}
* Points %: ${pointsPctRankSeason}

All-Time Ranks:
* Most Wins: ${allTimeMostWinsRank}
* Most Losses: ${allTimeMostLossRank}
* Points: ${allTimePointsRank}
* Points %: ${allTimePointsPctRank}
* Goal Differential: ${allTimeGoalDiffRank}
`;

    return `${statsBreakout}\n${recapText}`;

  } catch (error) {
    console.error('Request failed:', error);
    return '❌ Recap generation failed due to a network error.';
  }
}
