export async function handler(event) {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method not allowed' })
    };
  }

  try {
    const response = await fetch(`https://api.netlify.com/api/v1/blobs/${process.env.SITE_ID}/giveaways`, {
      headers: {
        Authorization: `Bearer ${process.env.BLOBS_API_TOKEN}`
      }
    });

    const giveaways = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify({ giveaways })
    };
  } catch (error) {
    console.error('Error fetching giveaways:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
}
