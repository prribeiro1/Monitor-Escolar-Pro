import React from 'react';

export type IconName = 'bus' | 'map-pin' | 'users' | 'clipboard' | 'alert-triangle' | 'bar-chart' | 'plus' | 'trash' | 'edit' | 'check' | 'x' | 'log-out' | 'menu' | 'google' | 'save' | 'cloud-upload' | 'road' | 'pencil' | 'face' | 'phone';

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

const icons: Record<IconName, React.ReactNode> = {
  bus: <path d="M19 17h2l.64-2.54a6 6 0 0 0-1.8-6.22l-1.6-1.33A12.04 12.04 0 0 0 12 5c-2.5 0-4.8 1.14-6.24 2.9L4.16 9.24a6 6 0 0 0-1.8 6.22L3 17h2m14 0v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-2m-8 0v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2m16-12h-2M7 5H5m7 6v-2" />,
  'map-pin': <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />,
  users: <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75" />,
  clipboard: <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2 M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z M12 11h4 M12 16h4" />,
  'alert-triangle': <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 4h.01" />,
  'bar-chart': <path d="M12 20V10 M18 20V4 M6 20v-6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  trash: <path d="M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />,
  edit: <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />,
  check: <path d="M20 6L9 17l-5-5" />,
  x: <path d="M18 6L6 18M6 6l12 12" />,
  'log-out': <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9" />,
  menu: <path d="M3 12h18M3 6h18M3 18h18" />,
  google: <path d="M12 22C17.5228 22 22 17.5228 22 12C22 11.333 21.934 10.666 21.81 10H12V14H17.83C17.5 16.11 15.73 17.72 12.55 17.72C9.37 17.72 6.6 15.52 5.63 12.5C5.63 12.5 5.63 12.5 5.63 12.5C4.66 9.48 6.96 6.28 10.13 6.28C11.7 6.28 13.1 6.84 14.2 7.8L17.08 4.92C15.3 3.24 12.87 2.28 10.13 2.28C4.6 2.28 0.13 6.75 0.13 12.28C0.13 12.28 0.13 12.28 0.13 12.28C0.13 17.81 4.6 22.28 10.13 22.28H12Z" />,
  save: <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z M17 21v-8H7v8 M7 3v5h8" />,
  'cloud-upload': <path d="M16 16l-4-4-4 4 M12 12v9 M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />,
  road: <><path d="M4 15c0-3.3 2.7-6 6-6s6-2.7 6-6" transform="rotate(90, 12, 12)" /><path d="M15 15l3 3l-3 3" /></>,
  pencil: <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />,
  face: <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />,
  phone: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
};

export const Icon: React.FC<IconProps> = ({ name, size = 24, className = "", strokeWidth = 2 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {icons[name]}
  </svg>
);