import React from "react";
import Svg from "./../../Svg";
import { SvgProps } from "./../../types";

const Icon: React.FC<SvgProps> = ({ ...props }) => {
  return (
    <Svg width="41" height="42" viewBox="0 0 41 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0.349365 20.9127C0.349365 9.9152 9.26457 1 20.262 1C31.2595 1 40.1747 9.9152 40.1747 20.9127C40.1747 31.9101 31.2595 40.8253 20.262 40.8253C9.26457 40.8253 0.349365 31.9101 0.349365 20.9127Z"
        stroke="url(#paint0_linear_414_14932)"
        strokeWidth="0.5"
      />
      <path
        d="M28.5896 14.0496L25.5846 28.2208C25.3579 29.221 24.7667 29.4699 23.9266 28.9987L19.348 25.6248L17.1388 27.7496C16.8943 27.9941 16.6898 28.1986 16.2186 28.1986L16.5476 23.5356L25.0334 15.8677C25.4024 15.5387 24.9534 15.3565 24.46 15.6854L13.9693 22.291L9.45304 20.8774C8.47065 20.5707 8.45287 19.895 9.65752 19.4238L27.3227 12.6182C28.1406 12.3115 28.8563 12.8005 28.5896 14.0496Z"
        fill="url(#paint1_linear_414_14932)"
      />
      <defs>
        <linearGradient
          id="paint0_linear_414_14932"
          x1="8.29369"
          y1="2.40126"
          x2="46.9274"
          y2="17.4738"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#D4FF00" />
          <stop offset="1" stopColor="#BDFF00" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_414_14932"
          x1="12.7058"
          y1="13.1169"
          x2="31.0031"
          y2="21.6288"
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
