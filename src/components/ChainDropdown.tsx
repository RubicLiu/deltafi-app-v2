import { makeStyles, Theme } from "@material-ui/core";
import { SearchOutlined } from "@material-ui/icons";
import { Avatar, Box, Button, ClickAwayListener, InputBase } from "@mui/material";
import { useState } from "react";
import ArrowDown from "./Svg/icons/ArrowDown";

const useStyles = makeStyles((theme: Theme) => ({
  button: {
    borderRadius: 28,
    backgroundColor: theme.palette.background.primary,
    padding: `${theme.spacing(0.75)}px ${theme.spacing(2)}px`,
    fontSize: 12,
    textTransform: "capitalize",
    fontWeight: 400,
    color: theme.palette.primary.main,
    [theme.breakpoints.up("sm")]: {
      fontSize: 16,
      padding: `${theme.spacing(1)}px ${theme.spacing(3)}px`,
      "&:disabled": {
        fontSize: 14,
        color: theme.palette.primary.main,
        padding: `${theme.spacing(0.5)}px ${theme.spacing(3)}px`,
      },
    },
    "&:disabled": {
      color: theme.palette.primary.main,
      padding: `${theme.spacing(0.5)}px ${theme.spacing(2)}px`,
    },
    minWidth: 100,
  },
  dropdownContainer: {
    minWidth: 320,
    position: "absolute",
    zIndex: theme.zIndex.modal,
    marginTop: theme.spacing(1),
    backgroundColor: theme.palette.background.secondary,
    borderRadius: theme.spacing(2),
    padding: `${theme.spacing(3)}px ${theme.spacing(2)}px`,
  },
  inputContainer: {
    position: "relative",
    overflow: "hidden",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    color: theme.palette.text.primary,
    zIndex: 0,
    padding: ".25rem 1rem",
    textTransform: "inherit",
    borderRadius: 100,
    border: "1px solid #D3D3D3",
    backgroundColor: "transparent",
    "&:hover": {
      backgroundColor: "transparent",
    },
    "& .MuiSvgIcon-root": {
      color: "#d3d3d3",
    },
    "&.network": {
      padding: ".25rem 1rem",
    },
  },
  searchInput: {
    width: "100%",
    marginLeft: 4,
    fontWeight: 500,
    color: "#fff",
  },
  optionItem: {
    marginTop: 10,
    padding: "8px 0",
    textAlign: "left",
  },
  optionItemIcon: {
    width: theme.spacing(4),
    height: theme.spacing(4),
  },
  symbol: {
    fontSize: theme.typography.subtitle1.fontSize,
    lineHeight: 1,
  },
  gradientBorder: {
    content: "''",
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    padding: "1px",
    zIndex: -1,
    borderRadius: "16px",
    /* the below will do the magic */
    "-webkit-mask":
      "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0) padding-box" /* this will cover the content and the padding */,
    /* needed for old browsers until the below is more supported */
    "-webkit-mask-composite": "destination-out",
    /* this will exclude the first layer from the second so only the padding area will be kept visible */
    maskComposite: "destination-out",
    "&::before": {
      content: "''",
      position: "absolute",
      left: "50%",
      top: "50%",
      width: "100%",
      height: "100%",
      background: theme.palette.gradient.cta,
      transform: "translate(-50%, -50%) rotate(0deg)",
    },
  },
}));

const DropDown = (props) => {
  const { onChange, value, inputProps } = props;
  const classes = useStyles();
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const handleClickItem = (value) => {
    setOpen((pv) => !pv);
    onChange(value);
  };

  const handleOpen = () => setOpen((prev) => !prev);
  const handleClickAway = () => setOpen(false);

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box position="relative">
        <Button
          onClick={handleOpen}
          startIcon={
            <Avatar src={value?.logoURI} alt={value?.symbol} sx={{ width: 30, height: 30 }} />
          }
          endIcon={<ArrowDown isDark width="10" height="6" />}
          sx={{
            color: "#fff",
            "&:hover": {
              background: "none",
            },
            textTransform: "none",
          }}
        >
          {value?.symbol}
        </Button>
        {open && (
          <Box className={classes.dropdownContainer} color="#fff">
            <Box className={classes.inputContainer}>
              <SearchOutlined />
              <InputBase
                id="input"
                aria-label="search"
                className={classes.searchInput}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                {...inputProps}
                sx={{ color: "#fff" }}
              />
            </Box>
            <Box maxHeight={360} overflow="auto" sx={{ mt: 1 }}>
              {props.options.map((option) => (
                <Button
                  key={option.mint}
                  className={classes.optionItem}
                  fullWidth
                  onClick={() => handleClickItem(option)}
                  sx={{
                    "&:hover": {
                      background: "none",
                    },
                    textTransform: "none",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <Avatar
                      src={option.logoURI}
                      alt={option.symbol}
                      className={classes.optionItemIcon}
                    />
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        ml: 1,
                        lineHeight: 1,
                      }}
                    >
                      <Box
                        display="flex"
                        flexDirection="column"
                        height={32}
                        justifyContent="center"
                      >
                        <Box color="#fff" className={classes.symbol}>
                          {option.symbol}
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Button>
              ))}
            </Box>
            <i className={classes.gradientBorder} />
          </Box>
        )}
      </Box>
    </ClickAwayListener>
  );
};

export default DropDown;
