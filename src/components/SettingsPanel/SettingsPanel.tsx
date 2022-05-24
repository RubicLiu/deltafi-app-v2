import { useEffect, useRef } from "react";
import styled from "styled-components";
import { Box, makeStyles, Paper, Theme, Typography } from "@material-ui/core";
import CurrencyInput from "react-currency-input-field";

import { Button } from "components/Button";
import { SettingsProps } from "./types";
import React from "react";

const PRICE_LIST = ["0.5", "1.0", "2.0"];

const useStyles = makeStyles(({ breakpoints, palette, spacing }: Theme) => ({
  root: {
    padding: spacing(2),
    [breakpoints.up("sm")]: {
      padding: spacing(3),
    },
    top: 80,
    left: "4%",
    width: "92%",
    position: "absolute",
    /* Style */

    background: "#313131",
    /* Style */

    border: "1px solid #D4FF00",
    boxSizing: "border-box",
    borderRadius: 20,
  },
  currencyInput: {
    textAlign: "center",
    outline: "none",
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "Inter",
    width: "100%",
    border: "none",
    backgroundColor: palette.text.crypto,
    color: palette.text.dark,
    borderRadius: 2,

    height: "100%",
    "&::placeholder": {
      color: palette.text.dark,
    },
    "&:focus": {
      border: "1px solid #D4FF00",
      backgroundColor: "#000",
      color: palette.text.primary,
    },
  },
  maxImpact: {
    fontWeight: 500,
    fontSize: 20,
    lineHeight: 1.2,
  },
  description: {
    fontSize: 14,
    lineHeight: "18px",
    color: "#D3D3D3",
    [breakpoints.down("sm")]: {
      fontSize: 12,
    },
  },

  gradientBorder: {
    content: "''",
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    zIndex: -1,
    padding: "1px",
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
      background: palette.gradient.cta,
      transform: "translate(-50%, -50%) rotate(0deg)",
    },
  },
}));

const PriceList = styled.ul`
  padding: 0px;
  margin: 0px;
  display: grid;
  gap: 6px;
  width: 100%;
  grid-template-columns: 0.5fr 0.5fr 0.5fr 2fr;
  margin-top: ${({ theme }) => theme.spacing(1.5)}px;
  &.small {
    grid-template-columns: 1fr 1fr 1fr;
  }

  ${({ theme }) => theme.muibreakpoints.up("sm")} {
    margin-top: ${({ theme }) => theme.spacing(2)}px;
  }
`;
const PriceItem = styled.li`
  list-style: none;
  background: ${({ theme }) => theme.palette.text.crypto};
  border-radius: 2px;
  box-shadow: rgb(0 0 0 / 8%) 0px 20px 100px;
  box-sizing: border-box;
  border: "1px transparent",
  position: "absolute",

  &:last-child {
    grid-column: auto;

    &.small {
      grid-column: 1 / 4;
    }
    ${({ theme }) => theme.muibreakpoints.down("md")} {
      grid-column: 1 / 4;
    }
  }

  &.active {
    border: none;
    position: relative;
    background: ${({ theme }) => theme.palette.background.black};
    & i {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      padding: 1px;
      position: absolute;
      border-radius: 2px;
      /* the below will do the magic */
      -webkit-mask:
        linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0) padding-box /* this will cover the content and the padding */;
      /* needed for old browsers until the below is more supported */
      -webkit-mask-composite: destination-out;
      /* this will exclude the first layer from the second so only the padding area will be kept visible */
      mask-composite: destination-out;
      &::before {
        top: 50%;
        left: 50%;
        width: 100%;
        height: 100%;
        content: '';
        position: absolute;
        background: ${({ theme }) => theme.palette.gradient.cta};
        transform: translate(-50%, -50%) rotate(0deg);
      }
    }
  }
`;

const SettingsPanel = React.forwardRef((props: SettingsProps, ref): JSX.Element => {
  const { priceImpact, isSmall, handleChangeImpact } = props;
  const classes = useStyles(props);
  const currencyInputRef = useRef<HTMLInputElement>();

  useEffect(() => {
    if (props.isOpen && !PRICE_LIST.includes(priceImpact)) {
      currencyInputRef.current?.focus();
    }
  }, [props.isOpen, priceImpact]);

  const handleChangeInput = (value: string) => {
    if (isNaN(parseFloat(value)) && value !== "") return;
    if (parseFloat(value) > 100) return;
    handleChangeImpact(value);
  };

  return (
    <Paper className={classes.root} ref={ref}>
      <Box>
        <Typography variant="body1" className={classes.maxImpact} color="textPrimary">
          Max Price Impact
        </Typography>
        <PriceList className={isSmall ? "small" : ""}>
          {PRICE_LIST.map((price) => (
            <PriceItem
              key={`item-${price}`}
              className={`${priceImpact === price ? "active" : ""} ${isSmall ? "small" : ""}`}
              onClick={() => handleChangeImpact(price)}
              data-amp-analytics-on="click"
              data-amp-analytics-name="click"
              data-amp-analytics-attrs={`page: Settings, target: MaxPriceImpact(${price})}`}
            >
              <Button variant="text" fullWidth>
                {`${price}%`}
              </Button>
              <i />
            </PriceItem>
          ))}
          <CurrencyInput
            ref={currencyInputRef}
            name="price impact"
            autoFocus
            className={classes.currencyInput}
            defaultValue={0}
            autoComplete="off"
            placeholder="0"
            allowNegativeValue={false}
            suffix="%"
            decimalScale={1}
            decimalsLimit={1}
            value={priceImpact}
            onValueChange={handleChangeInput}
          />
        </PriceList>
      </Box>
    </Paper>
  );
});

SettingsPanel.defaultProps = {
  priceImpact: "2.0%",
  isSmall: false,
  handleChangeImpact: () => {},
  handleClose: () => {},
};

export default SettingsPanel;
