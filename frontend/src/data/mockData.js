// Development fallback only. The categories API remains the source of truth.
// Slugs intentionally match backend seed data so category routes and filters
// behave the same before and after the API is populated.
export const MOCK_CATEGORIES = [
  {
    slug: "drones",
    label: "Drones",
    icon: "drone",
    order: 1,
    subcategories: [
      { slug: "racing-drones", label: "Racing Drones", order: 1 },
      { slug: "camera-drones", label: "Camera Drones", order: 2 },
      { slug: "toy-drones", label: "Toy Drones", order: 3 },
      { slug: "professional-drones", label: "Professional Drones", order: 4 },
    ],
  },
  {
    slug: "fpv-racing",
    label: "FPV Racing",
    icon: "rocket",
    order: 2,
    subcategories: [
      { slug: "fpv-frames", label: "FPV Frames", order: 1 },
      { slug: "fpv-motors", label: "FPV Motors", order: 2 },
      { slug: "fpv-escs", label: "FPV ESCs", order: 3 },
      { slug: "fpv-flight-controllers", label: "Flight Controllers", order: 4 },
      { slug: "fpv-cameras", label: "FPV Cameras", order: 5 },
      { slug: "fpv-goggles", label: "FPV Goggles", order: 6 },
      { slug: "fpv-vtx", label: "Video Transmitters", order: 7 },
      { slug: "fpv-antenna", label: "Antennas", order: 8 },
    ],
  },
  {
    slug: "rc-cars",
    label: "RC Cars",
    icon: "car",
    order: 3,
    subcategories: [
      { slug: "off-road", label: "Off-Road", order: 1 },
      { slug: "on-road", label: "On-Road", order: 2 },
      { slug: "drift-cars", label: "Drift Cars", order: 3 },
      { slug: "crawlers", label: "Crawlers", order: 4 },
      { slug: "rc-parts", label: "RC Parts", order: 5 },
    ],
  },
  {
    slug: "batteries",
    label: "Batteries",
    icon: "battery",
    order: 4,
    subcategories: [
      { slug: "lipo-batteries", label: "LiPo Batteries", order: 1 },
      { slug: "li-ion-batteries", label: "Li-Ion Batteries", order: 2 },
      { slug: "battery-chargers", label: "Battery Chargers", order: 3 },
      { slug: "battery-accessories", label: "Battery Accessories", order: 4 },
    ],
  },
  {
    slug: "motors",
    label: "Motors",
    icon: "motor",
    order: 5,
    subcategories: [
      { slug: "brushless-motors", label: "Brushless Motors", order: 1 },
      { slug: "brushed-motors", label: "Brushed Motors", order: 2 },
      { slug: "motor-esc", label: "Motor & ESC Combos", order: 3 },
    ],
  },
  {
    slug: "transmitters",
    label: "Transmitters",
    icon: "radio",
    order: 6,
    subcategories: [
      { slug: "transmitter-receiver", label: "Transmitters & Receivers", order: 1 },
      { slug: "transmitter-modules", label: "Transmitter Modules", order: 2 },
      { slug: "transmitter-accessories", label: "Transmitter Accessories", order: 3 },
    ],
  },
  {
    slug: "accessories",
    label: "Accessories",
    icon: "tool",
    order: 7,
    subcategories: [
      { slug: "propellers", label: "Propellers", order: 1 },
      { slug: "connectors", label: "Connectors & Cables", order: 2 },
      { slug: "tools", label: "Tools & Kits", order: 3 },
      { slug: "parts", label: "Replacement Parts", order: 4 },
    ],
  },
];

