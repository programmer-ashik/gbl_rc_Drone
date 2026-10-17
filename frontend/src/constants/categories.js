export const CATEGORIES = {
  DRONES: {
    id: "drones",
    label: "Drones",
    icon: "drone",
    path: "/category/drones",
    subcategories: [
      {
        id: "racing-drones",
        label: "Racing Drones",
        path: "/category/drones/racing",
      },
      {
        id: "camera-drones",
        label: "Camera Drones",
        path: "/category/drones/camera",
      },
      { id: "toy-drones", label: "Toy Drones", path: "/category/drones/toy" },
      {
        id: "professional-drones",
        label: "Professional Drones",
        path: "/category/drones/professional",
      },
    ],
  },
  FPV_RACING: {
    id: "fpv-racing",
    label: "FPV Racing",
    icon: "rocket",
    path: "/category/fpv-racing",
    subcategories: [
      {
        id: "fpv-frames",
        label: "FPV Frames",
        path: "/category/fpv-racing/frames",
      },
      {
        id: "fpv-motors",
        label: "FPV Motors",
        path: "/category/fpv-racing/motors",
      },
      { id: "fpv-escs", label: "FPV ESCs", path: "/category/fpv-racing/escs" },
      {
        id: "fpv-flight-controllers",
        label: "Flight Controllers",
        path: "/category/fpv-racing/flight-controllers",
      },
      {
        id: "fpv-cameras",
        label: "FPV Cameras",
        path: "/category/fpv-racing/cameras",
      },
      {
        id: "fpv-goggles",
        label: "FPV Goggles",
        path: "/category/fpv-racing/goggles",
      },
      {
        id: "fpv-vtx",
        label: "Video Transmitters",
        path: "/category/fpv-racing/vtx",
      },
      {
        id: "fpv-antenna",
        label: "Antennas",
        path: "/category/fpv-racing/antenna",
      },
    ],
  },
  RC_CARS: {
    id: "rc-cars",
    label: "RC Cars",
    icon: "car",
    path: "/category/rc-cars",
    subcategories: [
      { id: "off-road", label: "Off-Road", path: "/category/rc-cars/off-road" },
      { id: "on-road", label: "On-Road", path: "/category/rc-cars/on-road" },
      {
        id: "drift-cars",
        label: "Drift Cars",
        path: "/category/rc-cars/drift",
      },
      { id: "crawlers", label: "Crawlers", path: "/category/rc-cars/crawlers" },
      { id: "rc-parts", label: "RC Parts", path: "/category/rc-cars/parts" },
    ],
  },
  BATTERIES: {
    id: "batteries",
    label: "Batteries",
    icon: "battery",
    path: "/category/batteries",
    subcategories: [
      {
        id: "lipo-batteries",
        label: "LiPo Batteries",
        path: "/category/batteries/lipo",
      },
      {
        id: "li-ion-batteries",
        label: "Li-Ion Batteries",
        path: "/category/batteries/li-ion",
      },
      {
        id: "battery-chargers",
        label: "Battery Chargers",
        path: "/category/batteries/chargers",
      },
      {
        id: "battery-accessories",
        label: "Accessories",
        path: "/category/batteries/accessories",
      },
    ],
  },
  MOTORS: {
    id: "motors",
    label: "Motors",
    icon: "motor",
    path: "/category/motors",
    subcategories: [
      {
        id: "brushless-motors",
        label: "Brushless Motors",
        path: "/category/motors/brushless",
      },
      {
        id: "brushed-motors",
        label: "Brushed Motors",
        path: "/category/motors/brushed",
      },
      {
        id: "motor-esc",
        label: "Motor & ESC Combos",
        path: "/category/motors/esc",
      },
    ],
  },
  TRANSMITTERS: {
    id: "transmitters",
    label: "Transmitters",
    icon: "radio",
    path: "/category/transmitters",
    subcategories: [
      {
        id: "transmitter-receiver",
        label: "Transmitter & Receiver",
        path: "/category/transmitters/receiver",
      },
      {
        id: "transmitter-modules",
        label: "Transmitter Modules",
        path: "/category/transmitters/modules",
      },
      {
        id: "transmitter-accessories",
        label: "Accessories",
        path: "/category/transmitters/accessories",
      },
    ],
  },
  ACCESSORIES: {
    id: "accessories",
    label: "Accessories",
    icon: "tool",
    path: "/category/accessories",
    subcategories: [
      {
        id: "propellers",
        label: "Propellers",
        path: "/category/accessories/propellers",
      },
      {
        id: "connectors",
        label: "Connectors & Cables",
        path: "/category/accessories/connectors",
      },
      {
        id: "tools",
        label: "Tools & Kits",
        path: "/category/accessories/tools",
      },
      {
        id: "parts",
        label: "Replacement Parts",
        path: "/category/accessories/parts",
      },
    ],
  },
};

// Flatten categories for quick access
export const FLAT_CATEGORIES = Object.values(CATEGORIES).reduce(
  (acc, category) => {
    acc[category.id] = category;
    category.subcategories.forEach((sub) => {
      acc[sub.id] = {
        ...sub,
        parentId: category.id,
        parentLabel: category.label,
      };
    });
    return acc;
  },
  {},
);

// For navigation menu
export const NAV_CATEGORIES = Object.values(CATEGORIES);
