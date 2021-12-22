import React from "react";
import Svg from "./../../Svg";
import { SvgProps } from "./../../types";

const Icon: React.FC<SvgProps> = ({...props}) => {
    return (
        <Svg viewBox="0 0 29 29" {...props}>
            <rect width="29" height="29" rx="7" fill="url(#paint0_linear_3586_13847)"/>
            <path d="M22.0019 9.54424C21.4135 9.79809 20.7731 9.98078 20.1135 10.0519C20.7983 9.64508 21.3111 9.00231 21.5558 8.24424C20.9131 8.62653 20.2091 8.89459 19.475 9.03655C19.1682 8.70852 18.7971 8.4472 18.3848 8.26887C17.9726 8.09054 17.528 7.99902 17.0788 8.00001C15.2615 8.00001 13.8 9.47309 13.8 11.2808C13.8 11.5346 13.8308 11.7885 13.8808 12.0327C11.1596 11.8904 8.73269 10.5904 7.11923 8.60001C6.82524 9.10215 6.67118 9.6739 6.67308 10.2558C6.67308 11.3942 7.25192 12.3981 8.13462 12.9885C7.61443 12.968 7.10643 12.825 6.65192 12.5712V12.6115C6.65192 14.2058 7.77885 15.5269 9.28077 15.8308C8.99877 15.904 8.70867 15.9415 8.41731 15.9423C8.20385 15.9423 8.00192 15.9212 7.79808 15.8923C8.21346 17.1923 9.42308 18.1365 10.8635 18.1673C9.73654 19.05 8.325 19.5692 6.79231 19.5692C6.51731 19.5692 6.26346 19.5596 6 19.5289C7.45385 20.4615 9.17885 21 11.0365 21C17.0673 21 20.3673 16.0039 20.3673 11.6673C20.3673 11.525 20.3673 11.3827 20.3577 11.2404C20.9962 10.7731 21.5558 10.1942 22.0019 9.54424Z" fill="white"/>
            <defs>
                <linearGradient id="paint0_linear_3586_13847" x1="29" y1="29" x2="0.499999" y2="1" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#434BFF"/>
                    <stop offset="1" stop-color="#FF4B81"/>
                </linearGradient>
            </defs>            
        </Svg>
    );
};

export default Icon;