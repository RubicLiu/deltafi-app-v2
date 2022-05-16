import React from "react";
import { Box, Button, ButtonProps } from "@material-ui/core";
import styled from "styled-components";

const StyledButton = styled(Button)`
  font-style: normal;
  font-weight: 600;
  font-size: 18px;
  line-height: 24px;
  display: flex;
  align-items: center;
  text-align: center;
  padding: 12px 36px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  background: linear-gradient(111.31deg, #d4ff00 15.34%, #bdff00 95.74%);
  border-radius: 100px;
  color: #313131;
  text-transform: none;
  @media (max-width: 600px) {
    padding: 6px 6px;
  }
  &.MuiButton-root:hover {
    background: linear-gradient(
      111.31deg,
      rgba(212, 255, 0, 0.4) 15.34%,
      rgba(189, 255, 0, 0.4) 95.74%
    );
  }
  &.Mui-disabled {
    color: #88809c;
  }
  &.MuiButton-outlined {
    border: 2px solid transparent;
    background: #1c1c1c;
    color: #fff;
    box-sizing: border-box;
    background-clip: padding-box;
  }
  &.MuiButton-sizeLarge {
    line-height: 50px;
    font-size: 20px;
  }
`;

const StyledOutlineCt = styled(Box)`
  line-height: 24px;
  padding: 2px; /* !importanté */
  border-radius: 100px; /* !importanté */
  background: linear-gradient(111.31deg, #d4ff00 15.34%, #bdff00 95.74%);
  button {
    width: 100%;
    height: 100%;
    font-weight: 600;
    font-size: 18px;
    line-height: 24px;
    display: flex;
    align-items: center;
    text-align: center;
    border-radius: 100px;
    color: #fff;
    background: #1c1c1c;
    &.MuiButton-root:hover {
      background: #333333;
    }
  }
`;

const ConnectButton: React.FC<ButtonProps> = (props) => {
  const { children, ...otherProps } = props;

  return (
    <>
      {props.variant === "outlined" ? (
        <StyledOutlineCt {...otherProps}>
          <Button variant="outlined" onClick={props.onClick}>
            {props.children}
          </Button>
        </StyledOutlineCt>
      ) : (
        <StyledButton variant="contained" onClick={props.onClick} {...otherProps}>
          {props.children}
        </StyledButton>
      )}
    </>
  );
};

export default React.memo(ConnectButton);
