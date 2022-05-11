import React from "react";
import Svg from "./../../Svg";
import { SvgProps } from "./../../types";

const Icon: React.FC<SvgProps> = ({ ...props }) => {
  return (
    <Svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1 20.9127C1 9.9152 9.9152 1 20.9127 1C31.9101 1 40.8253 9.9152 40.8253 20.9127C40.8253 31.9101 31.9101 40.8253 20.9127 40.8253C9.9152 40.8253 1 31.9101 1 20.9127Z"
        stroke="url(#paint0_linear_414_14935)"
        strokeWidth="0.5"
      />
      <g clipPath="url(#clip0_414_14935)">
        <path
          d="M15.5508 13.5762C11.4698 13.5762 8.16138 16.9074 8.16138 21.0163C8.16138 25.1252 11.47 28.4565 15.5508 28.4565C19.6317 28.4565 22.9403 25.1255 22.9403 21.0163C22.9403 16.9072 19.6321 13.5762 15.5508 13.5762ZM27.3515 14.012C25.3109 14.012 23.6569 17.1487 23.6569 21.0164C23.6569 24.8842 25.3111 28.0211 27.3517 28.0211C29.3923 28.0211 31.0465 24.8844 31.0465 21.0164H31.0462C31.0462 17.1476 29.3923 14.012 27.3516 14.012H27.3515ZM33.0627 14.7416C32.3452 14.7416 31.7635 17.5511 31.7635 21.0164C31.7635 24.4818 32.3448 27.2913 33.0627 27.2913C33.7805 27.2913 34.3622 24.481 34.3622 21.0163C34.3622 17.5509 33.7803 14.7416 33.0628 14.7416H33.0627Z"
          fill="url(#paint1_linear_414_14935)"
        />
      </g>
      <defs>
        <linearGradient
          id="paint0_linear_414_14935"
          x1="8.94432"
          y1="2.40126"
          x2="47.578"
          y2="17.4738"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#D4FF00" />
          <stop offset="1" stopColor="#BDFF00" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_414_14935"
          x1="13.3879"
          y1="14.0997"
          x2="33.2844"
          y2="27.7676"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#D4FF00" />
          <stop offset="1" stopColor="#BDFF00" />
        </linearGradient>
        <clipPath id="clip0_414_14935">
          <rect
            width="26.2009"
            height="20.9607"
            fill="white"
            transform="translate(8.33618 10.4316)"
          />
        </clipPath>
      </defs>
    </Svg>
  );
};

export default Icon;
