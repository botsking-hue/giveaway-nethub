import { getBlob, setBlob } from '@netlify/blobs';

export async function handler(event) {
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

    // Load entries from blob
    const entries = await getBlob({ bucket: 'default', key: 'entries' });
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
    const winnerLogs = await getBlob({ bucket: 'default', key: 'winner_logs' });

    // Add new winner log
    const winnerLogId = `winner-${Date.now()}`;
    winnerLogs.push({
      id: winnerLogId,
      giveawayId,
      winners,
      drawnAt: new Date().toISOString(),
    });

    // Save updated winner logs
    await setBlob({
      bucket: 'default',
      key: 'winner_logs',
      body: JSON.stringify(winnerLogs, null, 2),
    });

    // Load and update giveaways
    const giveaways = await getBlob({ bucket: 'default', key: 'giveaways' });
    const giveawayIndex = giveaways.findIndex(g => g.id === giveawayId);

    if (giveawayIndex !== -1) {
      giveaways[giveawayIndex].winners = winners;
      giveaways[giveawayIndex].updatedAt = new Date().toISOString();

      await setBlob({
        bucket: 'default',
        key: 'giveaways',
        body: JSON.stringify(giveaways, null, 2),
      });
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
        }
