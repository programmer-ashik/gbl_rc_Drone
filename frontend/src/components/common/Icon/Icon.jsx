// src/components/common/Icon/Icon.jsx
import React from "react";
import * as HeroIcons from "@heroicons/react/24/outline";
import * as HeroIconsSolid from "@heroicons/react/24/solid";
import * as HeroIconsMini from "@heroicons/react/20/solid";
import { cn } from "../../../utils/cn";

// Icon name mapping
const iconMap = {
  // Navigation
  home: HeroIcons.HomeIcon,
  menu: HeroIcons.Bars3Icon,
  close: HeroIcons.XMarkIcon,
  "chevron-left": HeroIcons.ChevronLeftIcon,
  "chevron-right": HeroIcons.ChevronRightIcon,
  "chevron-up": HeroIcons.ChevronUpIcon,
  "chevron-down": HeroIcons.ChevronDownIcon,
  "arrow-left": HeroIcons.ArrowLeftIcon,
  "arrow-right": HeroIcons.ArrowRightIcon,
  "arrow-up": HeroIcons.ArrowUpIcon,
  "arrow-down": HeroIcons.ArrowDownIcon,

  // Actions
  search: HeroIcons.MagnifyingGlassIcon,
  "shopping-cart": HeroIcons.ShoppingCartIcon,
  user: HeroIcons.UserIcon,
  heart: HeroIcons.HeartIcon,
  star: HeroIcons.StarIcon,
  tag: HeroIcons.TagIcon,
  truck: HeroIcons.TruckIcon,
  shield: HeroIcons.ShieldCheckIcon,
  phone: HeroIcons.PhoneIcon,
  email: HeroIcons.EnvelopeIcon,
  location: HeroIcons.MapPinIcon,
  check: HeroIcons.CheckIcon,
  minus: HeroIcons.MinusIcon,
  plus: HeroIcons.PlusIcon,
  trash: HeroIcons.TrashIcon,
  pencil: HeroIcons.PencilIcon,
  eye: HeroIcons.EyeIcon,
  "eye-slash": HeroIcons.EyeSlashIcon,
  filter: HeroIcons.FunnelIcon,
  refresh: HeroIcons.ArrowPathIcon,
  upload: HeroIcons.CloudArrowUpIcon,
  download: HeroIcons.CloudArrowDownIcon,
  share: HeroIcons.ShareIcon,
  print: HeroIcons.PrinterIcon,
  copy: HeroIcons.DocumentDuplicateIcon,

  // Social
  facebook: HeroIcons.FacebookIcon,
  twitter: HeroIcons.TwitterIcon,
  instagram: HeroIcons.InstagramIcon,
  youtube: HeroIcons.YouTubeIcon,
  linkedin: HeroIcons.LinkedInIcon,
  github: HeroIcons.GitHubIcon,

  // Status
  success: HeroIcons.CheckCircleIcon,
  error: HeroIcons.XCircleIcon,
  warning: HeroIcons.ExclamationTriangleIcon,
  info: HeroIcons.InformationCircleIcon,
  question: HeroIcons.QuestionMarkCircleIcon,

  // Device
  "computer-desktop": HeroIcons.ComputerDesktopIcon,
  "device-phone": HeroIcons.DevicePhoneMobileIcon,
  "device-tablet": HeroIcons.DeviceTabletIcon,
  sun: HeroIcons.SunIcon,
  moon: HeroIcons.MoonIcon,

  // Categories
  drone: HeroIcons.RocketLaunchIcon,
  rocket: HeroIcons.RocketLaunchIcon,
  battery: HeroIcons.BoltIcon,
  charge: HeroIcons.BoltIcon,
  motor: HeroIcons.CogIcon,
  chip: HeroIcons.CpuChipIcon,
  radio: HeroIcons.RadioIcon,
  tool: HeroIcons.WrenchIcon,
  car: HeroIcons.TruckIcon,
  grid: HeroIcons.Squares2X2Icon,

  // Other
  clock: HeroIcons.ClockIcon,
  calendar: HeroIcons.CalendarIcon,
  document: HeroIcons.DocumentIcon,
  folder: HeroIcons.FolderIcon,
  globe: HeroIcons.GlobeAltIcon,
  lock: HeroIcons.LockClosedIcon,
  unlock: HeroIcons.LockOpenIcon,
  key: HeroIcons.KeyIcon,
  cog: HeroIcons.Cog6ToothIcon,
  cogs: HeroIcons.Cog6ToothIcon,
  dashboard: HeroIcons.ChartBarSquareIcon,
  chart: HeroIcons.ChartBarIcon,
  users: HeroIcons.UserGroupIcon,
  "user-group": HeroIcons.UserGroupIcon,
  building: HeroIcons.BuildingOfficeIcon,
  briefcase: HeroIcons.BriefcaseIcon,
  gift: HeroIcons.GiftIcon,
  trophy: HeroIcons.TrophyIcon,
  medal: HeroIcons.BeakerIcon,
  fire: HeroIcons.FireIcon,
  lightning: HeroIcons.BoltIcon,
  music: HeroIcons.MusicalNoteIcon,
  video: HeroIcons.VideoCameraIcon,
  camera: HeroIcons.CameraIcon,
  image: HeroIcons.PhotoIcon,
  flag: HeroIcons.FlagIcon,
  logout: HeroIcons.ArrowRightOnRectangleIcon,
  login: HeroIcons.ArrowLeftOnRectangleIcon,
  // src/components/common/Icon/Icon.jsx - Add these to iconMap
  cube: (props) => (
    <svg
      {...props}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <path d='M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z' />
      <polyline points='3.27 6.96 12 12.01 20.73 6.96' />
      <line x1='12' y1='22.08' x2='12' y2='12' />
    </svg>
  ),
  printer: (props) => (
    <svg
      {...props}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <polyline points='6 9 6 2 18 2 18 9' />
      <path d='M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2' />
      <rect x='6' y='14' width='12' height='8' />
    </svg>
  ),
  game: (props) => (
    <svg
      {...props}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <rect x='2' y='6' width='20' height='12' rx='2' />
      <path d='M6 12h4' />
      <path d='M8 10v4' />
      <path d='M15 13a1 1 0 100-2 1 1 0 000 2z' />
      <path d='M18 11a1 1 0 100-2 1 1 0 000 2z' />
    </svg>
  ),
  animation: (props) => (
    <svg
      {...props}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <circle cx='12' cy='12' r='10' />
      <polyline points='12 6 12 12 16 14' />
      <path d='M12 18a6 6 0 100-12 6 6 0 000 12z' />
    </svg>
  ),
  academic: (props) => (
    <svg
      {...props}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <path d='M4 6L12 2L20 6' />
      <path d='M4 10v8' />
      <path d='M12 14v8' />
      <path d='M20 10v8' />
      <path d='M4 18L12 22L20 18' />
    </svg>
  ),
  product: (props) => (
    <svg
      {...props}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <rect x='2' y='7' width='20' height='14' rx='2' ry='2' />
      <path d='M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16' />
    </svg>
  ),
  film: (props) => (
    <svg
      {...props}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <rect x='2' y='2' width='20' height='20' rx='2.18' />
      <line x1='8' y1='2' x2='8' y2='22' />
      <line x1='16' y1='2' x2='16' y2='22' />
      <line x1='2' y1='8' x2='22' y2='8' />
      <line x1='2' y1='16' x2='22' y2='16' />
    </svg>
  ),
  vr: (props) => (
    <svg
      {...props}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <path d='M2 12a4 4 0 014-4h12a4 4 0 014 4v4a4 4 0 01-4 4H6a4 4 0 01-4-4v-4z' />
      <path d='M6 16v2' />
      <path d='M18 16v2' />
      <path d='M10 12h4' />
    </svg>
  ),
  toy: (props) => (
    <svg
      {...props}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <rect x='4' y='8' width='16' height='12' rx='2' />
      <path d='M8 8V4a2 2 0 012-2h4a2 2 0 012 2v4' />
      <circle cx='9' cy='14' r='1' />
      <circle cx='15' cy='14' r='1' />
    </svg>
  ),
  jewelry: (props) => (
    <svg
      {...props}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <path d='M12 22a7 7 0 100-14 7 7 0 000 14z' />
      <path d='M12 2v6' />
      <path d='M7 5l3 3' />
      <path d='M17 5l-3 3' />
      <line x1='12' y1='2' x2='12' y2='6' />
    </svg>
  ),
  "shopping-bag": (props) => (
    <svg
      {...props}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <path d='M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z' />
      <line x1='3' y1='6' x2='21' y2='6' />
      <path d='M16 10a4 4 0 01-8 0' />
    </svg>
  ),
  interior: (props) => (
    <svg
      {...props}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <rect x='4' y='4' width='16' height='16' rx='2' />
      <path d='M9 4v16' />
      <path d='M15 4v16' />
      <path d='M4 9h16' />
      <path d='M4 15h16' />
    </svg>
  ),
  video: (props) => (
    <svg
      {...props}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <polygon points='23 7 16 12 23 17 23 7' />
      <rect x='1' y='5' width='15' height='14' rx='2' ry='2' />
    </svg>
  ),
};

