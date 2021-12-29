import React from 'react'
import styled from 'styled-components'
import { Box, Link } from '@material-ui/core'

interface Props {
  isDark: boolean
  href: string
}

const StyledLink = styled.a`
  display: flex;
  align-items: center;
`

const Img = styled.img`
  width: 153px;
  height: 37px;
  padding-right: 12px;

  ${({ theme }) => theme.muibreakpoints.down('md')} {
    width: 108px;
    height: 26px;
  }
`

const Logo: React.FC<Props> = ({ isDark, href }) => {
  return (
    <Box>
      <Link underline="none" href={href} aria-label="DeltaFi home page">
        <img src="/horizontal 60.svg"/>
      </Link>
    </Box>
  )
}

export default React.memo(Logo, (prev, next) => prev.isDark === next.isDark)
