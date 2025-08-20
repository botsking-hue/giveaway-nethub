
import { db } from '../../lib/db'; // Your database connection

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { giveawayId } = req.query;

  if (!giveawayId) {
    return res.status(400).json({ message: 'Missing giveawayId in query' });
  }

  try {
    const entries = await db.all(
      `SELECT id, name, telegram_handle, phone, submitted_at, is_winner
       FROM entries
       WHERE giveaway_id = ?
       ORDER BY submitted_at ASC`,
      [giveawayId]
    );

    return res.status(200).json({ entries });
  } catch (error) {
    console.error('Error fetching entries:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
      }
