import { db } from '../../lib/db'; // Your DB connection
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { giveawayId } = req.body;

  if (!giveawayId) {
    return res.status(400).json({ message: 'Missing giveawayId' });
  }

  try {
    // Get giveaway details
    const giveaway = await db.get(
      `SELECT max_winners, type FROM giveaways WHERE id = ?`,
      [giveawayId]
    );

    if (!giveaway) {
      return res.status(404).json({ message: 'Giveaway not found' });
    }

    // Get eligible entries
    const entries = await db.all(
      `SELECT id FROM entries WHERE giveaway_id = ? AND is_winner = 0`,
      [giveawayId]
    );

    if (entries.length === 0) {
      return res.status(200).json({ message: 'No eligible entries found' });
    }

    // Shuffle and pick winners
    const shuffled = entries.sort(() => 0.5 - Math.random());
    const winners = shuffled.slice(0, giveaway.max_winners);

    // Update winners and log them
    for (const winner of winners) {
      await db.run(
        `UPDATE entries SET is_winner = 1 WHERE id = ?`,
        [winner.id]
      );

      await db.run(
        `INSERT INTO winner_logs (id, giveaway_id, entry_id, method, selected_at)
         VALUES (?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          giveawayId,
          winner.id,
          'random',
          new Date().toISOString()
        ]
      );
    }

    return res.status(200).json({
      message: 'Winners selected successfully',
      winnerIds: winners.map(w => w.id)
    });
  } catch (error) {
    console.error('Error picking winners:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
