export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method not allowed' })
    };
  }

  const entry = JSON.parse(event.body);

  // Basic validation
  if (!entry.name || !entry.telegram_handle || !entry.phone || !entry.giveaway_id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing required fields' })
    };
  }

  try {
    const response = await fetch(`https://api.netlify.com/api/v1/blobs/${process.env.SITE_ID}/entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.BLOBS_API_TOKEN}`
      },
      body: JSON.stringify(entry)
    });

    const result = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Entry created successfully', id: result.id })
    };
  } catch (error) {
    console.error('Error creating entry:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
}
