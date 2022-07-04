import React, { useState } from "react";
import { ButtonProps, makeStyles, Snackbar } from "@material-ui/core";
import styled from "styled-components";
import { useWallet } from "@solana/wallet-adapter-react";
import { ConnectButton } from "components";
import WalletPanel from "components/BurgerMenu/WalletPanel";
import { Box } from "@mui/material";
import { useLocation } from "react-router";
import WalletPanel_v2 from "components/BurgerMenu/WalletPanel_v2";

const Img = styled.img`
  width: 24px;
  height: 24px;
  ${({ theme }) => theme.muibreakpoints.up("sm")} {
    border-radius: 50%;
  }
`;
const useStyles = makeStyles({
  btn: {
    "& .MuiButton-startIcon": {
      height: 12,
      alignItems: "center",
    },
  },
  snackBar: {
    marginTop: 60,
  },
});

const WalletButton: React.FC<ButtonProps> = (props) => {
  const [open, setOpen] = useState(false);
  const { wallet, publicKey } = useWallet();
  const classes = useStyles(props);
  const accountAddress = publicKey ? publicKey.toString() : "";
  const location = useLocation();

  return (
    <>
      <ConnectButton
        {...props}
        startIcon={<Img src={wallet.icon} alt={wallet.name} />}
        onClick={() => setOpen(!open)}
      >
        <Box fontSize={16}>
          {accountAddress?.substring(0, 4)}...
          {accountAddress?.substring(accountAddress?.length - 4)}
        </Box>
      </ConnectButton>
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        className={classes.snackBar}
        open={open}
      >
        {location.pathname.substring(1) === "bridge" ? (
          <WalletPanel_v2></WalletPanel_v2>
        ) : (
          <WalletPanel />
        )}
      </Snackbar>
    </>
  );
};

export default React.memo(WalletButton);
