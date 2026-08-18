require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const applySecurity = require('./middleware/security');

const PORT = process.env.PORT || 5000;

const app = express();
// apply stronger security middlewares (CSP, sanitize, xss)
applySecurity(app);
const clientOrigin = (process.env.CLIENT_URL || '*').replace(/\/$/, '');
app.use(cors({ origin: clientOrigin }));
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({ windowMs: 60 * 1000, max: 120 });
app.use(limiter);

app.use('/api', routes);

app.get('/', (req, res) => res.json({ success: true, message: 'Phone Shop API' }));

app.use(errorHandler);

connectDB()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to start server', err);
    process.exit(1);
  });
