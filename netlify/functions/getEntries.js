export async function handler(event) {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method not allowed' })
    };
  }

  const giveawayId = event.queryStringParameters?.giveawayId;

  if (!giveawayId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing giveawayId in query' })
    };
  }

  try {
    const response = await fetch(`https://api.netlify.com/api/v1/blobs/${process.env.SITE_ID}/entries`, {
      headers: {
        Authorization: `Bearer ${process.env.BLOBS_API_TOKEN}`
      }
    });

    const allEntries = await response.json();

    // Filter entries by giveawayId
    const entries = allEntries.filter(entry => entry.giveaway_id === giveawayId);

    // Sort by submitted_at ascending
    entries.sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));

    return {
      statusCode: 200,
      body: JSON.stringify({ entries })
    };
  } catch (error) {
    console.error('Error fetching entries from Blobs:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
      }
