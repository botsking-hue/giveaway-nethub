const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const entriesPath = path.join(process.cwd(), 'public', 'storage', 'entries.json');
    const entries = JSON.parse(fs.readFileSync(entriesPath, 'utf8'));
    
    const newEntry = JSON.parse(event.body);
    const entryId = `entry-${Date.now()}`;
    
    // Add new entry
    entries.push({
      ...newEntry,
      id: entryId,
      createdAt: new Date().toISOString(),
    });

    // Write back to file
    fs.writeFileSync(entriesPath, JSON.stringify(entries, null, 2));

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
};
