import { v4 as uuidv4 } from 'uuid';
import { db } from '../../lib/db'; // Your DB connection logic

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const {
    title,
    description,
    type,
    requirements,
    deadline,
    winners
  } = req.body;

  // Basic validation
  if (!title || !type || !deadline || !winners) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const id = uuidv4();
    const created_at = new Date().toISOString();

    // Insert into database
    await db.run(
      `INSERT INTO giveaways (
        id, title, description, type, requirements, deadline, max_winners, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        title,
        description || '',
        type,
        requirements || '',
        deadline,
        parseInt(winners),
        'active',
        created_at
      ]
    );

    return res.status(200).json({ message: 'Giveaway created successfully', id });
  } catch (error) {
    console.error('Error creating giveaway:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
      }
