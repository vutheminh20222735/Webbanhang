const fs = require('fs');
const path = require('path');

const apiUrl =
  process.env.API_URL ||
  process.env.NG_APP_API_URL ||
  'https://YOUR-RENDER-SERVICE.onrender.com/api';
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY || '';

const contents = `export const environment = {
  production: true,
  apiUrl: ${JSON.stringify(apiUrl)},
  stripePublicKey: ${JSON.stringify(stripePublicKey)}
};
`;

const target = path.join(__dirname, '..', 'src', 'environments', 'environment.prod.ts');
fs.writeFileSync(target, contents);
console.log('Wrote environment.prod.ts with apiUrl=', apiUrl);
