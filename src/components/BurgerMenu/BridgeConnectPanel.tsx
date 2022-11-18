import { useState } from "react";
import styled from "styled-components";
import CloseIcon from "@material-ui/icons/Close";
import { useWallet } from "@solana/wallet-adapter-react";
import { Wallet } from "@solana/wallet-adapter-wallets";
import { Checkbox, IconButton, makeStyles, Theme, Typography } from "@material-ui/core";
import { useModal } from "providers/modal";
import { CheckBoxOutlineBlankOutlined, CheckBoxOutlined } from "@material-ui/icons";
import CheckIcon from "@mui/icons-material/Check";
import { Box, Divider } from "@mui/material";
import DropDown from "components/ChainDropdown";
import { CopyAddressIcon } from "components/Svg";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import { ConnectButton } from "components/Button";

const useStyles = makeStyles(({ breakpoints, palette, spacing }: Theme) => ({
  header: {},
  content: {
    width: "100%",
    marginTop: spacing(3),
    [breakpoints.up("sm")]: {
      marginTop: spacing(2.5),
    },
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
    marginTop: 24,
  },
  walletName: {
    fontSize: 14,
    textAlign: "left",
  },
  checkBox: {
    color: palette.text.success,
  },
  label: {
    color: palette.text.secondary,
    marginBottom: 24,
    fontWeight: 500,
    fontSize: 16,
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
    width: 232px;
  }

  &.selected {
    border: 1px solid #d4ff00;
  }
`;
const Img = styled.img`
  width: 24px;
  height: 24px;
  margin-right: 8px;
  margin-right: 16px;

  ${({ theme }) => theme.muibreakpoints.up("sm")} {
    width: 28px;
    height: 28px;
    margin-right: 16px;
  }
`;

const BridgeConnectPanel: React.FC = (props) => {
  const wallet = useWallet();

  const { setMenu } = useModal();
  const [isAccept, setAccept] = useState(false);
  const [selectedNetworkIdx, setSelectedNetworkIdx] = useState(0);
  const [wallet1Connected, setWallet1] = useState(null);
  const [wallet2Connected, setWallet2] = useState(null);
  const classes = useStyles(props);

  const onConnectWallet = async (type: Wallet) => {
    // mock setwallet
    if (selectedNetworkIdx === 0) setWallet1(type);
    else setWallet2(type);
    // if (!isAccept) {
    //   return;
    // }
    // if (type.adapter().connected) {
    //   await type.adapter().disconnect();
    // }

    // let notFound = false;
    // switch (type.name) {
    //   case WalletName.Phantom:
    //     notFound = !(window as any)?.solana?.isPhantom;
    //     break;
    //   case WalletName.Solflare:
    //   case WalletName.SolflareWeb:
    //     notFound = !(window as any)?.solflare?.isSolflare;
    //     break;
    //   case WalletName.Coin98:
    //     notFound = !(window as any)?.coin98;
    //     break;
    //   case WalletName.SolletExtension:
    //     notFound = !(window as any)?.sollet;
    //     break;
    //   case WalletName.Slope:
    //     notFound = !(window as any)?.Slope;
    //     break;
    //   case WalletName.Sollet:
    // }

    // if (notFound) {
    //   window.open(type.url, "_blank");
    // } else {
    //   wallet.select(type.name);
    // }
  };

  const networks = [
    {
      name: "USD Coin",
      mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      symbol: "Solana",
      decimals: 6,
      logoURI: "/images/solana.png",
      pyth: {
        price: "Gnt27xtC473ZT2Mw5u8wZ68Z3gULkSTb5DuxJy7eJotD",
        product: "8GWTTbNiXdmyZREXbjsZBmCRuzdPrW55dnZGDkTRjWvb",
        productName: "Crypto.USDC/USD",
      },
    },
  ];

  return (
    <Box width="100%" fontFamily="Poppins">
      <Box display="flex" justifyContent="space-between" className={classes.header}>
        <Typography variant="h6">Connect Wallet</Typography>
        <IconButton size="small" onClick={() => setMenu(false, "")}>
          <CloseIcon />
        </IconButton>
      </Box>
      {!!wallet1Connected === !!wallet2Connected ? (
        <>
          <Box className={classes.content}>
            <Box className={classes.label}>Choose Network</Box>
            <ConnectList>
              {wallet.wallets.slice(0, 2).map((item, index) => (
                <ConnectItem
                  key={`w-item-${index}`}
                  isAccept={isAccept}
                  onClick={() => setSelectedNetworkIdx(index)}
                  className={index === selectedNetworkIdx ? "selected" : ""}
                  data-amp-analytics-name="click"
                  data-amp-analytics-attrs="page: Menu, target: ConnectLedger"
                >
                  <Img
                    src={item.icon}
                    alt={item.name}
                    className={isAccept ? classes.grayScale : ""}
                  />
                  <Typography
                    color={isAccept ? "primary" : "primary"}
                    className={classes.walletName}
                  >
                    {item.name}
                  </Typography>
                  {((index === 0 && wallet1Connected) || (index === 1 && wallet2Connected)) && (
                    <CheckIcon
                      sx={{ height: 16, marginRight: 0, marginLeft: "auto", color: "#D4FF00" }}
                    />
                  )}
                </ConnectItem>
              ))}
            </ConnectList>
          </Box>
          <Divider flexItem sx={{ backgroundColor: "#313131", marginTop: 3 }} />
          <Box className={classes.content}>
            <Box className={classes.label}>Choose Wallet</Box>
            {wallet2Connected ? (
              <>
                <Box
                  sx={{
                    border: "1px solid #D4FF00",
                    borderRadius: "16px",
                    height: "64px",
                    width: "472px",
                    bgcolor: "#333333",
                  }}
                  display="flex"
                  textAlign="center"
                  alignItems="center"
                  pl={5}
                  pr={5}
                  mt={2}
                >
                  <Box component="img" mr={2} src={wallet1Connected.icon} height={28}></Box>
                  <Box color="#fff">8iaU1RZ9Dhy9U...dzK1NEVseHdh5</Box>
                  <Box ml="auto" mr={0}>
                    <CopyAddressIcon height={22} color="#D4FF00" />
                  </Box>
                </Box>
                <Box
                  display="flex"
                  color="#D4FF00"
                  justifyContent="center"
                  alignItems="center"
                  sx={{ cursor: "pointer" }}
                  mt={2}
                  height={64}
                >
                  <AddCircleOutlineOutlinedIcon />
                  <Box ml={1.5} fontSize={18} fontWeight={600}>
                    Disconnect Wallet
                  </Box>
                </Box>
              </>
            ) : (
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
                    <Typography
                      color={isAccept ? "primary" : "primary"}
                      className={classes.walletName}
                    >
                      {item.name}
                    </Typography>
                  </ConnectItem>
                ))}
              </ConnectList>
            )}
          </Box>
          <Box display="flex" alignItems="center" className={classes.footer}>
            <Checkbox
              checked={isAccept}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setAccept(event.target.checked)
              }
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
        </>
      ) : (
        <>
          <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
            <Box>From</Box>
            <DropDown
              value={networks[0]}
              options={networks}
              onChange={() => {}}
              inputProps={{ placeholder: "Chain Name, Symbol" }}
              size="large"
              variant="network"
            />
          </Box>
          {wallet1Connected ? (
            <>
              <Box
                sx={{
                  border: "1px solid #D4FF00",
                  borderRadius: "16px",
                  height: "64px",
                  width: "472px",
                  bgcolor: "#333333",
                }}
                display="flex"
                textAlign="center"
                alignItems="center"
                pl={5}
                pr={5}
                mt={2}
              >
                <Box component="img" mr={2} src={wallet1Connected.icon} height={28}></Box>
                <Box color="#fff">8iaU1RZ9Dhy9U...dzK1NEVseHdh5</Box>
                <Box ml="auto" mr={0}>
                  <CopyAddressIcon height={22} color="#D4FF00" />
                </Box>
              </Box>
              <Box
                display="flex"
                color="#D4FF00"
                justifyContent="center"
                alignItems="center"
                sx={{ cursor: "pointer" }}
                mt={2}
                height={64}
              >
                <AddCircleOutlineOutlinedIcon />
                <Box ml={1.5} fontSize={18} fontWeight={600}>
                  Disconnect Wallet
                </Box>
              </Box>
            </>
          ) : (
            <Box>
              <ConnectList>
                {wallet.wallets.map((item, index) => (
                  <ConnectItem
                    key={`w-item-${index}`}
                    isAccept={isAccept}
                    onClick={() => setWallet1(item)}
                    data-amp-analytics-name="click"
                    data-amp-analytics-attrs="page: Menu, target: ConnectLedger"
                  >
                    <Img
                      src={item.icon}
                      alt={item.name}
                      className={isAccept ? classes.grayScale : ""}
                    />
                    <Typography
                      color={isAccept ? "primary" : "primary"}
                      className={classes.walletName}
                    >
                      {item.name}
                    </Typography>
                  </ConnectItem>
                ))}
              </ConnectList>
              <Box display="flex" alignItems="center" className={classes.footer}>
                <Checkbox
                  checked={isAccept}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setAccept(event.target.checked)
                  }
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
              <Box mt={2}>
                <ConnectButton size="large" fullWidth>
                  Confirm
                </ConnectButton>
              </Box>
            </Box>
          )}
          <Divider flexItem sx={{ backgroundColor: "#313131", marginTop: 2, marginBottom: 2 }} />
          <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
            <Box>To</Box>
            <DropDown
              value={networks[0]}
              options={networks}
              onChange={() => {}}
              inputProps={{ placeholder: "Chain Name, Symbol" }}
              size="large"
              variant="network"
            />
          </Box>
          {wallet2Connected ? (
            <>
              <Box
                sx={{
                  border: "1px solid #D4FF00",
                  borderRadius: "16px",
                  height: "64px",
                  width: "472px",
                  bgcolor: "#333333",
                }}
                display="flex"
                textAlign="center"
                alignItems="center"
                pl={5}
                pr={5}
                mt={2}
              >
                <Box component="img" mr={2} src={wallet2Connected.icon} height={28}></Box>
                <Box color="#fff">8iaU1RZ9Dhy9U...dzK1NEVseHdh5</Box>
                <Box ml="auto" mr={0}>
                  <CopyAddressIcon height={22} color="#D4FF00" />
                </Box>
              </Box>
              <Box
                display="flex"
                color="#D4FF00"
                justifyContent="center"
                alignItems="center"
                sx={{ cursor: "pointer" }}
                mt={2}
                height={64}
              >
                <AddCircleOutlineOutlinedIcon />
                <Box ml={1.5} fontSize={18} fontWeight={600}>
                  Disconnect Wallet
                </Box>
              </Box>
            </>
          ) : (
            <Box mt={2}>
              <ConnectList>
                {wallet.wallets.map((item, index) => (
                  <ConnectItem
                    key={`w-item-${index}`}
                    isAccept={isAccept}
                    onClick={() => setWallet2(item)}
                    data-amp-analytics-name="click"
                    data-amp-analytics-attrs="page: Menu, target: ConnectLedger"
                  >
                    <Img
                      src={item.icon}
                      alt={item.name}
                      className={isAccept ? classes.grayScale : ""}
                    />
                    <Typography
                      color={isAccept ? "primary" : "primary"}
                      className={classes.walletName}
                    >
                      {item.name}
                    </Typography>
                  </ConnectItem>
                ))}
              </ConnectList>
              <Box display="flex" alignItems="center" className={classes.footer}>
                <Checkbox
                  checked={isAccept}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setAccept(event.target.checked)
                  }
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
              <Box mt={2}>
                <ConnectButton size="large" fullWidth>
                  Confirm
                </ConnectButton>
              </Box>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default BridgeConnectPanel;
