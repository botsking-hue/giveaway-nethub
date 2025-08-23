import { getBlob, setBlob } from '@netlify/blobs';

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const newEntry = JSON.parse(event.body);
    const entryId = `entry-${Date.now()}`;

    // Load existing entries from blob
    const entries = await getBlob({ bucket: 'default', key: 'entries' });

    // Add new entry
    entries.push({
      ...newEntry,
      id: entryId,
      createdAt: new Date().toISOString(),
    });

    // Save updated entries back to blob
    await setBlob({
      bucket: 'default',
      key: 'entries',
      body: JSON.stringify(entries, null, 2),
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        id: entryId,
        message: 'Entry created successfully' 
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
