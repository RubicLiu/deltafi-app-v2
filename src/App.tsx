import React, { lazy, useEffect } from "react";
import { Route, Switch, BrowserRouter, Redirect } from "react-router-dom";
// import Amplify, { Analytics } from 'aws-amplify'

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import SuspenseWithChunkError from "./components/SuspenseWithChunkError";
import PageLoader from "components/PageLoader";
import Header from "components/Header";
import Footer from "components/Footer";
import { useConfig } from "providers/config";
import { FilterCountry } from "utils/checkJurisdiction";

// import awsconfig from './aws-exports'
import { MARKET_CONFIG_ADDRESS } from "./constants";
import { useCustomConnection } from "providers/connection";
import { deployConfig } from "constants/deployConfig";

import { useDispatch } from "react-redux";
import { fetchFarmPoolsThunk } from "states/farmPoolState";
import { fetchFarmUsersThunk } from "states/farmUserState";
import { fetchPoolsThunk } from "states/poolState";
import { fetchPythDataThunk } from "states/PythState";
import { setReferrerAction, fetchReferrerThunk } from "states/appState";

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
  const { setNetwork } = useCustomConnection();
  const validCountry = window.location.origin.includes("localhost") || FilterCountry();
  const { publicKey: walletAddress } = useWallet();
  const { connection } = useConnection();

  useEffect(() => {
    dispatch(fetchPythDataThunk(connection));
    // Refresh the farm pool every 2 seconds.
    const interval = setInterval(() => {
      dispatch(fetchPythDataThunk(connection));
    }, 2 * 1000);
    return () => clearInterval(interval);
  }, [connection, dispatch]);

  useEffect(() => {
    if (walletAddress) {
      dispatch(fetchFarmUsersThunk({ connection, config: MARKET_CONFIG_ADDRESS, walletAddress }));
    }
  }, [connection, walletAddress, dispatch]);

  useEffect(() => {
    dispatch(fetchFarmPoolsThunk({ connection }));
    // Refresh the farm pool every 1 minute.
    const interval = setInterval(() => {
      dispatch(fetchFarmPoolsThunk({ connection }));
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [connection, dispatch]);

  useEffect(() => {
    dispatch(fetchPoolsThunk({ connection }));
    // Refresh the farm pool every 1 minute.
    const interval = setInterval(() => {
      dispatch(fetchPoolsThunk({ connection }));
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [connection, dispatch]);

  useEffect(() => {
    const referrer: string = new URLSearchParams(window.location.search).get("referrer");

    // test is the referrer string is a valid public key
    // if the referrer string is invalid, the referrer public key is undefined
    let referrerPublicKey: PublicKey | null;
    try {
      referrerPublicKey = new PublicKey(referrer);
    } catch (e) {
      console.warn(e);
      // if the referrer address is invalid, the referrer public key is set to null
      referrerPublicKey = null;
    }
    // This flag is added to toggle the flag for local development.
    // for test purpose, it requires enableReferral is set to be true explicitly
    const enableReferral: boolean = window.localStorage.getItem("enableReferralStr") === "true";

    console.info(referrer, enableReferral, referrerPublicKey);
    // TODO(ypeng): Check wallet key and reset state if wallet changes.
    dispatch(setReferrerAction({ referrerPublicKey, enableReferral }));

    if (!enableReferral) {
      return;
    }

    dispatch(fetchReferrerThunk({ connection, config: MARKET_CONFIG_ADDRESS, walletAddress }));
  }, [dispatch, walletAddress, connection]);

  useEffect(() => {
    setConfigAddress(MARKET_CONFIG_ADDRESS);
    setNetwork(deployConfig.network);
  }, [setConfigAddress, setNetwork]);

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
            <Route path="/farms" exact component={Farm} />
            <Route path="/rewards" exact component={Reward} />
            <Route path="/stake/:id" exact component={Stake} />
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
