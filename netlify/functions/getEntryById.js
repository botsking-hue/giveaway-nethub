import { getBlob } from '@netlify/blobs';

export async function handler(event) {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { id } = event.queryStringParameters;

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Giveaway ID is required' }),
      };
    }

    const giveaways = await getBlob({
      bucket: 'default',
      key: 'giveaways',
    });

    const giveaway = giveaways.find(g => g.id === id);

    if (!giveaway) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Giveaway not found' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(giveaway),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
                              }
