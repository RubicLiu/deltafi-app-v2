import React from "react";
import Svg from "../Svg";
import { SvgProps } from "../types";

interface SolflareProps extends SvgProps {
    isAccept?: boolean;
}
  
const Icon: React.FC<SolflareProps> = ({ isAccept, ...props }) => {
    return (
        <Svg width="60" height="60" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path d="M24.8919 24.9666L29.9929 31.0468L23.6926 26.2361C22.228 25.1225 20.1169 26.069 19.9621 27.912L18.9563 40L17.3425 28.1849C17.0883 26.3085 14.85 25.4955 13.4628 26.7706L0 39.1648L11.8104 25.3842C13.0539 23.9365 12.142 21.6759 10.2463 21.5145L0.0773726 20.5234L10.5116 18.8753C12.3299 18.6247 13.1589 16.4477 11.9762 15.0334L6.8751 8.95323L13.1699 13.7639C14.6345 14.8775 16.7456 13.931 16.9004 12.088L17.9117 0L19.52 11.8151C19.7797 13.6915 22.018 14.5045 23.3997 13.2294L36.868 0.835189L25.0521 14.6158C23.8086 16.0635 24.7261 18.3241 26.6217 18.4855L36.7907 19.4766L26.3509 21.1247C24.5326 21.3753 23.7092 23.5523 24.8919 24.9666Z"
                fill={isAccept? "rgb(252, 109, 33)": "rgb(200, 200, 200, 0.8)"}>
            </path>
            <defs>
                <linearGradient id="solflare_paint0_linear" x1="11.8347" y1="14.2185" x2="21.4291" y2="22.4997" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FFC10B"></stop><stop offset="1" stopColor="#FB3F2E"></stop>
                </linearGradient>
            </defs>
        </Svg>
    );
};

export default Icon;
