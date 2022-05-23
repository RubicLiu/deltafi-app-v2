//'use strict';
//
//const express = require('express');
//const fs = require('fs');
//
//const PORT = 4000;
//const HOST = '0.0.0.0';
//
//const config = JSON.parse(fs.readFileSync('./fullDeployConfigV2.json'))['mainnet-test'];
//
//const app = express();
////app.get('/pools', (_, response) => {
////  response.json(config.poolInfoList);
////});
//
//app.listen(PORT, HOST);
//console.log(`Running on http://${HOST}:${PORT}`);
//

import app from './app';

app.listen(4000);