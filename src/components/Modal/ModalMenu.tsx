import { createRef, ReactElement } from "react";
import { makeStyles } from "@material-ui/core/styles";

import ConnectPanel from "components/BurgerMenu/ConnectPanel";
import WalletPanel from "components/BurgerMenu/WalletPanel";
import ConfirmSwapPanel from "components/BurgerMenu/ConfirmSwapPanel";
import ConnectPanelV2 from "components/BurgerMenu/ConnectPanel_v2";
import StakeV2 from "views/Stake/Stake_v2";
import Deposit from "views/Deposit/Deposit";
// import Stake from "views/Stake/Stake";
import { useModal } from "providers/modal";
import { Modal, Fade, Backdrop } from "@mui/material";
import styled from "styled-components";
import LiquidityReward from "components/BurgerMenu/LiquidityReward";

const useStyles = makeStyles((theme) => ({
  modal: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    overflow: "auto",
    paddingTop: 40,
    flexWrap: "wrap",
  },
  paper: {
    backgroundColor: theme.palette.background.primary,
    margin: theme.spacing(2),
    padding: `${theme.spacing(3)}px ${theme.spacing(2)}px`,
    borderRadius: theme.spacing(2),
    [theme.breakpoints.up("sm")]: {
      borderRadius: theme.spacing(3),
      padding: `${theme.spacing(5)}px ${theme.spacing(4)}px`,
      minWidth: 380,
    },
  },
}));
const StyledBackdrop = styled(Backdrop)`
  &.MuiBackdrop-root {
    background-color: rgba(51, 51, 51, 0.9);
    z-index: -1;
  }
`;

export default function ModalMenu() {
  const classes = useStyles();
  const { menuOpen, menu, setMenu, data } = useModal();

  const renderModalContent = (): ReactElement => {
    switch (menu) {
      case "connect":
        return <ConnectPanel />;
      case "connectV2":
        return <ConnectPanelV2 />;
      case "wallet":
        return <WalletPanel />;
      case "confirm-swap":
        return <ConfirmSwapPanel />;
      case "deposit":
        return <Deposit />;
      case "stake":
        return <StakeV2 />;
      case "withdraw":
        return null; // <WithdrawPanel />
      case "liquidity-reward":
        return (
          <LiquidityReward
            farmPoolInfoList={data?.farmPoolInfoList}
            handleClaimFarmRewards={
              data?.handleClaimFarmRewards || (() => console.error("no handler"))
            }
          />
        );
      default:
        return null;
    }
  };

  const wrap = createRef<HTMLDivElement>();

  return (
    <Modal
      aria-labelledby="transition-modal-title"
      aria-describedby="transition-modal-description"
      className={classes.modal}
      open={menuOpen}
      onClose={() => setMenu(false, "")}
      closeAfterTransition
      BackdropComponent={StyledBackdrop}
      BackdropProps={{
        timeout: 500,
      }}
    >
      <Fade in={menuOpen}>
        <div ref={wrap} className={classes.paper}>
          {renderModalContent()}
        </div>
      </Fade>
    </Modal>
  );
}
