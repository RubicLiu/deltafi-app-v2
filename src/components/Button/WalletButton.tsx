import React, { useState } from "react";
import { ButtonProps, makeStyles, Snackbar } from "@material-ui/core";
import styled from "styled-components";
import { useWallet } from "@solana/wallet-adapter-react";
import { ConnectButton } from "components";
import WalletPanel from "components/BurgerMenu/WalletPanel";

const Img = styled.img`
  width: 24px;
  height: 24px;
  ${({ theme }) => theme.muibreakpoints.up("sm")} {
    width: 34px;
    height: 34px;
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
  const accountAddress = publicKey ? publicKey.toString() : "";
  const classes = useStyles(props);

  return (
    <>
      <ConnectButton
        {...props}
        startIcon={<Img src={wallet.icon} alt={wallet.name} />}
        onClick={() => setOpen(!open)}
        className={classes.btn}
      >
        {accountAddress?.substring(0, 4)}...{accountAddress?.substring(accountAddress?.length - 4)}
      </ConnectButton>
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        className={classes.snackBar}
        open={open}
      >
        <WalletPanel />
      </Snackbar>
    </>
  );
};

export default React.memo(WalletButton);