// Solid icon mapping
const solidIconMap = {
  "shopping-cart": HeroIconsSolid.ShoppingCartIcon,
  user: HeroIconsSolid.UserIcon,
  heart: HeroIconsSolid.HeartIcon,
  star: HeroIconsSolid.StarIcon,
  tag: HeroIconsSolid.TagIcon,
  check: HeroIconsSolid.CheckIcon,
  home: HeroIconsSolid.HomeIcon,
  menu: HeroIconsSolid.Bars3Icon,
  close: HeroIconsSolid.XMarkIcon,
  search: HeroIconsSolid.MagnifyingGlassIcon,
  trash: HeroIconsSolid.TrashIcon,
  plus: HeroIconsSolid.PlusIcon,
  minus: HeroIconsSolid.MinusIcon,
  "arrow-left": HeroIconsSolid.ArrowLeftIcon,
  "arrow-right": HeroIconsSolid.ArrowRightIcon,
  "chevron-left": HeroIconsSolid.ChevronLeftIcon,
  "chevron-right": HeroIconsSolid.ChevronRightIcon,
  success: HeroIconsSolid.CheckCircleIcon,
  error: HeroIconsSolid.XCircleIcon,
  warning: HeroIconsSolid.ExclamationTriangleIcon,
  info: HeroIconsSolid.InformationCircleIcon,
  fire: HeroIconsSolid.FireIcon,
};

