import fetch from 'node-fetch';
import 'dotenv/config';

// Sample team data for testing
const testTeam = {
  manager: 'Red',
  teamName: 'Penguins',
  record: '10-4-2',
  streak: '3W',
  rival: 'Blue',
  highlight: 'Epic comeback win',
  lowlight: 'Crushing loss to Blue',
};

async function generateSeasonRecap(teamStats) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  console.log('OPENROUTER_API_KEY:', apiKey ? 'Loaded' : 'Missing');

  if (!apiKey) {
    console.error('❌ OPENROUTER_API_KEY not set in environment variables.');
    return '❌ API key missing.';
  }

  const prompt = `
  Write a brutally honest, hilarious, and slightly savage season recap for this NHL '95 team in an online league.

  Manager: ${teamStats.manager}
  Team: ${teamStats.teamName}
  Record: ${teamStats.record}
  Current Streak: ${teamStats.streak}
  Biggest Win: ${teamStats.biggestWin}
  Worst Loss: ${teamStats.worstLoss}
  Main Rival: ${teamStats.rival}

  Make fun of their embarrassing losses and questionable coaching decisions.  This is from the NHL95 sega game, so use those players and teams.
  Taunt them for their good plays like a jealous rival fan.
  Keep it under 150 words.
  Use the tone of a dramatic, unfiltered hockey blogger who thrives on chaos and chirping.
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
    return data.choices[0].message.content.trim();

  } catch (error) {
    console.error('Request failed:', error);
    return '❌ Recap generation failed due to a network error.';
  }
}

async function runTest() {
  const recap = await generateSeasonRecap(testTeam);
  console.log('\nSeason Recap:\n', recap);
}

runTest();
