'use strict';

const express = require('express');

const PORT = 4000;
const HOST = '0.0.0.0';

const app = express();
app.get('/pools', (_, response) => {
  response.json([
    {
      date: new Date().toISOString(),
    },
  ]);
});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
