import { v4 as uuidv4 } from 'uuid';

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method not allowed' })
    };
  }

  const {
    title,
    description,
    type,
    requirements,
    deadline,
    winners
  } = JSON.parse(event.body);

  if (!title || !type || !deadline || !winners) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing required fields' })
    };
  }

  const id = uuidv4();
  const created_at = new Date().toISOString();

  const giveaway = {
    id,
    title,
    description: description || '',
    type,
    requirements: requirements || '',
    deadline,
    max_winners: parseInt(winners),
    status: 'active',
    created_at
  };

  try {
    const response = await fetch(`https://api.netlify.com/api/v1/blobs/${process.env.SITE_ID}/giveaways`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.BLOBS_API_TOKEN}`
      },
      body: JSON.stringify(giveaway)
    });

    const result = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Giveaway created successfully', id: result.id })
    };
  } catch (error) {
    console.error('Error saving to Netlify Blobs:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
    }
