import React, { lazy, useEffect } from 'react'
import { Route, Switch, BrowserRouter, Redirect } from 'react-router-dom'
// import Amplify, { Analytics } from 'aws-amplify'

import SuspenseWithChunkError from './components/SuspenseWithChunkError'
import PageLoader from 'components/PageLoader'
import Header from 'components/Header'
import Footer from 'components/Footer'
import { useConfig } from 'providers/config'
import { usePools } from 'providers/pool'
import { listSymbols, pools } from 'constants/pools'

// import awsconfig from './aws-exports'
import { MARKET_CONFIG_ADDRESS } from './constants'
import { useFarmPools } from 'providers/farm'
import { farmPools } from 'constants/farm'
import { useCustomConnection } from 'providers/connection'
import usePyth from 'providers/pyth'

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

const App: React.FC = () => {
  const { setConfigAddress } = useConfig()
  const { setSchemas } = usePools()
  const { setSchemas: setFarmSchema } = useFarmPools()
  const { setNetwork } = useCustomConnection()
  const { setFilters } = usePyth()

  useEffect(() => {
    setConfigAddress(MARKET_CONFIG_ADDRESS)
    setSchemas(pools)
    setFarmSchema(farmPools)
    setNetwork(process.env.REACT_APP_NETWORK ?? 'testnet')
    setFilters(listSymbols(pools))
  }, [setConfigAddress, setSchemas, setFarmSchema, setNetwork, setFilters])

  return (
    <React.Fragment>
      <BrowserRouter>
        <Header />
        <SuspenseWithChunkError fallback={<PageLoader />}>
          <Switch>
            <Redirect exact from="/" to="/swap" />
            <Route path="/swap" exact component={Swap} />
            <Route path="/pools" exact component={Pool} />
            <Route path="/deposit/:poolAddress" exact component={Deposit} />
            <Route path="/farms" exact component={Farm} />
            <Route path="/rewards" exact component={Reward} />
            <Route path="/stake/:id" exact component={Stake} />
            <Redirect from="*" to="/swap" />
          </Switch>
        </SuspenseWithChunkError>
        <Footer />
      </BrowserRouter>
    </React.Fragment>
  )
}

export default React.memo(App)
