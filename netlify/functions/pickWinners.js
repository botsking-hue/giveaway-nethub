import { v4 as uuidv4 } from 'uuid';

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method not allowed' })
    };
  }

  const { giveawayId } = JSON.parse(event.body);

  if (!giveawayId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing giveawayId' })
    };
  }

  try {
    // Fetch giveaway details
    const giveawayRes = await fetch(`https://api.netlify.com/api/v1/blobs/${process.env.SITE_ID}/giveaways`, {
      headers: {
        Authorization: `Bearer ${process.env.BLOBS_API_TOKEN}`
      }
    });
    const giveaways = await giveawayRes.json();
    const giveaway = giveaways.find(g => g.id === giveawayId);

    if (!giveaway) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Giveaway not found' })
      };
    }

    // Fetch entries
    const entriesRes = await fetch(`https://api.netlify.com/api/v1/blobs/${process.env.SITE_ID}/entries`, {
      headers: {
        Authorization: `Bearer ${process.env.BLOBS_API_TOKEN}`
      }
    });
    const allEntries = await entriesRes.json();
    const eligibleEntries = allEntries.filter(e => e.giveaway_id === giveawayId && e.is_winner === 0);

    if (eligibleEntries.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No eligible entries found' })
      };
    }

    // Pick winners
    const shuffled = eligibleEntries.sort(() => 0.5 - Math.random());
    const winners = shuffled.slice(0, giveaway.max_winners);

    // Update winners and log them
    const updatePromises = winners.map(async winner => {
      // Update entry
      await fetch(`https://api.netlify.com/api/v1/blobs/${process.env.SITE_ID}/entries/${winner.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.BLOBS_API_TOKEN}`
        },
        body: JSON.stringify({ is_winner: 1 })
      });

      // Log winner
      await fetch(`https://api.netlify.com/api/v1/blobs/${process.env.SITE_ID}/winner_logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.BLOBS_API_TOKEN}`
        },
        body: JSON.stringify({
          id: uuidv4(),
          giveaway_id: giveawayId,
          entry_id: winner.id,
          method: 'random',
          selected_at: new Date().toISOString()
        })
      });
    });

    await Promise.all(updatePromises);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Winners selected successfully',
        winnerIds: winners.map(w => w.id)
      })
    };
  } catch (error) {
    console.error('Error picking winners:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
      }
