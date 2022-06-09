import { useState } from "react";
import { useHistory, useLocation } from "react-router";
import { ToggleButton, ToggleButtonGroup } from "@material-ui/lab";
import { makeStyles, Theme } from "@material-ui/core";

const useStyles = makeStyles(({ palette, breakpoints }: Theme) => ({
  button: {
    "&.Mui-selected": {
      backgroundColor: palette.background.complementary,
      color: "#333333",
      "&:hover": {
        backgroundColor: palette.background.complementary,
        color: "#333333",
      },
    },
    borderRadius: "100px !important",
    border: "none",
    textTransform: "capitalize",
    color: "#fff",
    fontSize: 16,
    fontFamily: "IBM Plex Mono",
    fontWeight: 700,
    margin: "0 12px",
    padding: "10px 16px",
    lineHeight: "100%",
    [breakpoints.down("md")]: {
      fontSize: 14,
      fontWeight: 700,
      margin: 0,
      padding: "5px 8px",
    },
  },
}));

const TabMenu: React.FC = (props) => {
  const history = useHistory();
  const location = useLocation();
  const [activeTab, setActive] = useState(location.pathname.substring(1));

  const classes = useStyles(props);

  const handleActive = (path: string): void => {
    if (!path) {
      history.replace(`/${activeTab}`);
      return;
    }
    setActive(path);
    history.replace(`/${path}`);
  };

  return (
    <ToggleButtonGroup
      value={activeTab}
      exclusive
      onChange={(event: React.MouseEvent<HTMLElement>, value: string | null) => handleActive(value)}
      aria-label="Top Menu"
    >
      <ToggleButton value="dashboard" aria-label="Dashboard" className={classes.button}>
        Dashboard
      </ToggleButton>
      <ToggleButton value="swap" aria-label="Swap" className={classes.button}>
        Swap
      </ToggleButton>
      <ToggleButton value="pools" aria-label="Pools" className={classes.button}>
        Pools
      </ToggleButton>
      <ToggleButton value="farms" aria-label="Farms" className={classes.button}>
        Farms
      </ToggleButton>
      )
    </ToggleButtonGroup>
  );
};

export default TabMenu;
