import { getBlob } from '@netlify/blobs';

export async function handler(event) {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const giveaways = await getBlob({
      bucket: 'default',
      key: 'giveaways',
    });

    return {
      statusCode: 200,
      body: JSON.stringify(giveaways),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
