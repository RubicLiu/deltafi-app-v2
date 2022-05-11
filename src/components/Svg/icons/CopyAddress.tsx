import React from "react";

import { SvgProps } from "../types";

interface BlogProps extends SvgProps {}

const Icon: React.FC<BlogProps> = ({ ...props }) => {
  return (
    <svg {...props} viewBox="0 0 30 34" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_3350_9975)">
        <path
          d="M29.0585 4.37889L25.5843 0.933605C24.9815 0.335832 24.164 4.42051e-06 23.3115 0L11.7857 0C10.0105 0 8.57143 1.42707 8.57143 3.1875V6.375H3.21429C1.43906 6.375 0 7.80207 0 9.5625V30.8125C0 32.5729 1.43906 34 3.21429 34H18.2143C19.9895 34 21.4286 32.5729 21.4286 30.8125V27.625H26.7857C28.5609 27.625 30 26.1979 30 24.4375V6.63279C30 5.78741 29.6613 4.97666 29.0585 4.37889ZM23.5714 2.15761C23.7598 2.2037 23.9319 2.30004 24.069 2.43618L27.5433 5.88154C27.6806 6.01754 27.7777 6.18818 27.8242 6.375H23.5714V2.15761ZM19.2857 30.8125C19.2857 31.3983 18.805 31.875 18.2143 31.875H3.21429C2.62353 31.875 2.14286 31.3983 2.14286 30.8125V9.5625C2.14286 8.97666 2.62353 8.5 3.21429 8.5H8.57143V24.4375C8.57143 26.1979 10.0105 27.625 11.7857 27.625H19.2857V30.8125ZM27.8571 24.4375C27.8571 25.0233 27.3765 25.5 26.7857 25.5H11.7857C11.195 25.5 10.7143 25.0233 10.7143 24.4375V3.1875C10.7143 2.60166 11.195 2.125 11.7857 2.125H21.4286V6.90625C21.4286 7.78281 22.1518 8.5 23.0357 8.5H27.8571V24.4375Z"
          fill="white"
        />
      </g>
      <defs>
        <clipPath id="clip0_3350_9975">
          <rect width="30" height="34" fill="#D4FF00" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default Icon;
