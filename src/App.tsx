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
import { DELTAFI_TOKEN_MINT } from "./constants";
import { useCustomConnection } from "providers/connection";

import { useDispatch } from "react-redux";

import { PublicKey } from "@solana/web3.js";
import { scheduleWithInterval } from "utils";
import { AccountLayout } from "@solana/spl-token";
import { fetchSwapsThunk } from "states/accounts/swapAccount";
import { fetchFarmsThunk } from "states/accounts/farmAccount";
import { fetchLiquidityProvidersThunk } from "states/accounts/liqudityProviderAccount";
import { fetchDeltafiUserThunk } from "states/accounts/deltafiUserAccount";
import { fetchPythDataThunk } from "states/accounts/pythAccount";
import { fetchTokenAccountsV2Thunk } from "states/accounts/tokenAccount";
import { deployConfigV2, enableReferral } from "constants/deployConfigV2";
import { fetchSerumDataThunk } from "states/serumState";
import { getDeltafiDexV2, makeProvider } from "anchor/anchor_utils";
import { appActions } from "states/appState";

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
  const wallet = useWallet();
  const { publicKey: walletAddress } = wallet;
  const { connection } = useConnection();

  useEffect(() => {
    if (!walletAddress) {
      return;
    }

    // refresh every 1 minute
    return scheduleWithInterval(
      () => dispatch(fetchTokenAccountsV2Thunk({ connection, walletAddress })),
      60 * 1000,
    );
  }, [connection, walletAddress, dispatch]);

  useEffect(() => {
    // Refresh the pyth data every 2 seconds.
    return scheduleWithInterval(() => dispatch(fetchPythDataThunk(connection)), 2 * 1000);
  }, [connection, dispatch]);

  useEffect(() => {
    // Refresh the serum data every 2 seconds.
    return scheduleWithInterval(() => dispatch(fetchSerumDataThunk(connection)), 2 * 1000);
  }, [connection, dispatch]);

  useEffect(() => {
    if (walletAddress) {
      dispatch(fetchLiquidityProvidersThunk({ connection, walletAddress }));
      dispatch(fetchDeltafiUserThunk({ connection, walletAddress }));
    }
  }, [connection, walletAddress, dispatch]);

  useEffect(() => {
    // Refresh the farm pool every 1 minute.
    return scheduleWithInterval(() => dispatch(fetchFarmsThunk({ connection })), 60 * 1000);
  }, [connection, dispatch]);

  useEffect(() => {
    // Refresh the farm pool every 1 minute.
    return scheduleWithInterval(() => dispatch(fetchSwapsThunk({ connection })), 60 * 1000);
  }, [connection, dispatch]);

  useEffect(() => {
    // wrap the logic with an async function because we have to to await async function here
    (async () => {
      if (!enableReferral || !walletAddress) {
        return;
      }
      const referrer: string = window.localStorage.getItem("referrer");
      // test is the referrer string is a valid public key
      // if the referrer string is invalid, the referrer public key is undefined
      let referrerPublicKey: PublicKey | null = null;
      if (referrer !== null && referrer !== "") {
        try {
          const program = getDeltafiDexV2(
            new PublicKey(deployConfigV2.programId),
            makeProvider(connection, wallet),
          );
          const referrerData = await program.account.deltafiUser.fetch(new PublicKey(referrer));
          // the referrer account cannot be owned by the user's wallet
          if (referrerData.owner.equals(walletAddress)) {
            throw Error("Referrer token account is owned by current the user");
          }
          dispatch(appActions.setReferrer(referrer));
        } catch (e) {
          console.warn(e);
          // if the referrer address is invalid, the referrer public key is set to null
          referrerPublicKey = null;
          // also clear the referrer data in the local storage because it is invalid
          window.localStorage.removeItem("referrer");
        }
      }
    })();
  }, [dispatch, walletAddress, connection]);

  useEffect(() => {
    setNetwork(deployConfigV2.network);
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
