import React from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Box, Typography, makeStyles, Theme, Grid, Paper, Link } from '@material-ui/core'
import Page from 'components/layout/Page'
import { ConnectButton } from 'components'
import { useModal } from 'providers/modal'
import ReferralCard from './components/ReferralCard'
import MyReward from './components/MyReward'
import CopyLinkButton from './components/CopyLinkButton'
import { ShareDiscord, ShareGithub, ShareMedium, ShareTelegram, ShareTwitter } from 'components'

/*
 * mockup test data for reward page
 */
const referralIntroCard = [
  {
    caption: 'Get a referral link',
    detail: 'Connect a wallet and generate a referral link to share.',
    image: '/images/get_referral_link.png',
  },
  {
    caption: 'Share with friends',
    detail: 'Invite your friends to register via your referral link.',
    image: '/images/share_friends.png',
  },
  {
    caption: 'Earn crypto',
    detail: 'Get referral rewards from your friends’ earnings & swaps.',
    image: '/images/earn_crypto.png',
  },
]

const myRewards = [
  {
    name: 'REFERRAL',
    totalAmount: 1000,
    claimedAmount: 200,
    claimed: 10,
    history: [
      { date: '18.Sep.2021', rewards: 10, lockup: 60 },
      { date: '18.Sep.2021', rewards: 10, lockup: 60 },
      { date: '18.Sep.2021', rewards: 10, lockup: 60 },
      { date: '18.Sep.2021', rewards: 10, lockup: 60 },

      { date: '18.Feb.2021', rewards: 10, lockup: 100 },
      { date: '18.Feb.2021', rewards: 10, lockup: 100 },
      { date: '18.Feb.2021', rewards: 10, lockup: 100 },
      { date: '18.Feb.2021', rewards: 10, lockup: 100 },
    ],
  },
  {
    name: 'AIRDROPS',
    totalAmount: 1000,
    claimedAmount: 500,
    claimed: 50,
    history: [
      { date: '18.Sep.2021', rewards: 10, lockup: 60 },
      { date: '18.Sep.2021', rewards: 10, lockup: 60 },
      { date: '18.Sep.2021', rewards: 10, lockup: 60 },
      { date: '18.Sep.2021', rewards: 10, lockup: 60 },

      { date: '18.Feb.2021', rewards: 10, lockup: 100 },
      { date: '18.Feb.2021', rewards: 10, lockup: 100 },
      { date: '18.Feb.2021', rewards: 10, lockup: 100 },
      { date: '18.Feb.2021', rewards: 10, lockup: 100 },
    ],
  },
]

const useStyles = makeStyles(({ breakpoints, spacing }: Theme) => ({
  root: {
    padding: `${spacing(10)}px 0px`,
    maxWidth: 792,
    width: '100%',
    [breakpoints.down('md')]: {
      padding: '0 1rem',
    },
  },
  defaultWrapper: {
    [breakpoints.down('sm')]: {
      maxWidth: 248,
      margin: '0 auto',
    },
  },
  fontBold: {
    fontWeight: 'bold',
  },
  subContent: {
    color: '#F7F7F7',
  },
  subContentMargin2: {
    marginBottom: spacing(2),
  },
  subContentMargin3: {
    marginBottom: spacing(3),
  },
  referralTitle: {
    fontWeight: 500,
    fontSize: 28,
  },
  mainComponentMargin: {
    marginBottom: spacing(8),
  },
  inviteComponentMargin: {
    marginTop: spacing(8),
    marginBottom: spacing(8),
  },
  sharePanelRow: {
    display: 'flex',
  },
  shareLabel: {
    marginRight: spacing(3),
    [breakpoints.down('sm')]: {
      marginRight: spacing(1.5),
    },
  },
  sharePannel: {
    backgroundColor: '#1D1A27',
    padding: '40px 50px 40px 50px',
    borderRadius: '1rem',
    [breakpoints.down('sm')]: {
      padding: '2rem 1rem',
    },
  },
  shareButton: {
    width: 29,
    height: 29,
    [breakpoints.down('sm')]: {
      width: 24,
      height: 24,
    },
  },
  socialLinks: {
    '& a': {
      marginRight: spacing(3),
      [breakpoints.down('sm')]: {
        marginRight: spacing(1.5),
      },
    },
  },
  inputLink: {
    borderRadius: 12,
    background: 'transparent',
    border: '1px solid #B7B4C7',
    padding: '16px 24px',
    color: 'white',
    marginRight: '16px',
    flex: 1,
    outline: 'none',
    [breakpoints.down('sm')]: {
      padding: '12px',
      marginRight: '8px',
      fontSize: '10px',
    },
  },
}))

