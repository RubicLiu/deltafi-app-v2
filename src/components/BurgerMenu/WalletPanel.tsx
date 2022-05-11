import { useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Avatar, Box, Divider, makeStyles, Theme } from "@material-ui/core";
import styled from "styled-components";
import { CopyAddressIcon } from "components";
import { useModal } from "providers/modal";
import { AddCircleOutline, CheckOutlined } from "@material-ui/icons";
import Reset from "components/Svg/icons/Reset";
import CompareArrows from "components/Svg/icons/CompareArrows";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";

const useStyles = makeStyles(({ breakpoints, palette, spacing }: Theme) => ({
  sectionDesktop: {
    display: "none",
    [breakpoints.up("md")]: {
      width: 450,
      display: "flex",
    },
  },
  sectionMobile: {
    display: "flex",
    width: "auto",
    [breakpoints.up("md")]: {
      display: "none",
    },
  },
  item: {
    background: palette.background.secondary,
    borderRadius: spacing(2),
    display: "flex",
    alignItems: "center",
    padding: `${spacing(4)}px ${spacing(3.5)}px`,
    marginTop: spacing(2),
    "& .icon": {
      marginRight: spacing(2),
    },
    cursor: "pointer",
  },
  icon: {
    width: "22px",
    marginRight: 16,
    marginLeft: "auto",
  },
  root: {
    backgroundColor: "#3c3c3c",
    padding: "20px 20px",
    boxShadow: "0px 5px 20px rgba(0, 0, 0, 0.15)",
    borderRadius: 10,
  },
  check: {
    color: "#D4FF00",
  },
  avatar: {
    width: 14,
    height: 14,
  },
}));

const ConnectList = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const Img = styled.img`
  width: 24px;
  height: 24px;
  ${({ theme }) => theme.muibreakpoints.up("sm")} {
    width: 28px;
    height: 28px;
  }
`;

const StyledDivider = styled(Divider)`
  margin: 16px 0;
  background: #313131;
`;

const WalletPanel: React.FC = (props) => {
  const { wallet, disconnect, publicKey } = useWallet();
  const { setMenu } = useModal();
  const classes = useStyles(props);

  const accountAddress = publicKey ? publicKey.toString() : "";

  const onCopyAddress = () => {
    navigator.clipboard.writeText(publicKey.toString());
    setMenu(false);
  };

  const onDisconnectWallet = useCallback(() => {
    disconnect();
    setMenu(false);
  }, [disconnect, setMenu]);

  return (
    <Box width={300} className={classes.root}>
      <ConnectList>
        <Box display="flex" width="100%" textAlign="center" alignItems="center">
          <CheckOutlined className={classes.check} />
          <Box marginLeft={1.2} marginRight={2}>
            <Img src={wallet.icon} alt={wallet.name} />
          </Box>
          <Box color="#fff">
            {accountAddress?.substring(0, 4)}...
            {accountAddress?.substring(accountAddress?.length - 4)}
          </Box>
          <CopyAddressIcon height={22} className={classes.icon} onClick={onCopyAddress} />
          <Reset width={22} onClick={onDisconnectWallet} />
        </Box>
        <StyledDivider />
        <Box>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            fontWeight={400}
            fontSize={16}
            color="#F6F6F6"
          >
            <Box>100.00 USDC</Box>
            <Box display="flex" alignItems="center">
              <Avatar
                className={classes.avatar}
                src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png"
              ></Avatar>
              <Box marginLeft={0.5} marginRight={0.5}>
                <CompareArrows></CompareArrows>
              </Box>
              <Avatar
                className={classes.avatar}
                src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png"
              ></Avatar>
            </Box>
            <Box>100.00 USDC</Box>
          </Box>
        </Box>
        <Box>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            fontWeight={400}
            fontSize={16}
            color="#F6F6F6"
          >
            <Box display="flex" flexDirection="column">
              <Box>UUID: De4H...qFHK</Box>
              <Box>Mar 30 2022 12:00</Box>
            </Box>
            <Box color="#D4FF00" display="flex" alignItems="center">
              <CheckCircleOutlineIcon />
              <Box ml={0.5}>Swap Successful</Box>
            </Box>
          </Box>
        </Box>
        <StyledDivider />
        <Box
          display="flex"
          color="#D4FF00"
          onClick={() => setMenu(true, "connectV2")}
          justifyContent="center"
          alignItems="center"
        >
          <AddCircleOutline fontSize="large" />
          <Box ml={1.5} fontSize={18} fontWeight={600}>
            Connect Wallet
          </Box>
        </Box>
      </ConnectList>
    </Box>
  );
};

export default WalletPanel;
