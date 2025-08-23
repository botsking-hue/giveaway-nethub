import { getBlob, setBlob } from '@netlify/blobs';

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const newGiveaway = JSON.parse(event.body);
    const giveawayId = `giveaway-${Date.now()}`;

    // Load existing giveaways from blob
    const giveaways = await getBlob({ bucket: 'default', key: 'giveaways' });

    // Add new giveaway
    giveaways.push({
      ...newGiveaway,
      id: giveawayId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Save updated giveaways back to blob
    await setBlob({
      bucket: 'default',
      key: 'giveaways',
      body: JSON.stringify(giveaways, null, 2),
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        id: giveawayId,
        message: 'Giveaway created successfully' 
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