// Mini icon mapping (20px)
const miniIconMap = {
  star: HeroIconsMini.StarIcon,
  check: HeroIconsMini.CheckIcon,
  heart: HeroIconsMini.HeartIcon,
  plus: HeroIconsMini.PlusIcon,
  minus: HeroIconsMini.MinusIcon,
  "x-mark": HeroIconsMini.XMarkIcon,
  "chevron-left": HeroIconsMini.ChevronLeftIcon,
  "chevron-right": HeroIconsMini.ChevronRightIcon,
  "chevron-down": HeroIconsMini.ChevronDownIcon,
  "chevron-up": HeroIconsMini.ChevronUpIcon,
};

export const Icon = ({
  name,
  variant = "outline",
  className = "hover:hover-bg cursor-pointer",
  size = 6,
  onClick,
  "aria-label": ariaLabel,
  ...props
}) => {
  // Determine which icon set to use
  let IconComponent;

  if (variant === "solid") {
    IconComponent = solidIconMap[name] || iconMap[name];
  } else if (variant === "mini") {
    IconComponent = miniIconMap[name] || iconMap[name];
  } else {
    IconComponent = iconMap[name];
  }

  // If icon not found, show fallback
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in icon map`);
    return (
      <span className={`inline-block w-${size} h-${size} ${className}`}>
        <svg
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
          className='w-full h-full'
        >
          <circle cx='12' cy='12' r='10' />
          <line x1='12' y1='8' x2='12' y2='12' />
          <line x1='12' y1='16' x2='12.01' y2='16' />
        </svg>
      </span>
    );
  }

  const sizeClass = `w-${size} h-${size}`;

  return (
    <IconComponent
      className={cn(sizeClass, className)}
      onClick={onClick}
      aria-label={ariaLabel || name}
      role='img'
      {...props}
    />
  );
};

// Export icon names for type checking
export const ICON_NAMES = Object.keys(iconMap);

// Export variant types
export const ICON_VARIANTS = {
  OUTLINE: "outline",
  SOLID: "solid",
  MINI: "mini",
};

export default Icon;
