import { useState } from "react";
import styled from "styled-components";
import CloseIcon from "@material-ui/icons/Close";
import { useWallet } from "@solana/wallet-adapter-react";
import { Wallet, WalletName } from "@solana/wallet-adapter-wallets";
import { Box, Checkbox, IconButton, makeStyles, Theme, Typography } from "@material-ui/core";
import { useModal } from "providers/modal";
import { CheckBoxOutlineBlankOutlined, CheckBoxOutlined } from "@material-ui/icons";

const useStyles = makeStyles(({ breakpoints, palette, spacing }: Theme) => ({
  header: {},
  content: {
    width: "100%",
    marginTop: spacing(3),
    [breakpoints.up("sm")]: {
      marginTop: spacing(5),
    },
  },
  checkBox: {
    color: palette.text.success,
  },
  grayScale: {
    filter: "none !important",
  },
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
  footer: {
    marginTop: 40,
  },
  footerText: {
    marginLeft: 16,
  },
  walletName: {
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: 500,
    textAlign: "left",
  },
}));

interface ConnectProps {
  readonly isAccept: boolean;
}
const ExternalLink = styled.a`
  color: ${({ theme }) => theme.palette.text.success};
  outline: none;
  text-decoration: none;
`;
const ConnectList = styled.div`
  display: grid;
  width: 100%;
  grid-template-columns: 1fr 1fr;
  grid-gap: 12px;
`;

const ConnectItem = styled.div<ConnectProps>`
  background: ${({ theme, isAccept }) =>
    isAccept ? theme.palette.background.secondary : theme.palette.background.secondary};
  border-radius: 16px;
  height: 64px;
  display: flex;
  align-items: center;
  padding: 16px 12px;
  position: relative;
  text-align: center;
  cursor: ${({ isAccept }) => (isAccept ? "pointer" : "unset")};

  ${({ theme }) => theme.muibreakpoints.up("md")} {
    height: 64px;
    width: 232px;
  }
`;
const Img = styled.img`
  width: 24px;
  height: 24px;
  margin-right: 8px;
  filter: grayscale(1);
  margin-right: 16px;

  ${({ theme }) => theme.muibreakpoints.up("sm")} {
    width: 28px;
    height: 28px;
    margin-right: 16px;
  }
`;

const ConnectPanel: React.FC = (props) => {
  const wallet = useWallet();
  const { setMenu } = useModal();
  const [isAccept, setAccept] = useState(false);
  const classes = useStyles(props);

  const onConnectWallet = async (type: Wallet) => {
    if (!isAccept) {
      return;
    }
    if (type.adapter().connected) {
      await type.adapter().disconnect();
    }

    let notFound = false;
    switch (type.name) {
      case WalletName.Phantom:
        notFound = !(window as any)?.solana?.isPhantom;
        break;
      case WalletName.Solflare:
      case WalletName.SolflareWeb:
        notFound = !(window as any)?.solflare?.isSolflare;
        break;
      case WalletName.Coin98:
        notFound = !(window as any)?.coin98;
        break;
      case WalletName.SolletExtension:
        notFound = !(window as any)?.sollet;
        break;
      case WalletName.Slope:
        notFound = !(window as any)?.Slope;
        break;
      case WalletName.Sollet:
    }

    if (notFound) {
      window.open(type.url, "_blank");
    } else {
      wallet.select(type.name);
    }
  };

  return (
    <Box width="100%">
      <Box display="flex" justifyContent="space-between" className={classes.header}>
        <Typography variant="h6">Connect Wallet</Typography>
        <IconButton size="small" onClick={() => setMenu(false, "")}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Box className={classes.content}>
        <Box>
          <ConnectList>
            {wallet.wallets.map((item, index) => (
              <ConnectItem
                key={`w-item-${index}`}
                isAccept={isAccept}
                onClick={() => onConnectWallet(item)}
                data-amp-analytics-name="click"
                data-amp-analytics-attrs="page: Menu, target: ConnectLedger"
              >
                <Img
                  src={item.icon}
                  alt={item.name}
                  className={isAccept ? classes.grayScale : ""}
                />
                <Typography color={isAccept ? "primary" : "primary"} className={classes.walletName}>
                  {item.name}
                </Typography>
              </ConnectItem>
            ))}
          </ConnectList>
        </Box>
      </Box>
      <Box display="flex" alignItems="center" className={classes.footer}>
        <Checkbox
          checked={isAccept}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => setAccept(event.target.checked)}
          checkedIcon={<CheckBoxOutlined className={classes.checkBox} />}
          icon={<CheckBoxOutlineBlankOutlined className={classes.checkBox} />}
          style={{ width: 30, height: 30 }}
        />
        <Box ml={1} fontWeight={400} fontSize={12} color="#B7B4C7">
          I have read, understand, and agree to the{" "}
          <ExternalLink href="/terms" target="_blank" rel="noreferrer noopener">
            Terms of Service
          </ExternalLink>
        </Box>
      </Box>
    </Box>
  );
};

export default ConnectPanel;