const Home: React.FC = (props) => {
  const classes = useStyles(props)
  const { setMenu } = useModal()
  const { connected: isConnectedWallet, publicKey} = useWallet()
  const referralLink = "https://www.deltafi.ai/referral/" + publicKey

  return (
    <Page>
      <Box className={classes.root}>
        <Box className={classes.defaultWrapper}>
          <Typography variant="h4" color="primary" align="center" className={classes.fontBold} paragraph>
            Invite friends, earn crypto together
          </Typography>

          {/* Connect Wallet */}
          {!isConnectedWallet && (
            <Box flexDirection="column" display="flex" alignItems="center" className={classes.mainComponentMargin}>
              <Typography variant="subtitle1" align="center" className={classes.subContent} paragraph>
                Before referral, you need to connect your wallet
              </Typography>
              <ConnectButton onClick={() => setMenu(true, 'connect')}>Connect Wallet</ConnectButton>
            </Box>
          )}
        </Box>

        {/* Send Invitations */}
        {isConnectedWallet && (
          <>
            <Box className={classes.inviteComponentMargin}>
              <Typography variant="h5" color="primary" align="center" paragraph>
                Send Invitations (Mock link for now. Real referral link coming soon...)
              </Typography>

              <Paper className={classes.sharePannel}>
                <Typography variant="subtitle1" color="primary" className={classes.subContentMargin2}>
                  My Referral Link
                </Typography>
                <Box className={`${classes.subContentMargin3} ${classes.sharePanelRow}`}>
                  <input placeholder={referralLink} className={classes.inputLink} />
                  <CopyLinkButton
                    onClick={() => {
                      alert('Click Copy Link')
                    }}
                  >
                    Copy Link
                  </CopyLinkButton>
                </Box>
                <Box className={classes.sharePanelRow}>
                  <Typography variant="subtitle1" color="primary" className={classes.shareLabel}>
                    Share
                  </Typography>
                  <Box display="flex" className={classes.socialLinks}>
                    <Link
                      href="https://twitter.com/deltafi_ai"
                      target="_blank"
                      rel="noreferrer noopener"
                      data-amp-analytics-on="click"
                      data-amp-analytics-name="click"
                      data-amp-analytics-attrs="page: Reward, target: Twitter"
                    >
                      <ShareTwitter className={classes.shareButton} />
                    </Link>

                    <Link
                      href="https://discord.gg/deltafi"
                      target="_blank"
                      rel="noreferrer noopener"
                      data-amp-analytics-on="click"
                      data-amp-analytics-name="click"
                      data-amp-analytics-attrs="page: Reward, target: Discord"
                    >
                      <ShareDiscord className={classes.shareButton} />
                    </Link>
                    <Link
                      href="https://github.com/delta-fi"
                      target="_blank"
                      rel="noreferrer noopener"
                      data-amp-analytics-on="click"
                      data-amp-analytics-name="click"
                      data-amp-analytics-attrs="page: Reward, target: Github"
                    >
                      <ShareGithub className={classes.shareButton} />
                    </Link>
                    <Link
                      href="https://medium.com/deltafi"
                      target="_blank"
                      rel="noreferrer noopener"
                      data-amp-analytics-on="click"
                      data-amp-analytics-name="click"
                      data-amp-analytics-attrs="page: Reward, target: Medium"
                    >
                      <ShareMedium className={classes.shareButton} />
                    </Link>
                    <Link
                      href="https://t.me/deltafi_ai"
                      target="_blank"
                      rel="noreferrer noopener"
                      data-amp-analytics-on="click"
                      data-amp-analytics-name="click"
                      data-amp-analytics-attrs="page: Reward, target: Telegram"
                    >
                      <ShareTelegram className={classes.shareButton} />
                    </Link>
                  </Box>
                </Box>
              </Paper>
            </Box>

            {/* My Rewards */}
            <Box className={classes.mainComponentMargin}>
              <Typography variant="h5" color="primary" align="center" paragraph>
                My Rewards (Mock data only now. Real date coming soon...)
              </Typography>
              {myRewards.map((item, index) => (
                <MyReward detail={item} key={index} />
              ))}
            </Box>
          </>
        )}

        {/* How to invite friends */}
        <Box className={classes.defaultWrapper}>
          <Typography variant="h5" color="primary" align="center" paragraph>
            How to invite friends
          </Typography>
          <Grid container spacing={2} style={{ width: '100%', margin: 0 }}>
            {referralIntroCard.map((item, index) => (
              <Grid item xs={12} sm={4} md={4} key={index}>
                <ReferralCard caption={item.caption} detail={item.detail} image={item.image} />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </Page>
  )
}
export default Home
