import React, { lazy, useEffect } from "react";
import { Route, Switch, BrowserRouter, Redirect } from "react-router-dom";
// import Amplify, { Analytics } from 'aws-amplify'

import SuspenseWithChunkError from "./components/SuspenseWithChunkError";
import PageLoader from "components/PageLoader";
import Header from "components/Header";
import Footer from "components/Footer";
import { useConfig } from "providers/config";
import { usePools } from "providers/pool";
import { listSymbols, pools } from "constants/pools";
import { FilterCountry } from "utils/checkJurisdiction";

// import awsconfig from './aws-exports'
import { MARKET_CONFIG_ADDRESS } from "./constants";
import { useFarmPools } from "providers/farm";
import { farmPools } from "constants/farm";
import { useCustomConnection } from "providers/connection";
import usePyth from "providers/pyth";
import { deployConfig } from "constants/deployConfig";
import { FarmUnavailable } from "./views/Unavailable";
// Amplify.configure(awsconfig)
// Analytics.autoTrack('event', {
//   enable: true,
//   events: ['click'],
//   selectorPrefix: 'data-amp-analytics-',
//   provider: 'AWSPinpoint',
//   attributes: {
//     page: 'page',
//   },
// })
// Analytics.record({ name: 'App' })

// const Farm = lazy(() => import("./views/Farm"));
const Swap = lazy(() => import("./views/Swap"));
const Pool = lazy(() => import("./views/Pool"));
const Reward = lazy(() => import("./views/Reward"));
const Deposit = lazy(() => import("./views/Deposit"));
// const Stake = lazy(() => import("./views/Stake"));
const Unavailable = lazy(() => import("./views/Unavailable"));
const Terms = lazy(() => import("./views/Terms"));

const App: React.FC = () => {
  const { setConfigAddress } = useConfig();
  const { setSchemas } = usePools();
  const { setSchemas: setFarmSchema } = useFarmPools();
  const { setNetwork } = useCustomConnection();
  const { setFilters } = usePyth();
  const validCountry = window.location.origin.includes("localhost") || FilterCountry();

  useEffect(() => {
    // TODO: Get the referrer from user referrer data account.
    const _referrer = new URLSearchParams(window.location.search).get("referrer");
    // This flag is added to toggle the flag for local development.
    const _enableReferral = new URLSearchParams(window.location.search).get("enableReferral");
    if (_referrer) {
      window.localStorage.setItem("deltafi._referrer", _referrer);
      window.localStorage.setItem("deltafi._enableReferral", _enableReferral);
    }
  }, []);

  useEffect(() => {
    setConfigAddress(MARKET_CONFIG_ADDRESS);
    setSchemas(pools);
    setFarmSchema(farmPools);
    setNetwork(deployConfig.network);
    setFilters(listSymbols(pools));
  }, [setConfigAddress, setSchemas, setFarmSchema, setNetwork, setFilters]);

  return (
    <BrowserRouter>
      <Header />
      <SuspenseWithChunkError fallback={<PageLoader />}>
        {validCountry ? (
          <Switch>
            <Redirect exact from="/" to="/swap" />
            <Route path="/swap" exact component={Swap} />
            <Route path="/pools" exact component={Pool} />
            <Route path="/deposit/:poolAddress" exact component={Deposit} />
            <Route path="/farms" exact component={FarmUnavailable} />
            <Route path="/rewards" exact component={Reward} />
            <Route path="/stake/:id" exact component={FarmUnavailable} />
            <Route path="/terms" exact component={Terms} />
            <Redirect from="*" to="/swap" />
          </Switch>
        ) : (
          <Switch>
            <Redirect exact from="/" to="/unavailable" />
            <Route path="/unavailable" exact component={Unavailable} />
            <Redirect from="*" to="/unavailable" />
          </Switch>
        )}
      </SuspenseWithChunkError>
      <Footer />
    </BrowserRouter>
  );
};

export default React.memo(App);