const makeProductImage = (label, accent = "#f59e0b", detail = "Product Preview") => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#0f172a"/><stop offset="1" stop-color="#1e293b"/></linearGradient></defs><rect width="1200" height="900" fill="url(#g)"/><circle cx="960" cy="160" r="230" fill="${accent}" opacity=".14"/><circle cx="180" cy="760" r="300" fill="${accent}" opacity=".08"/><rect x="125" y="150" width="950" height="600" rx="48" fill="none" stroke="${accent}" stroke-width="3" opacity=".55"/><text x="600" y="405" text-anchor="middle" fill="#f8fafc" font-family="Arial,sans-serif" font-size="58" font-weight="700">${label}</text><text x="600" y="480" text-anchor="middle" fill="${accent}" font-family="Arial,sans-serif" font-size="27" letter-spacing="5">${detail}</text><text x="600" y="660" text-anchor="middle" fill="#94a3b8" font-family="Arial,sans-serif" font-size="22">GLOBAL ENTERPRISE</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const buildMockProduct = (index, product) => {
  const _id = index.toString(16).padStart(24, "0");
  const primaryImage = makeProductImage(product.imageLabel, product.accent);
  const gallery = [
    primaryImage,
    makeProductImage(product.imageLabel, product.accent, "Detail View"),
    makeProductImage(product.imageLabel, product.accent, "Technical View"),
  ];
  const stock = product.stock ?? 10;
  const lowStockThreshold = product.lowStockThreshold ?? 5;
  const stockStatus = stock <= 0 ? "out_of_stock" : stock <= lowStockThreshold ? "low_stock" : "in_stock";

  return {
    _id,
    id: _id,
    title: product.title,
    slug: product.slug,
    subtitle: product.subtitle,
    description: product.description,
    descriptionText: product.descriptionText || product.description,
    category: product.category,
    subcategory: product.subcategory,
    image: primaryImage,
    images: gallery,
    photos: gallery.map((url, photoIndex) => ({
      url,
      alt: `${product.title} ${photoIndex === 0 ? "primary image" : `view ${photoIndex + 1}`}`,
      isPrimary: photoIndex === 0,
    })),
    price: product.price,
    discountPrice: product.discountPrice ?? null,
    rating: product.rating ?? 4.7,
    reviewsCount: product.reviewsCount ?? 0,
    stock,
    lowStockThreshold,
    stockStatus,
    isBestSeller: product.isBestSeller ?? false,
    isNewArrival: product.isNewArrival ?? false,
    onSale: product.onSale ?? product.discountPrice != null,
    isCombo: false,
    comboItems: [],
    specifications: product.specifications,
    blockDiagram: makeProductImage(product.imageLabel, product.accent, "System Diagram"),
    status: "active",
    createdAt: product.createdAt,
    updatedAt: product.createdAt,
    _isMock: true,
  };
};

