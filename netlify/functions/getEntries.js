const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const entriesPath = path.join(process.cwd(), 'public', 'storage', 'entries.json');
    const entries = JSON.parse(fs.readFileSync(entriesPath, 'utf8'));
    
    const { giveawayId } = event.queryStringParameters || {};
    
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
};
