export interface PoolState {
	marketPrice: BigInt;
	baseReserve: BigInt;
	quoteReserve: BigInt;
	targetBaseReserve: BigInt;
	targetQuoteReserve: BigInt;
	baseSupply: BigInt;
	quoteSupply: BigInt;
}
export interface FarmPosition {
	depositedAmount: BigInt;
	rewardsOwed: BigInt;
	cumulativeInterest: BigInt;
	lastUpdateTs: BigInt;
	nextClaimTs: BigInt;
	latestDepositSlot: BigInt;
}
export interface FarmConfig {
	baseAprNumerator: BigInt;
	baseAprDenominator: BigInt;
	quoteAprNumerator: BigInt;
	quoteAprDenominator: BigInt;
	minClaimPeriod: number;
}
export interface SwapConfig {
	isPaused: boolean;
	maxSwapPercentage: number;
	enableConfidenceInterval: boolean;
	slope: BigInt;
	adminTradeFeeNumerator: BigInt;
	adminTradeFeeDenominator: BigInt;
	adminWithdrawFeeNumerator: BigInt;
	adminWithdrawFeeDenominator: BigInt;
	tradeFeeNumerator: BigInt;
	tradeFeeDenominator: BigInt;
	withdrawFeeNumerator: BigInt;
	withdrawFeeDenominator: BigInt;
	tradeRewardNumerator: BigInt;
	tradeRewardDenominator: BigInt;
	tradeRewardCap: BigInt;
	referralRewardNumerator: BigInt;
	referralRewardDenominator: BigInt;
}
export enum SwapDirection {
	SellBase,
	SellQuote,
}
export enum AccountType {
	Unknown,
	Mapping,
	Product,
	Price,
}
export enum PriceStatus {
	Unknown,
	Trading,
	Halted,
	Auction,
}
export enum CorpAction {
	NoCorpAct,
}
export enum PriceType {
	Unknown,
	Price,
}
export enum SwapType {
	NormalSwap,
	StableSwap,
}
export interface DeltafiUser {
	bump: number;
	owedSwapRewards: BigInt;
	claimedSwapRewards: BigInt;
	owedReferralRewards: BigInt;
	claimedReferralRewards: BigInt;
}
export interface FarmInfo {
	bump: number;
	stakedBaseShare: BigInt;
	stakedQuoteShare: BigInt;
	farmConfig: FarmConfig;
}
export interface MarketConfig {
	version: number;
	bump: number;
}
export interface SwapInfo {
	isInitialized: boolean;
	bump: number;
	swapType: SwapType;
	mintBaseDecimals: number;
	mintQuoteDecimals: number;
	poolState: PoolState;
	swapConfig: SwapConfig;
}
export interface LiquidityProvider {
	bump: number;
	baseShare: BigInt;
	quoteShare: BigInt;
	basePosition: FarmPosition;
	quotePosition: FarmPosition;
}

