const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { giveawayId, numberOfWinners = 1 } = JSON.parse(event.body);
    
    if (!giveawayId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Giveaway ID is required' }),
      };
    }

    // Load entries
    const entriesPath = path.join(process.cwd(), 'public', 'storage', 'entries.json');
    const entries = JSON.parse(fs.readFileSync(entriesPath, 'utf8'));
    
    // Filter entries for this giveaway
    const giveawayEntries = entries.filter(entry => entry.giveawayId === giveawayId);

    if (giveawayEntries.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'No entries found for this giveaway' }),
      };
    }

    // Select random winners
    const winners = [];
    const entriesCopy = [...giveawayEntries];
    
    for (let i = 0; i < Math.min(numberOfWinners, entriesCopy.length); i++) {
      const randomIndex = Math.floor(Math.random() * entriesCopy.length);
      winners.push(entriesCopy.splice(randomIndex, 1)[0]);
    }

    // Load winner logs
    const winnersPath = path.join(process.cwd(), 'public', 'storage', 'winner_logs.json');
    const winnerLogs = JSON.parse(fs.readFileSync(winnersPath, 'utf8'));
    
    // Add new winner log
    const winnerLogId = `winner-${Date.now()}`;
    winnerLogs.push({
      id: winnerLogId,
      giveawayId,
      winners,
      drawnAt: new Date().toISOString(),
    });

    // Write back to winner logs
    fs.writeFileSync(winnersPath, JSON.stringify(winnerLogs, null, 2));

    // Update giveaway with winner info
    const giveawaysPath = path.join(process.cwd(), 'public', 'storage', 'giveaways.json');
    const giveaways = JSON.parse(fs.readFileSync(giveawaysPath, 'utf8'));
    
    const giveawayIndex = giveaways.findIndex(g => g.id === giveawayId);
    if (giveawayIndex !== -1) {
      giveaways[giveawayIndex].winners = winners;
      giveaways[giveawayIndex].updatedAt = new Date().toISOString();
      fs.writeFileSync(giveawaysPath, JSON.stringify(giveaways, null, 2));
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        winners,
        message: `Selected ${winners.length} winner(s) successfully`,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
