import { makeStyles, Theme } from "@material-ui/core";

const useStyles = makeStyles(({ breakpoints, spacing, palette }: Theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    borderRadius: 16,
    width: "100%",
    background: palette.background.secondary,
    marginBottom: spacing(1),
    padding: `${spacing(1.5)}px ${spacing(2)}px`,
    [breakpoints.up("sm")]: {
      padding: `${spacing(2.5)}px ${spacing(3)}px`,
    },
  },
  title: {
    fontSize: 10,
    fontWeight: 500,
    lineHeight: "18px",
    color: palette.text.secondary,
    marginBottom: spacing(2),
    [breakpoints.up("sm")]: {
      fontSize: 16,
    },
  },
  content: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    "& .slider-value": {
      fontSize: 12,
      fontWeight: 400,
      color: palette.text.secondary,
    },
    [breakpoints.up("sm")]: {
      "& .slider-value": {
        fontSize: 16,
      },
    },
  },
  percent: {
    width: 1000,
    height: 32,
    [breakpoints.up("sm")]: {
      width: 140,
      height: 40,
    },
    background: palette.background.primary,
    borderRadius: 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing(4),
    boxSizing: "border-box",
  },
  slider: {
    cursor: "pointer",
    "& .rc-slider-handle": {
      cursor: "inherit",
    },
    "& .rc-slider-handle:active": {
      borderShadow: "none",
    },
  },
}));

export default useStyles;
