import React from "react";
import { Helmet } from "react-helmet-async";
import { Box, makeStyles, Theme } from "@material-ui/core";

import { DEFAULT_META } from "constants/meta";
import { TabMenu } from "components";
import ModalMenu from "components/Modal/ModalMenu";

const useStyles = makeStyles(({ breakpoints, mixins, palette, spacing }: Theme) => ({
  page: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    minHeight: "calc(100vh - 66px)",
    paddingTop: mixins.toolbar.minHeight,
    position: "relative",
    backgroundColor: palette.background.secondary,
    [breakpoints.down("md")]: {
      paddingTop: 96,
      minHeight: "calc(100vh - 116px)",
    },
  },
  sectionMobile: {
    display: "flex",
    marginBottom: spacing(3),
    [breakpoints.up("md")]: {
      display: "none",
    },
  },
}));

const PageMeta = () => {
  const { title, description } = { ...DEFAULT_META };

  return (
    <Helmet>
      <title>{title}</title>
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
    </Helmet>
  );
};

const Page: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, ...props }) => {
  const classes = useStyles(props);
  return (
    <>
      <PageMeta />
      <Box className={classes.page} {...props}>
        <div className={classes.sectionMobile}>
          <TabMenu />
        </div>
        {children}
        <ModalMenu />
      </Box>
    </>
  );
};

export default Page;
