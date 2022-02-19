import React, { lazy, useEffect } from 'react'
import { Route, Switch, BrowserRouter, Redirect } from 'react-router-dom'
// import Amplify, { Analytics } from 'aws-amplify'

import { useWallet } from '@solana/wallet-adapter-react'
import SuspenseWithChunkError from './components/SuspenseWithChunkError'
import PageLoader from 'components/PageLoader'
import Header from 'components/Header'
import Footer from 'components/Footer'
import { useConfig } from 'providers/config'
import { usePools } from 'providers/pool'
import { listSymbols, pools } from 'constants/pools'
import { FilterCountry } from 'utils/checkJurisdiction'

// import awsconfig from './aws-exports'
import { MARKET_CONFIG_ADDRESS } from './constants'
import { useFarmPools } from 'providers/farm'
import { farmPools } from 'constants/farm'
import { useCustomConnection } from 'providers/connection'
import usePyth from 'providers/pyth'
import { PublicKey } from '@solana/web3.js'
import { NETWORK } from 'constants/config.json'
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

const Farm = lazy(() => import('./views/Farm'))
const Swap = lazy(() => import('./views/Swap'))
const Pool = lazy(() => import('./views/Pool'))
const Reward = lazy(() => import('./views/Reward'))
const Deposit = lazy(() => import('./views/Deposit'))
const Stake = lazy(() => import('./views/Stake'))
const Unavailable = lazy(() => import('./views/Unavailable'))
const Terms = lazy(() => import('./views/Terms'))

/**
 * Parse the query parameters from url
 * currently used for parsing referral link
 * @param the parameter string 
 * @returns a json data of params' keys and values
 */
const parseQueryParams = (params: string) => {
  if (params.length == 0 || params[0] !== "?") {
    return { referral_code: null };
  }

  const paramsArray = params.slice(1, params.length).split("&");
  let res = { referral_code: null };
  paramsArray.forEach((paramStr: string) => {
    const param = paramStr.split("=");
    if (param.length == 2) {
      res[param[0]] = param[1];
    }
  });

  return res;
}

/**
 * a function that links to a closure variable walletAddress
 * this function is called whenever the wallet connection state is changed
 * and it will update to wallet to the backend
 * if the wallet is connected for the first time, 
 * the backend will record the address and its referrer (if any)
 */
const updateWallet = (() => {
  let walletAddress = null;

  return async (address: PublicKey, referralCode: string) => {

    if (address !== null && !walletAddress) {

      const res = await fetch(process.env.REACT_APP_BACKEND_HOST + "/referral/check_record/" + address.toString());
      if (res.ok) {
        const resJson = await res.json();
        if (resJson.exist) {
          return;
        }

        const updateRes = await fetch(process.env.REACT_APP_BACKEND_HOST + "/referral/new_wallet", {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            wallet_address: address.toString(),
            referral_code: referralCode
          }),
          method: 'POST',
          credentials: 'include'
        });

        if (updateRes.ok) {
          walletAddress = address.toString();
        }
      }
    }
  }
})();

const App: React.FC<{params: string}> = ({ params }) => {

  const { setConfigAddress } = useConfig()
  const { setSchemas } = usePools()
  const { setSchemas: setFarmSchema } = useFarmPools()
  const { setNetwork } = useCustomConnection()
  const { setFilters } = usePyth()
  const validCountry = true;//FilterCountry()

  const { connected: isConnectedWallet, publicKey} = useWallet();

  useEffect(() => {
    setConfigAddress(MARKET_CONFIG_ADDRESS)
    setSchemas(pools)
    setFarmSchema(farmPools)
    setNetwork(NETWORK)
    setFilters(listSymbols(pools))
  },[setConfigAddress, setSchemas, setFarmSchema, setNetwork]);

  useEffect(() => {
    updateWallet(publicKey, parseQueryParams(params).referral_code);
  }, [isConnectedWallet, publicKey]);

  return (
    <React.Fragment>
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
    </React.Fragment>
  )
}

export default React.memo(App)
