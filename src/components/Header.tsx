import React, { useEffect } from "react";
import { AppBar, makeStyles, Theme, Container, Toolbar } from "@material-ui/core";
import { useWallet } from "@solana/wallet-adapter-react";
import { ConnectButton, TabMenu, WalletButton } from "components";
import { useModal } from "providers/modal";
import { HOMEPAGE_LINK } from "constants/index";
import { Box, Link } from "@mui/material";
import { useLocation } from "react-router";

const useStyles = makeStyles(({ breakpoints, palette }: Theme) => ({
  header: {
    background: palette.background.secondary,
    boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.15)",
    letterSpacing: "0.01em",
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  grow: {
    flexGrow: 1,
  },
  sectionDesktop: {
    display: "none",
    [breakpoints.up("md")]: {
      display: "flex",
    },
  },
  sectionMobile: {
    display: "flex",
    [breakpoints.up("md")]: {
      display: "none",
    },
  },
  logo: {
    width: 150,
    [breakpoints.down("sm")]: {
      width: 100,
    },
    [breakpoints.down("md")]: {
      width: 137,
    },
  },
}));

const Header: React.FC = (props) => {
  const classes = useStyles(props);
  const { connected: isConnectedWallet } = useWallet();
  const { setMenu } = useModal();
  const location = useLocation();

  useEffect(() => {
    if (isConnectedWallet) setMenu(false, "");
  }, [isConnectedWallet, setMenu]);

  const handleConnect = () => {
    if (location.pathname.substring(1) === "bridge") {
      // TODO (deltafilzr): rename connectV2 to a better one
      setMenu(true, "connectV2");
    } else {
      setMenu(true, "connect");
    }
  };

  return (
    <AppBar position="fixed" className={classes.header}>
      <Container>
        <Toolbar disableGutters className={classes.toolbar}>
          <Link
            href={HOMEPAGE_LINK}
            underline="none"
            data-amp-analytics-on="click"
            data-amp-analytics-name="click"
            data-amp-analytics-attrs="page: Header, target: Logo"
            sx={{ display: "flex" }}
          >
            <img
              src={process.env.PUBLIC_URL + "/images/horizontal_60.svg"}
              alt="logo"
              className={classes.logo}
            />
          </Link>
          <div className={classes.grow} />
          <div className={classes.sectionDesktop}>
            <TabMenu />
            {/* <MenuButton onClick={() => setMenu(true, 'menu')} /> */}
          </div>
          <div className={classes.grow} />
          {isConnectedWallet ? (
            <WalletButton />
          ) : (
            <ConnectButton size="small" onClick={handleConnect}>
              <Box fontSize={16}>Connect wallet</Box>
            </ConnectButton>
          )}
          {/* <div className={classes.sectionMobile}>
            <MenuButton onClick={() => setMenu(true, 'menu')} />
          </div> */}
        </Toolbar>
      </Container>
      {/* <MobileWrapper>
        <Logo
          href={HOMEPAGE_LINK}
          isDark={isDark}
          data-amp-analytics-on="click"
          data-amp-analytics-name="click"
          data-amp-analytics-attrs="page: Header, target: Logo"
        />
        <StyledDiv>
          <ConnectWallet />
          <Menu isDark={isDark} />
        </StyledDiv>
      </MobileWrapper>
      <DesktopWrapper>
        <Logo
          href={HOMEPAGE_LINK}
          isDark={isDark}
          data-amp-analytics-on="click"
          data-amp-analytics-name="click"
          data-amp-analytics-attrs="page: Header, target: Logo"
        />
        <StyledDiv>
          <ButtonGroup variant="contained">
            <Button
              onClick={() => handleActive('swap')}
              data-amp-analytics-on="click"
              data-amp-analytics-name="click"
              data-amp-analytics-attrs="page: Header, target: Swap"
            >
              Swap
            </Button>
            <Button
              onClick={() => handleActive('pools')}
              data-amp-analytics-on="click"
              data-amp-analytics-name="click"
              data-amp-analytics-attrs="page: Header, target: Pools"
            >
              Pools
            </Button>
            <Button
              onClick={() => handleActive('farms')}
              data-amp-analytics-on="click"
              data-amp-analytics-name="click"
              data-amp-analytics-attrs="page: Header, target: Farms"
            >
              Farms
            </Button>
          </ButtonGroup>
          <Menu isDark={isDark} />
        </StyledDiv>
        {!isConnectedWallet ? <ConnectWallet /> : <WalletButton />}
      </DesktopWrapper> */}
      {/* {isConnectedWallet && <WalletSetting open={menuOpen} setOpen={setMenuOpen} />} */}
    </AppBar>
  );
};

export default Header;
