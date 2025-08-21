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
    const giveawaysPath = path.join(process.cwd(), 'public', 'storage', 'giveaways.json');
    const giveaways = JSON.parse(fs.readFileSync(giveawaysPath, 'utf8'));
    
    const newGiveaway = JSON.parse(event.body);
    const giveawayId = `giveaway-${Date.now()}`;
    
    // Add new giveaway
    giveaways.push({
      ...newGiveaway,
      id: giveawayId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Write back to file
    fs.writeFileSync(giveawaysPath, JSON.stringify(giveaways, null, 2));

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
};
