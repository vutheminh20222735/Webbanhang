const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const helmet = require('helmet');

module.exports = function applySecurity(app) {
  // trust proxy for secure cookies and HSTS when behind reverse proxies
  try { app.set('trust proxy', 1); } catch (e) {}

  // basic helmet with CSP
  app.use(helmet());
  app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true }));
  app.use(helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "img-src": ["'self'", 'data:', 'https:'],
      "script-src": ["'self'", "'unsafe-inline'"],
      "style-src": ["'self'", "'unsafe-inline'"],
    }
  }));

  // sanitize req.body, req.query
  app.use(mongoSanitize());
  app.use(xss());

  // enforce HTTPS in production
  app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
  });
};
