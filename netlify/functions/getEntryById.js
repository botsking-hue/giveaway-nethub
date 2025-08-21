export async function handler(event) {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method not allowed' })
    };
  }

  const entryId = event.queryStringParameters?.id;

  if (!entryId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing entry ID' })
    };
  }

  try {
    const response = await fetch(`https://api.netlify.com/api/v1/blobs/${process.env.SITE_ID}/entries/${entryId}`, {
      headers: {
        Authorization: `Bearer ${process.env.BLOBS_API_TOKEN}`
      }
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ message: 'Entry not found' })
      };
    }

    const entry = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(entry)
    };
  } catch (error) {
    console.error('Error fetching entry:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
}
