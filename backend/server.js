'use strict';

const express = require('express');

const PORT = 4000;
const HOST = '0.0.0.0';

const app = express();
app.get('/pools', (req, res) => {
  res.send('Hello World ' + new Date().toISOString());
});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
