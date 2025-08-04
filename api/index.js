module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'TrashLinkPro Bot API',
    endpoints: {
      webhook: '/api/webhook',
      health: '/api/',
      sensorData: '/api/webhook (POST with height data)'
    }
  });
};
