import { makeStyles, Theme } from "@material-ui/core";

const useStyles = makeStyles(({ breakpoints, palette, spacing }: Theme) => ({
  root: {
    width: "100%",
    background: palette.background.secondary,
    padding: spacing(2),
    [breakpoints.up("sm")]: {
      padding: `${spacing(2)}px ${spacing(3)}px`,
    },
    borderRadius: 16,
  },
  ratePanel: {
    display: "flex",
    justifyContent: "space-between",
  },
  topSection: {
    display: "flex",
    justifyContent: "space-between",
  },
  tokenSection: {},
  infoSection: {
    display: "flex",
    justifyContent: "space-between",
  },
  token: {
    marginLeft: spacing(2),
  },
  tokenSymbol: {
    fontSize: 10,
  },
  currencyInput: {
    color: palette.text.primary,
    textAlign: "right",
    border: "none",
    background: "transparent",
    outline: "none",
    fontSize: 14,
    fontWeight: 400,
    width: "100%",
    fontFamily: "Rubik",
    flex: 1,
    // marginLeft: spacing(3),
    [breakpoints.up("md")]: {
      fontSize: 20,
    },
    "&::placeholder": {
      color: palette.text.primary,
    },
  },
  tokenBalance: {
    color: palette.text.dark,
    fontSize: 12,
    fontWeight: 500,
    lineHeight: 1,
    [breakpoints.up("md")]: {
      fontSize: 14,
    },
  },
  tokenContainer: {
    padding: "8px 24px",
    borderRadius: 28,
    backgroundColor: palette.background.tertiary,
  },
  coinIcon: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    boxShadow: "rgb(0 0 0 / 8%) 0px 6px 10px",
    color: "rgb(86, 90, 105)",
  },
  iconWrapper: {
    borderRadius: "50%",
    width: 32,
    height: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  withdrawNumber: {
    color: palette.text.success,
  },
}));

export default useStyles;
