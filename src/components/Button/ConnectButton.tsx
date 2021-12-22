import React from 'react'
import { Button, ButtonProps, makeStyles, Theme } from '@material-ui/core'

const useStyles = makeStyles(({ breakpoints, spacing, palette }: Theme) => ({
  button: {
    backgroundImage: `linear-gradient(rgba(255, 255, 255, 0), rgba(255, 255, 255, 0)), ${palette.gradient.btnCta}`,
    color: palette.text.primary,
    borderRadius: 100,
    border: 'solid 1px transparent',
    backgroundOrigin: 'border-box',
    backgroundClip: 'content-box, border-box',
    boxShadow: `2px 1000px 1px ${palette.background.primary} inset`,
    fontSize: 14,
    fontWeight: 500,
    '&:hover': {
      boxShadow: 'none',
      border: 'solid 1px transparent',
    },
    '&.Mui-disabled': {
      border: 0,
      color: '#FFFFFF',
      fontWeight: 600,
      backgroundColor: '#88809C',
    },
    [breakpoints.up('sm')]: {
      fontSize: 18,
    },
  },
  buttonContained: {
    background: palette.gradient.ctaContained,
    boxShadow: 'none',
    border: 'none',
    '&:hover': { border: 0 },
  },
  buttonOutlined: {
    border: 0,
    '&:hover': { border: 0 },
  },
  buttonSmall: {
    [breakpoints.up('sm')]: {
      fontSize: 18,
      lineHeight: '45px',
      fontWeight: 500,
      padding: '0 20px',
    },
  },
  buttonLarge: {
    [breakpoints.up('sm')]: {
      fontSize: 21,
      lineHeight: '58.31px',
      fontWeight: 400,
      color: '#F6F6F6',
      paddingTop: 7,
      paddingBottom: 7,
    },
  },
  buttonDisabled: {
    border: 0,
    color: '#FFFFFF',
    fontWeight: 600,
    backgroundColor: '#88809C',
    boxShadow: 'none',
    background: 'none',
  },
  roundButton: {
    minWidth: 42,
    height: 42,
    padding: 0,
    borderRadius: spacing(3),
  },
}))

const ConnectButton: React.FC<ButtonProps> = (props) => {
  const { children, ...otherProps } = props
  const classes = useStyles(props)

  return (
    <Button
      color="primary"
      variant="outlined"
      classes={{
        contained: classes.buttonContained,
        sizeSmall: classes.buttonSmall,
        sizeLarge: classes.buttonLarge,
        disabled: classes.buttonDisabled,
      }}
      className={classes.button}
      onClick={props.onClick}
      {...otherProps}
    >
      {props.children}
    </Button>
  )
}

export default React.memo(ConnectButton)
