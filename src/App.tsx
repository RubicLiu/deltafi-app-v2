import React, { lazy, useEffect } from "react";
import { Route, Switch, BrowserRouter, Redirect } from "react-router-dom";
// import Amplify, { Analytics } from 'aws-amplify'

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
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

import { useDispatch } from "react-redux";
import { fetchFarmUsersThunk } from "states/farmState";
import { setReferrerAction, fetchReferrerThunk } from "states/appState";

import { FarmUnavailable } from "./views/Unavailable";
import { PublicKey } from "@solana/web3.js";
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

const Farm = lazy(() => import("./views/Farm"));
const Swap = lazy(() => import("./views/Swap"));
const Pool = lazy(() => import("./views/Pool"));
const Reward = lazy(() => import("./views/Reward"));
const Deposit = lazy(() => import("./views/Deposit"));
const Stake = lazy(() => import("./views/Stake"));
const Unavailable = lazy(() => import("./views/Unavailable"));
const Terms = lazy(() => import("./views/Terms"));

// This is hack is needed to resolve the bigint json serialization in redux.
// eslint-disable-next-line
BigInt.prototype["toJSON"] = function () {
  return this.toString();
};

const App: React.FC = () => {
  const dispatch = useDispatch();
  const { setConfigAddress } = useConfig();
  const { setSchemas } = usePools();
  const { setSchemas: setFarmSchema } = useFarmPools();
  const { setNetwork } = useCustomConnection();
  const { setFilters } = usePyth();
  const validCountry = window.location.origin.includes("localhost") || FilterCountry();
  const { publicKey: walletAddress } = useWallet();
  const { connection } = useConnection();
  const enableFarm = new URLSearchParams(window.location.search).get("enableFarm") === "true";

  useEffect(() => {
    if (enableFarm && walletAddress) {
      dispatch(fetchFarmUsersThunk({ connection, config: MARKET_CONFIG_ADDRESS, walletAddress }));
    }
  }, [connection, walletAddress, dispatch, enableFarm]);

  useEffect(() => {
    const referrer: string = new URLSearchParams(window.location.search).get("referrer");

    // test is the referrer string is a valid public key
    // if the referrer string is invalid, the referrer public key is undefined
    let referrerPublicKey: PublicKey | null;
    try {
      referrerPublicKey = new PublicKey(referrer);
    } catch {
      // if the referrer address is invalid, the referrer public key is set to null
      referrerPublicKey = null;
    }

    // This flag is added to toggle the flag for local development.
    // for test purpose, it requires enableReferral is set to be true explicitly
    const enableReferral: boolean = new URLSearchParams(window.location.search).get("enableReferral") === "true";
    // TODO(ypeng): Check wallet key and reset state if wallet changes.
    dispatch(setReferrerAction({ referrerPublicKey, enableReferral }));

    if (!enableReferral) {
      return;
    }

    dispatch(fetchReferrerThunk({ connection, config: MARKET_CONFIG_ADDRESS, walletAddress }));
  }, [dispatch, walletAddress, connection]);

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
            <Route path="/farms" exact component={enableFarm ? Farm : FarmUnavailable} />
            <Route path="/rewards" exact component={Reward} />
            <Route path="/stake/:id" exact component={enableFarm ? Stake : FarmUnavailable} />
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
