// siriPost.js
import fetch from "node-fetch";

// ---- Discord webhook ----
const DISCORD_WEBHOOK_URL = process.env.DISCORD_PURE_SCORES_WEBHOOK;

// ---- Team mapping ----
const teamMap = {
  "anaheim": "ANA", "ducks": "ANA",
  "boston": "BOS", "bruins": "BOS", "bruin": "BOS",
  "buffalo": "BUF", "sabres": "BUF", "sabre": "BUF",
  "calgary": "CAL", "flames": "CAL",
  "chicago": "CHI", "blackhawks": "CHI",
  "dallas": "DAL", "stars": "DAL",
  "detroit": "DET", "red wings": "DET",
  "edmonton": "EDM", "oilers": "EDM",
  "florida": "FLA", "panthers": "FLA",
  "hartford": "HFD", "whalers": "HFD", "whaler": "HFD", "whale": "HFD",
  "los angeles": "LAK", "kings": "LAK",
  "montreal": "MTL", "canadiens": "MTL", "canadians": "MTL",
  "new jersey": "NJD", "devils": "NJD",
  "new york islanders": "NYI", "islanders": "NYI", "highlanders": "NYI",
  "new york rangers": "NYR", "rangers": "NYR",
  "ottawa": "OTT", "senators": "OTT",
  "philadelphia": "PHL", "flyers": "PHL",
  "pittsburgh": "PIT", "penguins": "PIT",
  "quebec": "QUE", "nordiques": "QUE",
  "san jose": "SJS", "sharks": "SJS",
  "st. louis": "STL", "st louis": "STL", "blues": "STL",
  "tampa bay": "TBL", "lightning": "TBL",
  "toronto": "TOR", "leafs": "TOR",
  "vancouver": "VAN", "canucks": "VAN",
  "washington": "WAS", "capitals": "WAS",
  "winnipeg": "WPG", "jets": "WPG", "jet's": "WPG"
};

// ---- Number mapping ----
const numberMap = {
  "zero": 0, "oh": 0,
  "one": 1, "won": 1,
  "two": 2, "to": 2, "too": 2,
  "three": 3,
  "four": 4, "for": 4,
  "five": 5,
  "six": 6,
  "seven": 7,
  "eight": 8, "ate": 8,
  "nine": 9,
  "ten": 10,
  "eleven": 11,
  "twelve": 12,
  "thirteen": 13,
  "fourteen": 14,
  "fifteen": 15,
  "sixteen": 16,
  "seventeen": 17,
  "eighteen": 18,
  "nineteen": 19,
  "twenty": 20
};

function convertNumberWord(word) {
  const cleaned = word.toLowerCase();
  if (!isNaN(cleaned)) return parseInt(cleaned, 10);
  return numberMap[cleaned] ?? null;
}

// ---- Parse Siri input ----
export function parseSiriInput(input) {
  input = input.replace(/^!siri\s*/i, "").trim();
  input = input.replace(/[-–—]/g, " "); // replace any dashes with spaces
  input = input.replace(/'/g, ""); // remove apostrophes
  const words = input.split(/\s+/);

  let teams = [];
  let scores = [];
  let currentTeam = [];

  for (let i = 0; i < words.length; i++) {
    const num = convertNumberWord(words[i]);
    if (num !== null) {
      if (currentTeam.length === 0) throw new Error("Invalid input, team missing");
      teams.push(currentTeam.join(" "));
      scores.push(num);
      currentTeam = [];
    } else {
      currentTeam.push(words[i]);
    }
  }

  if (teams.length !== 2 || scores.length !== 2) {
    throw new Error("Could not parse input. Format must be: <Team> <score> <Team> <score>");
  }

  const awayAbbr = teamMap[teams[0].toLowerCase()] || teams[0].toUpperCase();
  const homeAbbr = teamMap[teams[1].toLowerCase()] || teams[1].toUpperCase();

  return {
    awayTeam: awayAbbr,
    awayScore: scores[0],
    homeTeam: homeAbbr,
    homeScore: scores[1]
  };
}

// ---- Post to Discord ----
export async function postToDiscord(content) {
  const res = await fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error(`Discord post failed: ${res.statusText}`);
}

// ---- Optional: Standalone CLI Test ----
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const input = process.argv.slice(2).join(" ");
    if (!input) {
      console.error("No input provided. Usage: node siriPost.js \"<team> <score> <team> <score>\"");
      process.exit(1);
    }

    try {
      const result = parseSiriInput(input);
      const message = `${result.awayTeam} ${result.awayScore} - ${result.homeTeam} ${result.homeScore}`;
      await postToDiscord(message);
      console.log("Your score was posted nerd!");
    } catch (err) {
      console.error("Error:", err.message);
    }
  })();
}
