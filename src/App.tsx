import React, { lazy, useEffect } from "react";
import { Route, Switch, BrowserRouter, Redirect } from "react-router-dom";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import SuspenseWithChunkError from "./components/SuspenseWithChunkError";
import PageLoader from "components/PageLoader";
import Header from "components/Header";
import Footer from "components/Footer";
import { FilterCountry } from "utils/checkJurisdiction";

import { useDispatch, useSelector } from "react-redux";

import { PublicKey } from "@solana/web3.js";
import { scheduleWithInterval } from "utils";
import { fetchSwapsThunk } from "states/accounts/swapAccount";
import { fetchLiquidityProvidersThunk } from "states/accounts/liqudityProviderAccount";
import { fetchDeltafiUserThunk } from "states/accounts/deltafiUserAccount";
import { fetchPythDataThunk } from "states/accounts/pythAccount";
import { fetchTokenAccountsV2Thunk } from "states/accounts/tokenAccount";
import { deployConfigV2, enableReferral } from "constants/deployConfigV2";
import { fetchSerumDataThunk } from "states/serumState";
import { appActions } from "states/appState";
import { programSelector } from "states";
import { getDeltafiDexV2, makeProvider } from "anchor/anchor_utils";
import { DELFI_USDT, fetchCandleSticksThunk, fetchTickerThunk } from "states/gateIoState";
import { fetchFarmUsersThunk } from "states/accounts/farmUserAccount";
import { fetchFarmsThunk } from "states/accounts/farmAccount";

const Swap = lazy(() => import("./views/Swap"));
const Pool = lazy(() => import("./views/Pool"));
const Reward = lazy(() => import("./views/Reward"));
const Bridge = lazy(() => import("./views/Bridge"));
const Unavailable = lazy(() => import("./views/Unavailable"));
const Terms = lazy(() => import("./views/Terms"));
const Dashboard = lazy(() => import("./views/Dashboard"));
const Farm = lazy(() => import("./views/Farm"));
const Stake = lazy(() => import("./views/Stake"));

// This is hack is needed to resolve the bigint json serialization in redux.
// eslint-disable-next-line
BigInt.prototype["toJSON"] = function () {
  return this.toString();
};

const disableIpBlocker = true;
const App: React.FC = () => {
  const dispatch = useDispatch();
  const validCountry =
    disableIpBlocker || window.location.origin.includes("localhost") || FilterCountry();
  const wallet = useWallet();
  const { publicKey: walletAddress } = wallet;
  const { connection } = useConnection();
  const program = useSelector(programSelector);

  useEffect(() => {
    dispatch(fetchTickerThunk(DELFI_USDT));
    dispatch(fetchCandleSticksThunk(DELFI_USDT));
  });

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
    dispatch(fetchLiquidityProvidersThunk({ connection, walletAddress }));
    dispatch(fetchDeltafiUserThunk({ connection, walletAddress }));
    dispatch(fetchFarmUsersThunk({ connection, walletAddress }));
  }, [connection, walletAddress, dispatch]);

  useEffect(() => {
    // Refresh the swap pool every 1 minute.
    return scheduleWithInterval(() => {
      dispatch(fetchSwapsThunk({ connection }));
      dispatch(fetchFarmsThunk({ connection }));
    }, 60 * 1000);
  }, [connection, dispatch]);

  useEffect(() => {
    // wrap the logic with an async function because we have to to await async function here
    (async () => {
      if (!enableReferral || !walletAddress || !program) {
        return;
      }
      const referrer: string = window.localStorage.getItem("referrer");
      // test is the referrer string is a valid public key
      // if the referrer string is invalid, the referrer public key is undefined
      if (referrer !== null && referrer !== "") {
        try {
          const referrerData = await program.account.deltafiUser.fetch(new PublicKey(referrer));
          // the referrer account cannot be owned by the user's wallet
          if (referrerData.owner.equals(walletAddress)) {
            throw Error("Referrer token account is owned by current the user");
          }
          dispatch(appActions.setReferrer(new PublicKey(referrer)));
        } catch (e) {
          console.warn(e);
          // also clear the referrer data in the local storage because it is invalid
          window.localStorage.removeItem("referrer");
        }
      }
    })();
  }, [dispatch, walletAddress, connection, wallet, program]);

  useEffect(() => {
    dispatch(appActions.setConnection(connection));
  }, [connection, dispatch]);

  useEffect(() => {
    dispatch(appActions.setWallet(wallet));
  }, [wallet, dispatch]);

  useEffect(() => {
    const program = connection
      ? getDeltafiDexV2(
          new PublicKey(deployConfigV2.programId),
          wallet ? makeProvider(connection, wallet) : makeProvider(connection, {}),
        )
      : null;
    dispatch(appActions.setProgram(program));
  }, [connection, wallet, dispatch]);

  return (
    <BrowserRouter>
      <Header />
      <SuspenseWithChunkError fallback={<PageLoader />}>
        {validCountry ? (
          <Switch>
            <Redirect exact from="/" to="/swap" />
            <Route path="/swap" exact component={Swap} />
            <Route path="/pools" exact component={Pool} />
            <Route path="/deposit/:poolAddress" exact component={Pool} />
            <Route path="/rewards" exact component={Reward} />
            <Route path="/Dashboard" exact component={Dashboard} />
            <Route path="/terms" exact component={Terms} />
            <Route path="/bridge" exact component={Bridge} />
            <Route path="/farms" exact component={Farm} />
            <Route path="/stake/:id" exact component={Stake} />
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
