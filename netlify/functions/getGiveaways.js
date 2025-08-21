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
    const giveawaysPath = path.join(process.cwd(), 'public', 'storage', 'giveaways.json');
    const giveaways = JSON.parse(fs.readFileSync(giveawaysPath, 'utf8'));

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
};
