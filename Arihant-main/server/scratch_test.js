const express = require('express');
const app = express();
try {
  app.options(/(.*)/, (req, res) => res.send('ok'));
  console.log('regex worked');
} catch (e) { console.error('regex failed:', e.message); }
try {
  app.options('{*splat}', (req, res) => res.send('ok'));
  console.log('splat worked');
} catch (e) { console.error('splat failed:', e.message); }
