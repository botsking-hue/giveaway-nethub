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
    const { id } = event.queryStringParameters;
    
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Entry ID is required' }),
      };
    }

    const entriesPath = path.join(process.cwd(), 'public', 'storage', 'entries.json');
    const entries = JSON.parse(fs.readFileSync(entriesPath, 'utf8'));
    
    const entry = entries.find(e => e.id === id);

    if (!entry) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Entry not found' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(entry),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
