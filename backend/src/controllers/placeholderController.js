exports.health = (req, res) => res.json({ success: true, data: { uptime: process.uptime() } });