export const MOCK_PRODUCTS = [
  buildMockProduct(1, {
    title: "AeroVision Pro 4K Camera Drone",
    slug: "aerovision-pro-4k-camera-drone",
    imageLabel: "AeroVision Pro 4K",
    accent: "#38bdf8",
    subtitle: "3-axis stabilized aerial imaging platform",
    description: "Foldable professional camera drone with stabilized 4K video, GPS positioning, and intelligent return-to-home.",
    category: "drones",
    subcategory: "professional-drones",
    price: 78900,
    discountPrice: 72900,
    rating: 4.9,
    reviewsCount: 128,
    stock: 7,
    isBestSeller: true,
    isNewArrival: true,
    createdAt: "2026-08-10T10:00:00.000Z",
    specifications: ["Camera: 4K UHD", "Flight Time: 34 minutes", "Range: 8 km", "Stabilization: 3-axis gimbal", "Navigation: GPS + optical flow", "Weight: 895 g"],
  }),
  buildMockProduct(2, {
    title: "Falcon R5 FPV Racing Drone Kit",
    slug: "falcon-r5-fpv-racing-drone-kit",
    imageLabel: "Falcon R5 FPV",
    accent: "#f97316",
    subtitle: "Competition-ready 5-inch FPV platform",
    description: "High-speed FPV racing kit with carbon frame, digital video support, and a tuned flight controller.",
    category: "fpv-racing",
    subcategory: "fpv-frames",
    price: 18500,
    discountPrice: 16900,
    rating: 4.8,
    reviewsCount: 94,
    stock: 4,
    isBestSeller: true,
    isNewArrival: true,
    createdAt: "2026-08-09T10:00:00.000Z",
    specifications: ["Frame: 5-inch carbon fiber", "Video: Digital-ready", "Controller: F7 flight controller", "ESC: 55A 4-in-1", "Motor Support: 4S–6S", "Receiver: ELRS-ready"],
  }),
  buildMockProduct(3, {
    title: "SkyScout Mini GPS Drone",
    slug: "skyscout-mini-gps-drone",
    imageLabel: "SkyScout Mini",
    accent: "#22c55e",
    subtitle: "Portable GPS drone for new pilots",
    description: "Compact camera drone with GPS hold, one-key return, beginner flight modes, and a lightweight folding body.",
    category: "drones",
    subcategory: "camera-drones",
    price: 12500,
    rating: 4.6,
    reviewsCount: 42,
    stock: 14,
    isNewArrival: true,
    createdAt: "2026-08-08T10:00:00.000Z",
    specifications: ["Camera: 2.7K", "Flight Time: 25 minutes", "Navigation: GPS", "Control Range: 1.2 km", "Modes: Follow and orbit", "Weight: 249 g"],
  }),
  buildMockProduct(4, {
    title: "X5 Carbon Fiber FPV Frame",
    slug: "x5-carbon-fiber-fpv-frame",
    imageLabel: "X5 Carbon Frame",
    accent: "#a78bfa",
    subtitle: "Lightweight 5-inch freestyle chassis",
    description: "Precision-cut carbon fiber frame with replaceable arms and generous electronics mounting space.",
    category: "fpv-racing",
    subcategory: "fpv-frames",
    price: 2400,
    discountPrice: 2150,
    rating: 4.7,
    reviewsCount: 61,
    stock: 20,
    isNewArrival: true,
    createdAt: "2026-08-07T10:00:00.000Z",
    specifications: ["Wheelbase: 225 mm", "Arm Thickness: 5 mm", "Material: 3K carbon fiber", "Stack Mount: 30.5 / 20 mm", "Camera Width: 19–20 mm", "Weight: 118 g"],
  }),
  buildMockProduct(5, {
    title: "Vector 2306 2450KV Motor Set",
    slug: "vector-2306-2450kv-motor-set",
    imageLabel: "Vector 2306 Motors",
    accent: "#ef4444",
    subtitle: "Four-motor set for responsive FPV builds",
    description: "Balanced high-RPM brushless motors engineered for freestyle control and rapid throttle response.",
    category: "motors",
    subcategory: "brushless-motors",
    price: 6800,
    discountPrice: 6200,
    rating: 4.9,
    reviewsCount: 87,
    stock: 3,
    isBestSeller: true,
    isNewArrival: true,
    createdAt: "2026-08-06T10:00:00.000Z",
    specifications: ["KV Rating: 2450KV", "Configuration: 12N14P", "Input: 4S LiPo", "Shaft: 5 mm", "Mounting: 16 × 16 mm", "Set: 4 motors"],
  }),
  buildMockProduct(6, {
    title: "PulseMax 4S 1500mAh LiPo Battery",
    slug: "pulsemax-4s-1500mah-lipo-battery",
    imageLabel: "PulseMax 4S LiPo",
    accent: "#eab308",
    subtitle: "High-discharge FPV battery pack",
    description: "Reliable 4S LiPo pack designed for racing drones with consistent voltage under aggressive load.",
    category: "batteries",
    subcategory: "lipo-batteries",
    price: 2600,
    discountPrice: 2350,
    rating: 4.8,
    reviewsCount: 113,
    stock: 11,
    isNewArrival: true,
    createdAt: "2026-08-05T10:00:00.000Z",
    specifications: ["Voltage: 14.8V / 4S", "Capacity: 1500mAh", "Discharge: 120C", "Connector: XT60", "Balance Lead: JST-XH", "Weight: 186 g"],
  }),
  buildMockProduct(7, {
    title: "ChargeCore Duo Smart Balance Charger",
    slug: "chargecore-duo-smart-balance-charger",
    imageLabel: "ChargeCore Duo",
    accent: "#06b6d4",
    subtitle: "Dual-channel battery charging station",
    description: "Smart balance charger with independent channels, storage mode, and battery health monitoring.",
    category: "batteries",
    subcategory: "battery-chargers",
    price: 5900,
    rating: 4.7,
    reviewsCount: 36,
    stock: 6,
    isNewArrival: true,
    createdAt: "2026-08-04T10:00:00.000Z",
    specifications: ["Channels: 2 independent", "Battery: LiPo / LiHV / Li-ion", "Balance: 2S–6S", "Power: 100W × 2", "Input: AC / DC", "Safety: Temperature and timeout"],
  }),
  buildMockProduct(8, {
    title: "Command X8 ELRS Radio Transmitter",
    slug: "command-x8-elrs-radio-transmitter",
    imageLabel: "Command X8 Radio",
    accent: "#3b82f6",
    subtitle: "Long-range 8-channel control system",
    description: "Ergonomic radio transmitter with built-in ELRS, hall gimbals, and a high-brightness color display.",
    category: "transmitters",
    subcategory: "transmitter-receiver",
    price: 13500,
    discountPrice: 12400,
    rating: 4.9,
    reviewsCount: 75,
    stock: 8,
    isBestSeller: true,
    isNewArrival: true,
    createdAt: "2026-08-03T10:00:00.000Z",
    specifications: ["Channels: 8", "Protocol: ExpressLRS", "Gimbals: Hall sensor", "Display: 4.3-inch color", "Battery: 5000mAh", "Firmware: EdgeTX compatible"],
  }),
  buildMockProduct(9, {
    title: "DriftStorm 1/10 Brushless RC Car",
    slug: "driftstorm-1-10-brushless-rc-car",
    imageLabel: "DriftStorm RC",
    accent: "#ec4899",
    subtitle: "Ready-to-run four-wheel-drive drift car",
    description: "Adjustable brushless RC drift chassis with gyro assistance, LED lighting, and proportional steering.",
    category: "rc-cars",
    subcategory: "drift-cars",
    price: 22500,
    discountPrice: 20900,
    rating: 4.8,
    reviewsCount: 58,
    stock: 5,
    isBestSeller: true,
    isNewArrival: true,
    createdAt: "2026-08-02T10:00:00.000Z",
    specifications: ["Scale: 1/10", "Drive: 4WD", "Motor: Brushless", "Radio: 2.4GHz", "Stability: Adjustable gyro", "Top Speed: 55 km/h"],
  }),
  buildMockProduct(10, {
    title: "AeroBlade 5x4.3 Propeller Kit",
    slug: "aeroblade-5x4-3-propeller-kit",
    imageLabel: "AeroBlade Props",
    accent: "#14b8a6",
    subtitle: "Durable tri-blade FPV propeller set",
    description: "Balanced polycarbonate propellers for smooth freestyle response and efficient racing performance.",
    category: "accessories",
    subcategory: "propellers",
    price: 650,
    discountPrice: 520,
    rating: 4.6,
    reviewsCount: 144,
    stock: 30,
    isNewArrival: true,
    createdAt: "2026-08-01T10:00:00.000Z",
    specifications: ["Diameter: 5 inch", "Pitch: 4.3 inch", "Blades: 3", "Material: Polycarbonate", "Hub: 5 mm", "Package: 8 propellers"],
  }),
  buildMockProduct(11, {
    title: "Titan F7 60A Flight Stack",
    slug: "titan-f7-60a-flight-stack",
    imageLabel: "Titan F7 Stack",
    accent: "#8b5cf6",
    subtitle: "F7 controller and 60A four-in-one ESC",
    description: "High-current flight stack with blackbox logging, dual gyro support, and configurable motor outputs.",
    category: "fpv-racing",
    subcategory: "fpv-flight-controllers",
    price: 8900,
    discountPrice: 7990,
    rating: 4.9,
    reviewsCount: 102,
    stock: 9,
    isBestSeller: true,
    createdAt: "2026-06-18T10:00:00.000Z",
    specifications: ["Processor: STM32F7", "ESC: 60A 4-in-1", "Input: 3S–6S", "Gyro: Dual", "Blackbox: 32MB", "Mount: 30.5 × 30.5 mm"],
  }),
  buildMockProduct(12, {
    title: "VisionLink HD FPV Goggles",
    slug: "visionlink-hd-fpv-goggles",
    imageLabel: "VisionLink HD",
    accent: "#0ea5e9",
    subtitle: "Low-latency digital FPV headset",
    description: "High-resolution FPV goggles with adjustable optics, DVR recording, and HDMI input.",
    category: "fpv-racing",
    subcategory: "fpv-goggles",
    price: 32900,
    rating: 4.9,
    reviewsCount: 69,
    stock: 2,
    isBestSeller: true,
    createdAt: "2026-05-12T10:00:00.000Z",
    specifications: ["Resolution: 1080p", "Latency: Under 28ms", "Field of View: 46°", "Recording: Built-in DVR", "Input: HDMI", "Focus: Adjustable"],
  }),
  buildMockProduct(13, {
    title: "TF-Luna Compact LiDAR Sensor",
    slug: "tf-luna-compact-lidar-sensor",
    imageLabel: "TF-Luna LiDAR",
    accent: "#10b981",
    subtitle: "Single-point distance sensor for robotics",
    description: "Compact ranging module for obstacle avoidance, level sensing, and autonomous navigation projects.",
    category: "accessories",
    subcategory: "parts",
    price: 3200,
    rating: 4.7,
    reviewsCount: 51,
    stock: 15,
    createdAt: "2026-04-20T10:00:00.000Z",
    specifications: ["Range: 0.2–8 m", "Accuracy: ±6 cm", "Frequency: 100 Hz", "Interface: UART / I²C", "Voltage: 5V", "Weight: 5 g"],
  }),
  buildMockProduct(14, {
    title: "XT60 Power Connector Workshop Kit",
    slug: "xt60-power-connector-workshop-kit",
    imageLabel: "XT60 Connector Kit",
    accent: "#f59e0b",
    subtitle: "Complete high-current connector assortment",
    description: "Workshop pack with genuine-style XT60 connectors, heat-shrink tubing, and protective caps.",
    category: "accessories",
    subcategory: "connectors",
    price: 480,
    discountPrice: 390,
    rating: 4.5,
    reviewsCount: 33,
    stock: 0,
    createdAt: "2026-03-15T10:00:00.000Z",
    specifications: ["Connector: XT60", "Pairs: 10", "Current: Up to 60A", "Material: Gold-plated brass", "Housing: Nylon", "Extras: Heat-shrink and caps"],
  }),
  buildMockProduct(15, {
    title: "A2212 1000KV Brushless Motor",
    slug: "a2212-1000kv-brushless-motor",
    imageLabel: "A2212 Motor",
    accent: "#dc2626",
    subtitle: "Efficient outrunner for multirotor aircraft",
    description: "Dependable brushless motor for quadcopters, trainers, and fixed-wing RC aircraft.",
    category: "motors",
    subcategory: "brushless-motors",
    price: 1450,
    discountPrice: 1290,
    rating: 4.7,
    reviewsCount: 176,
    stock: 4,
    isBestSeller: true,
    createdAt: "2026-02-11T10:00:00.000Z",
    specifications: ["KV Rating: 1000KV", "Input: 2S–3S", "Max Current: 14A", "Shaft: 3.17 mm", "Recommended Prop: 10 × 4.5", "Weight: 52 g"],
  }),
  buildMockProduct(16, {
    title: "Arduino Uno R3 Starter Board",
    slug: "arduino-uno-r3-starter-board",
    imageLabel: "Arduino Uno R3",
    accent: "#0891b2",
    subtitle: "Beginner-friendly prototyping controller",
    description: "ATmega328P-compatible development board with USB cable for electronics and automation projects.",
    category: "accessories",
    subcategory: "tools",
    price: 850,
    discountPrice: 699,
    rating: 4.8,
    reviewsCount: 219,
    stock: 25,
    isBestSeller: true,
    createdAt: "2026-01-08T10:00:00.000Z",
    specifications: ["Controller: ATmega328P", "Logic: 5V", "Digital I/O: 14", "Analog Inputs: 6", "Clock: 16 MHz", "Connection: USB-B"],
  }),
];

