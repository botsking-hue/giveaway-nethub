import { getBlob } from '@netlify/blobs';

export async function handler(event) {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { giveawayId } = event.queryStringParameters || {};

    // Fetch entries from blob storage
    const entries = await getBlob({
      bucket: 'default',
      key: 'entries',
    });

    // Filter by giveawayId if provided
    const filteredEntries = giveawayId
      ? entries.filter(entry => entry.giveawayId === giveawayId)
      : entries;

    return {
      statusCode: 200,
      body: JSON.stringify(filteredEntries),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
        }
