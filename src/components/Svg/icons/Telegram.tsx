import React from "react";
import Svg from "../Svg";
import { SvgProps } from "../types";

interface TelegramProps extends SvgProps {
  isDark: boolean;
}

const Icon: React.FC<TelegramProps> = ({ isDark, ...props }) => {
  // const innerColor = isDark ? '#000000' : '#FFFFFF'
  return (
    <Svg width="19" height="17" viewBox="0 0 19 17" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M18.9457 2.28459L16.0785 15.8063C15.8622 16.7606 15.2981 16.9982 14.4965 16.5486L10.1278 13.3293L8.01977 15.3567C7.78649 15.59 7.59138 15.7851 7.14179 15.7851L7.45565 11.3358L15.5526 4.01934C15.9046 3.70547 15.4762 3.53157 15.0054 3.84544L4.99561 10.1482L0.6863 8.79945C-0.25106 8.50679 -0.268026 7.86209 0.881407 7.4125L17.7369 0.918839C18.5174 0.626179 19.2002 1.09274 18.9457 2.28459Z"
        fill="url(#paint0_linear_414_16399)"
      />
      <defs>
        <linearGradient
          id="paint0_linear_414_16399"
          x1="3.78998"
          y1="1.39463"
          x2="21.2486"
          y2="9.51646"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#D4FF00" />
          <stop offset="1" stopColor="#BDFF00" />
        </linearGradient>
      </defs>
    </Svg>
  );
};

export default Icon;