const asBoolean = (value) => value === true || value === "true";
const effectivePrice = (product) => product.discountPrice ?? product.price;

export const filterMockProducts = (query = {}) => {
  let products = [...MOCK_PRODUCTS];
  if (query.category) products = products.filter((product) => product.category === query.category);
  if (query.subcategory) products = products.filter((product) => product.subcategory === query.subcategory);
  if (query.search) {
    const search = String(query.search).trim().toLowerCase();
    products = products.filter((product) =>
      [product.title, product.subtitle, product.description, product.category, product.subcategory]
        .some((value) => value.toLowerCase().includes(search)),
    );
  }
  if (query.isNewArrival !== undefined) products = products.filter((product) => product.isNewArrival === asBoolean(query.isNewArrival));
  if (query.isBestSeller !== undefined) products = products.filter((product) => product.isBestSeller === asBoolean(query.isBestSeller));
  if (query.onSale !== undefined) products = products.filter((product) => product.onSale === asBoolean(query.onSale));
  if (query.inStock !== undefined) products = products.filter((product) => asBoolean(query.inStock) ? product.stock > 0 : product.stock <= 0);
  if (query.stockStatus) products = products.filter((product) => product.stockStatus === query.stockStatus);
  if (query.minPrice !== undefined && query.minPrice !== "") products = products.filter((product) => effectivePrice(product) >= Number(query.minPrice));
  if (query.maxPrice !== undefined && query.maxPrice !== "") products = products.filter((product) => effectivePrice(product) <= Number(query.maxPrice));

  const sort = query.sort;
  if (sort === "price_asc" || sort === "price-low") products.sort((a, b) => effectivePrice(a) - effectivePrice(b));
  else if (sort === "price_desc" || sort === "price-high") products.sort((a, b) => effectivePrice(b) - effectivePrice(a));
  else if (sort === "rating") products.sort((a, b) => b.rating - a.rating || b.reviewsCount - a.reviewsCount);
  else products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return products;
};

export const getMockProductResponse = (query = {}) => {
  const products = filterMockProducts(query);
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 20);
  const start = (page - 1) * limit;
  return {
    items: products.slice(start, start + limit),
    total: products.length,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(products.length / limit)),
    source: "mock",
  };
};

export const getMockProduct = (idOrSlug) =>
  MOCK_PRODUCTS.find((product) => product._id === idOrSlug || product.slug === idOrSlug) ?? null;
