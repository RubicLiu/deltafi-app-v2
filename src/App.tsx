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
import { MARKET_CONFIG_ADDRESS, SWAP_PROGRAM_ID } from "./constants";
import { useFarmPools } from "providers/farm";
import { farmPools } from "constants/farm";
import { useCustomConnection } from "providers/connection";
import usePyth from "providers/pyth";
import { deployConfig } from "constants/deployConfig";

import { useDispatch } from "react-redux";
import { fetchFarmUsersThunk } from "states/farmState";
import { setReferrerAction, updateReferrerAction } from "states/appState";

import { FarmUnavailable } from "./views/Unavailable";
import { PublicKey } from "@solana/web3.js";
import { UserReferrerDataLayout } from "lib/state";
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

  useEffect(() => {
    if (walletAddress) {
      const enableFarm: boolean = new URLSearchParams(window.location.search).get("enableFarm") === "true";
      if (!enableFarm) {
        return;
      }

      dispatch(fetchFarmUsersThunk({ connection, config: MARKET_CONFIG_ADDRESS, walletAddress }));
    }
  }, [connection, walletAddress, dispatch]);

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
    const enableReferral: boolean = new URLSearchParams(window.location.search).get("enableReferral") === "true";

    // this timestamp if used for both set/update referral action in this scope
    // the reducer will validate if the post process is the most recent one based on this flag
    const timestamp = Date.now();
    // for test purpose, it requires enableReferral is set to be true explicitly
    if (!!referrer) {
      dispatch(setReferrerAction({ referrerPublicKey, enableReferral, timestamp }));
    }

    if (!enableReferral) {
      return;
    }

    // this async function immediately process the referral input
    (async () => {
      console.info("processing");
      const referralAccountPublickey = await PublicKey.createWithSeed(walletAddress, "referrer", SWAP_PROGRAM_ID);
      const referralAccountInfo = await connection.getAccountInfo(referralAccountPublickey);

      if (!referralAccountInfo) {
        if (referrerPublicKey !== walletAddress) {
          // in the case that the user enter his own referral link
          // we block this action from getting into our smart contract and set the user's referrer to null
          dispatch(updateReferrerAction({ referrerPublicKey, isNewUser: true, timestamp }));
        } else {
          dispatch(updateReferrerAction({ referrerPublicKey: null, isNewUser: true, timestamp }));
        }
        return;
      }

      const referralInfo = UserReferrerDataLayout.decode(referralAccountInfo.data);
      // TODO: check if the referrer is a dummy key, set it to null
      referrerPublicKey = referralInfo.referrer;
      dispatch(updateReferrerAction({ referrerPublicKey, isNewUser: false, timestamp }));
    })();
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
