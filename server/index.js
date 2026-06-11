// Standalone server entry point
// Imports the Express app and starts listening on a port

require('dotenv').config({ path: __dirname + '/.env' });
const app = require('./app');

const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

app.listen(PORT, '0.0.0.0', () => {
  console.log(`EasyPay server running on http://0.0.0.0:${PORT} [${isProduction ? 'production' : 'development'}]`);
});