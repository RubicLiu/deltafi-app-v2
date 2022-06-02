import React from "react";
import { Box, Typography, Slider } from "@material-ui/core";
import { Theme, makeStyles } from "@material-ui/core";
import { withStyles } from "@material-ui/styles";

const useStyles = makeStyles(({ breakpoints, palette, spacing }: Theme) => ({
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

const CustomSlider = withStyles((theme: Theme) => ({
  thumb: {
    height: 20,
    width: 20,
    backgroundColor: "#D4FF00",
    border: "none",
    marginTop: -6,
    marginLeft: -10,
    "&:focus, &:hover": {
      boxShadow: "inherit",
    },
  },
  rail: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#C4C4C4",
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D4FF00",
  },
}))(Slider);

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
}

const PercentageSlider: React.FC<SliderProps> = (props) => {
  const classes = useStyles();
  const { value, onChange } = props;

  const handleChange = (_: any, newValue: number | number[]) => {
    onChange(newValue as number);
  };

  return (
    <Box className={classes.root}>
      <Typography className={classes.title}>Percentage of total stake</Typography>
      <Box className={classes.content}>
        <Box className={classes.percent}>
          <Typography>{value}%</Typography>
        </Box>
        <CustomSlider
          value={value}
          onChange={handleChange}
          aria-labelledby="continuous-slider"
          step={0.01}
        />
      </Box>
    </Box>
  );
};

export default PercentageSlider;
