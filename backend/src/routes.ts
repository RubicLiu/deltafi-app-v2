import { Router } from 'express';
import * as fs from 'fs';


const config = JSON.parse(fs.readFileSync(
  'src/fullDeployConfigV2.json').toString())['mainnet-test'];

const routes = Router();

routes.get('/pools', (_, response) => {
  return response.json(config.poolInfoList);
});

export default routes;
