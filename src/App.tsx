import React, { lazy, useEffect } from "react";
import { Route, Switch, BrowserRouter, Redirect } from "react-router-dom";
// import Amplify, { Analytics } from 'aws-amplify'

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import SuspenseWithChunkError from "./components/SuspenseWithChunkError";
import PageLoader from "components/PageLoader";
import Header from "components/Header";
import Footer from "components/Footer";
import { FilterCountry } from "utils/checkJurisdiction";

// import awsconfig from './aws-exports'
import { MARKET_CONFIG_ADDRESS } from "./constants";
import { useCustomConnection } from "providers/connection";
import { deployConfig } from "constants/deployConfig";

import { useDispatch } from "react-redux";
import { fetchFarmPoolsThunk } from "states/farmPoolState";
import { fetchFarmUsersThunk } from "states/farmUserState";
import { fetchPoolsThunk } from "states/poolState";
import { fetchPythDataThunk } from "states/pythState";
import { setReferrerAction, fetchReferrerThunk } from "states/appState";

import { PublicKey } from "@solana/web3.js";
import { fetchTokenAccountsThunk } from "states/tokenAccountState";
import { scheduleWithInterval } from "utils";

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

const disableIpBlocker = true;
const App: React.FC = () => {
  const dispatch = useDispatch();
  const { setNetwork } = useCustomConnection();
  const validCountry =
    disableIpBlocker || window.location.origin.includes("localhost") || FilterCountry();
  const { publicKey: walletAddress } = useWallet();
  const { connection } = useConnection();

  useEffect(() => {
    if (!walletAddress) {
      return;
    }

    // refresh every 1 minute
    return scheduleWithInterval(
      () => dispatch(fetchTokenAccountsThunk({ connection, walletAddress })),
      60 * 1000,
    );
  }, [connection, walletAddress, dispatch]);

  useEffect(() => {
    // Refresh the pyth data every 2 seconds.
    return scheduleWithInterval(() => dispatch(fetchPythDataThunk(connection)), 2 * 1000);
  }, [connection, dispatch]);

  useEffect(() => {
    if (walletAddress) {
      dispatch(fetchFarmUsersThunk({ connection, walletAddress }));
    }
  }, [connection, walletAddress, dispatch]);

  useEffect(() => {
    // Refresh the farm pool every 1 minute.
    return scheduleWithInterval(() => dispatch(fetchFarmPoolsThunk({ connection })), 60 * 1000);
  }, [connection, dispatch]);

  useEffect(() => {
    // Refresh the farm pool every 1 minute.
    return scheduleWithInterval(() => dispatch(fetchPoolsThunk({ connection })), 60 * 1000);
  }, [connection, dispatch]);

  useEffect(() => {
    const referrer: string = window.localStorage.getItem("referrer");
    // test is the referrer string is a valid public key
    // if the referrer string is invalid, the referrer public key is undefined
    let referrerPublicKey: PublicKey | null = null;
    if (referrer != null) {
      try {
        referrerPublicKey = new PublicKey(referrer);
      } catch (e) {
        console.warn(e);
        // if the referrer address is invalid, the referrer public key is set to null
      }
    }

    // Enable referral feature explicitly
    const enableReferral: boolean = true;

    dispatch(setReferrerAction({ referrerPublicKey, enableReferral }));

    if (!enableReferral || !walletAddress) {
      return;
    }

    dispatch(fetchReferrerThunk({ connection, config: MARKET_CONFIG_ADDRESS, walletAddress }));
  }, [dispatch, walletAddress, connection]);

  useEffect(() => {
    setNetwork(deployConfig.network);
  }, [setNetwork]);

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
