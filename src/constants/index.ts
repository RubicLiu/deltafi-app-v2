import { PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { deployConfigV2 } from "./deployConfigV2";

export { DELTAFI_TOKEN_DECIMALS, DELTAFI_TOKEN_SYMBOL } from "./deployConfigV2";

export const SWAP_PROGRAM_ID = new PublicKey(deployConfigV2.programId);
export const MARKET_CONFIG_ADDRESS = new PublicKey(deployConfigV2.marketConfig);
export const DELTAFI_TOKEN_MINT = new PublicKey(deployConfigV2.deltafiMint);
export const DAYS_PER_YEAR = 365;
export const SECONDS_PER_YEAR = 31556926;

export const WAD_LENGTH = 18;

export const WAD = new BigNumber(`1e+${WAD_LENGTH}`);

export const HOMEPAGE_LINK = process.env.REACT_HOMPAGE_URL || "https://deltafi.trade";
export const APP_LINK = process.env.REACT_APP_URL || "http://localhost:3001";
export const BLOG_LINK = "https://medium.com/deltafi";
export const TWITTER_LINK = "https://twitter.com/deltafi_trade";
export const DISCORD_LINK = "https://discord.gg/deltafi";
export const GITHUB_LINK = "https://github.com/deltafi-trade";
export const TELEGRAM_LINK = "https://t.me/deltafi_labs";
export const YOUTUBE_LINK = "https://www.youtube.com/channel/UCVs_ZIdnPKdxy30eWrAeBLQ";
export const SOLSCAN_LINK = "https://solscan.io/token/de1QJkP1qDCk5JYCCXCeq27bQQUdCaiv7xVKFrhPSzF";
export const SPOTIFY_LINK = "https://www.spotify.com/";


export const MAINNET_CHAIN_ID = 1;
export const connectorLocalStorageKey = "connectorId";

export const WALLETS = {
  SOLFLARE: "Solflare",
  SOLFLARE_EXTENSION: "Solflare Extension",
  SOLLET: "Sollet",
  SOLLET_EXTENSION: "Sollet Extension",
  PHANTOM: "Phantom",
  COIN98: "Coin98",
  MATHWALLLET: "MathWallet",
};
