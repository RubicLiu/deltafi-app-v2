import { Router } from 'express';
import * as fs from 'fs';


const config = JSON.parse(fs.readFileSync('./fullDeployConfigV2.json'))['mainnet-test'];

const routes = Router();

routes.get('/', (req, res) => {
  return res.json(config.poolInfoList);
});

export default routes;
