import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";
import Slider from "rc-slider";

import useStyles from "./styles";

import "rc-slider/assets/index.css";

const WithdrawSelectCard = ({ onUpdatePercentage, percentage }) => {
  const classes = useStyles();

  return (
    <Box className={classes.root}>
      <Typography className={classes.title}>
        Select percentage of your position to withdraw:
      </Typography>
      <Box className={classes.content}>
        <Box className={classes.percent}>
          <Typography className="slider-value">
            {percentage ? Number(percentage).toFixed(2) : 0}%
          </Typography>
        </Box>
        <Slider
          min={0}
          max={100}
          value={percentage}
          handleStyle={{
            background: "#D4FF00",
            border: "none",
            top: 4,
            width: 20,
            height: 20,
          }}
          className={classes.slider}
          trackStyle={{ background: "#D4FF00", height: 8, borderRadius: 4 }}
          railStyle={{ background: "#C4C4C4", height: 8, borderRadius: 4 }}
          onChange={onUpdatePercentage}
        />
      </Box>
    </Box>
  );
};

export default WithdrawSelectCard;
