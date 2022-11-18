import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Divider, makeStyles, Theme } from "@material-ui/core";
import styled from "styled-components";
import { CopyAddressIcon } from "components";
import { useModal } from "providers/modal";
import { CheckOutlined } from "@material-ui/icons";
import MuiAlert, { AlertProps } from "@mui/material/Alert";
import { Avatar, Box, Fade } from "@mui/material";
import CompareArrows from "components/Svg/icons/CompareArrows";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import Reset from "components/Svg/icons/Reset";

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
    color: "#D4FF00",
    "&:hover": {
      cursor: "pointer",
    },
  },
  root: {
    backgroundColor: "#3c3c3c",
    padding: "20px 20px",
    boxShadow: "0px 5px 20px rgba(0, 0, 0, 0.15)",
    borderRadius: 10,
    minWidth: 300, // 300 looks ok, maybe adjust further based on the design
  },
  check: {
    color: "#D4FF00",
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

const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  return (
    <MuiAlert
      elevation={6}
      ref={ref}
      variant="filled"
      {...props}
      sx={{ position: "fixed", top: 20, backgroundColor: "#d4ff00", color: "#333" }}
    />
  );
});

// TODO: generate real swap history
const swapHistory = [{}];

const BridgeWalletPanel: React.FC = (props) => {
  const { wallet, disconnect, publicKey } = useWallet();
  const { setMenu } = useModal();
  const [copyMessageOpen, setCopyMessageOpen] = useState(false);
  const classes = useStyles(props);

  const accountAddress = publicKey ? publicKey.toString() : "";
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  const onCopyAddress = () => {
    navigator.clipboard.writeText(publicKey.toString());
    setCopyMessageOpen(true);
    setTimeout(() => {
      if (mounted.current) setCopyMessageOpen(false);
    }, 2000);
    setMenu(false);
  };

  const onDisconnectWallet = useCallback(() => {
    disconnect();
    setMenu(false);
  }, [disconnect, setMenu]);

  return (
    <Box className={classes.root}>
      <ConnectList>
        <Box display="flex" width="100%" textAlign="center" alignItems="center">
          <CheckOutlined className={classes.check} />
          <Box marginLeft={1.2} marginRight={2} position="relative">
            <Img src={wallet.icon} alt={wallet.name} />
            {/* TODO: fill-in network logo URL */}
            <Box
              component="img"
              sx={{ height: 15, width: 15, position: "absolute", border: "1px solid #D4FF00" }}
              borderRadius="50%"
              src="data:image/png;base64,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"
              top={13}
              right={-11}
            ></Box>
          </Box>
          <Box color="#fff">
            {accountAddress?.substring(0, 4)}...
            {accountAddress?.substring(accountAddress?.length - 4)}
          </Box>
          <CopyAddressIcon height={22} className={classes.icon} onClick={onCopyAddress} />
          <Reset width={22} onClick={onDisconnectWallet} />
        </Box>
        {/* dump style, could be displayed when the data is ready */}
        {swapHistory.map((it, idx) => (
          <Box key={idx}>
            <StyledDivider />
            <Box>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                fontWeight={400}
                fontSize={16}
                color="#F6F6F6"
                whiteSpace="nowrap"
                gap={1}
              >
                <Box>100.00 USDC</Box>
                <Box display="flex" alignItems="center">
                  <Box position="relative">
                    <Avatar
                      sx={{ width: 20, height: 20 }}
                      src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png"
                    ></Avatar>
                    {/* TODO: fill-in network logo URL */}
                    <Box
                      component="img"
                      sx={{
                        height: 10,
                        width: 10,
                        position: "absolute",
                        border: "1px solid #D4FF00",
                      }}
                      borderRadius="50%"
                      src="data:image/png;base64,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"
                      top={11}
                      right={-5}
                    ></Box>
                  </Box>
                  <Box marginLeft={1} marginRight={0.5}>
                    <CompareArrows></CompareArrows>
                  </Box>
                  <Box position="relative">
                    <Avatar
                      sx={{ width: 20, height: 20 }}
                      src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png"
                    ></Avatar>
                    {/* TODO: fill-in network logo URL */}
                    <Box
                      component="img"
                      sx={{
                        height: 10,
                        width: 10,
                        position: "absolute",
                        border: "1px solid #D4FF00",
                      }}
                      borderRadius="50%"
                      src="data:image/png;base64,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"
                      top={11}
                      right={-5}
                    ></Box>
                  </Box>
                </Box>
                <Box>100.00 USDC</Box>
              </Box>
            </Box>
            <Box>
              {}
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                fontWeight={400}
                fontSize={12}
                color="#F6F6F6"
                mt={0.5}
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
          </Box>
        ))}

        <StyledDivider />
        <Box
          display="flex"
          color="#D4FF00"
          onClick={onDisconnectWallet}
          justifyContent="center"
          alignItems="center"
          sx={{ cursor: "pointer" }}
        >
          <AddCircleOutlineOutlinedIcon />
          <Box ml={1.5} fontSize={18} fontWeight={600}>
            Disconnect Wallet
          </Box>
        </Box>

        <Fade in={copyMessageOpen} easing={{ exit: "3000" }}>
          <Alert>Wallet Address Copied!</Alert>
        </Fade>
      </ConnectList>
    </Box>
  );
};

export default BridgeWalletPanel;