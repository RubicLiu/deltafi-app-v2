import { Router } from 'express';
import * as fs from 'fs';

import fullDeployConfigV2 from "./fullDeployConfigV2.json";

const config = fullDeployConfigV2['mainnet-test'];

const routes = Router();

routes.get('/pools', (_, response) => {
  return response.json(config.poolInfoList);
});

export default routes;
