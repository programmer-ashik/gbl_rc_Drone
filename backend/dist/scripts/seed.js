import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDatabase } from "../src/loaders/mongoose.loader.js";
import { config } from "../src/config/env.js";
import { UserModel } from "../src/api/v1/users/user.model.js";
import { OrganizationModel } from "../src/api/v1/organizations/organization.model.js";
import { CategoryModel } from "../src/api/v1/categories/category.model.js";
import { ProductModel } from "../src/api/v1/products/product.model.js";
import { createProduct } from "../src/api/v1/products/product.service.js";
const PRODUCT_IMAGE = "https://res.cloudinary.com/dba0ebn3c/image/upload/v1785174952/Quadcopter_drone_edn26i.jpg";
const CATEGORY_SEED = [
    {
        slug: "drones",
        label: "Drones",
        icon: "drone",
        sub: [
            "racing-drones",
            "camera-drones",
            "toy-drones",
            "professional-drones",
        ],
    },
    {
        slug: "fpv-racing",
        label: "FPV Racing",
        icon: "rocket",
        sub: [
            "fpv-frames",
            "fpv-motors",
            "fpv-escs",
            "fpv-flight-controllers",
            "fpv-cameras",
            "fpv-goggles",
            "fpv-vtx",
            "fpv-antenna",
        ],
    },
    {
        slug: "rc-cars",
        label: "RC Cars",
        icon: "car",
        sub: ["off-road", "on-road", "drift-cars", "crawlers", "rc-parts"],
    },
    {
        slug: "batteries",
        label: "Batteries",
        icon: "battery",
        sub: [
            "lipo-batteries",
            "li-ion-batteries",
            "battery-chargers",
            "battery-accessories",
        ],
    },
    {
        slug: "motors",
        label: "Motors",
        icon: "motor",
        sub: ["brushless-motors", "brushed-motors", "motor-esc"],
    },
    {
        slug: "transmitters",
        label: "Transmitters",
        icon: "radio",
        sub: [
            "transmitter-receiver",
            "transmitter-modules",
            "transmitter-accessories",
        ],
    },
    {
        slug: "accessories",
        label: "Accessories",
        icon: "tool",
        sub: ["propellers", "connectors", "tools", "parts"],
    },
];
const PRODUCT_SEED = [
    {
        title: "ESP32 WiFi & Bluetooth Development Board",
        description: "High-performance dual-core microcontroller ideal for IoT and robotics automation projects.",
        category: "drones",
        subcategory: "racing-drones",
        price: 850,
        discountPrice: 699,
        rating: 4.8,
        isBestSeller: true,
        isNewArrival: true,
        onSale: true,
    },
    {
        title: "Brushless Motor A2212 1000KV for Drones",
        description: "Reliable outrunner brushless motor designed for multirotors, quadcopters, and fixed-wing RC planes.",
        category: "motors",
        subcategory: "brushless-motors",
        price: 1250,
        discountPrice: 1099,
        rating: 4.9,
        isBestSeller: true,
        onSale: true,
    },
    {
        title: "Pixhawk 4 Flight Controller Full Kit",
        description: "Advanced autopilot system for autonomous drones, aerial mapping, and high-end robotics navigation.",
        category: "fpv-racing",
        subcategory: "fpv-flight-controllers",
        price: 9500,
        discountPrice: 8800,
        rating: 5,
        isBestSeller: true,
    },
    {
        title: "Arduino Uno R3 Compatible Microcontroller",
        description: "The classic beginner-friendly prototyping board powered by ATmega328P with USB cable included.",
        category: "accessories",
        subcategory: "tools",
        price: 650,
        discountPrice: 550,
        rating: 4.7,
        onSale: true,
    },
    {
        title: "ESP32-S3 AI Cam Development Board",
        description: "Integrated Wi-Fi, Bluetooth 5, and camera interface for AI vision robotics.",
        category: "drones",
        subcategory: "camera-drones",
        price: 1450,
        discountPrice: 1299,
        rating: 4.9,
        isNewArrival: true,
        onSale: true,
    },
    {
        title: "Brushless Motor 2306 2450KV FPV Racing",
        description: "High-RPM racing motor engineered for freestyle drone agility and rapid throttle response.",
        category: "fpv-racing",
        subcategory: "fpv-motors",
        price: 1850,
        discountPrice: 1650,
        rating: 5,
        isNewArrival: true,
        onSale: true,
    },
    {
        title: "LiPo Battery 4S 14.8V 1500mAh 120C",
        description: "High-discharge battery pack optimized for competitive FPV drones.",
        category: "batteries",
        subcategory: "lipo-batteries",
        price: 2400,
        discountPrice: 2150,
        rating: 4.8,
        onSale: true,
    },
    {
        title: "LiDAR Distance Sensor TF-Luna 8m",
        description: "Compact single-point ranging LiDAR sensor for obstacle avoidance.",
        category: "accessories",
        subcategory: "parts",
        price: 3200,
        discountPrice: 2950,
        rating: 4.9,
        isNewArrival: true,
    },
    {
        title: "FPV Carbon Fiber Frame 5 Inch",
        description: "Durable lightweight racing frame for high-speed FPV builds.",
        category: "fpv-racing",
        subcategory: "fpv-frames",
        price: 2100,
        discountPrice: 1890,
        rating: 4.6,
    },
    {
        title: "6S 150A ESC Stack Combo",
        description: "Reliable ESC and flight controller combo for freestyle drones.",
        category: "motors",
        subcategory: "motor-esc",
        price: 7800,
        discountPrice: 7290,
        rating: 4.8,
        isNewArrival: true,
    },
    {
        title: "FPV Goggles HD Pro",
        description: "Low-latency digital FPV goggles with high-brightness display.",
        category: "fpv-racing",
        subcategory: "fpv-goggles",
        price: 32900,
        discountPrice: 29900,
        rating: 4.9,
        isBestSeller: true,
    },
    {
        title: "2.4GHz Radio Transmitter 8CH",
        description: "Stable long-range RC transmitter with ergonomic grip.",
        category: "transmitters",
        subcategory: "transmitter-receiver",
        price: 5200,
        discountPrice: 4790,
        rating: 4.5,
    },
    {
        title: "RC Drift Car 1/10 Scale",
        description: "High-torque brushless RC drift platform for on-road tracks.",
        category: "rc-cars",
        subcategory: "drift-cars",
        price: 18500,
        discountPrice: 16900,
        rating: 4.6,
        isBestSeller: true,
    },
    {
        title: "Propeller Set 5x4.5 (4 Pair)",
        description: "Balanced propeller set for quadcopter performance and stability.",
        category: "accessories",
        subcategory: "propellers",
        price: 480,
        discountPrice: 420,
        rating: 4.4,
        onSale: true,
    },
    {
        title: "Professional Camera Drone 4K",
        description: "Foldable prosumer drone with stabilized 4K camera.",
        category: "drones",
        subcategory: "professional-drones",
        price: 78500,
        discountPrice: 72900,
        rating: 4.7,
        isBestSeller: true,
    },
];
const saveSeedUser = async (data) => {
    const email = data.email.toLowerCase();
    const query = data.organizationId == null
        ? { email, $or: [{ organizationId: null }, { organizationId: { $exists: false } }] }
        : { email, organizationId: data.organizationId };
    const existing = await UserModel.findOne(query);
    if (existing) {
        existing.name = data.name;
        existing.email = email;
        existing.password = data.password;
        existing.role = data.role;
        existing.organizationId = data.organizationId ?? null;
        existing.markModified('password');
        await existing.save();
        return existing;
    }
    return UserModel.create({ ...data, email });
};
const run = async () => {
    if (!config.ALLOW_DEFAULT_ADMIN_SEED) {
        console.log("Set ALLOW_DEFAULT_ADMIN_SEED=true to seed platform admin");
        process.exit(0);
    }
    await connectDatabase();
    const orgSlug = config.DEFAULT_ORG_SLUG || "gblrcdrone";
    const orgName = "GBLrcDrone";
    const org = await OrganizationModel.findOneAndUpdate({ slug: orgSlug }, { name: orgName, slug: orgSlug, status: "ACTIVE" }, { upsert: true, new: true, setDefaultsOnInsert: true });
    const platformEmail = (config.PLATFORM_ADMIN_EMAIL ?? "admin@gblrc.com").toLowerCase();
    const platformPassword = config.PLATFORM_ADMIN_PASSWORD ?? "Test@123456";
    const platformHash = await bcrypt.hash(platformPassword, 10);
    await saveSeedUser({
        name: "Platform Admin",
        email: platformEmail,
        password: platformHash,
        role: "platform_super_admin",
        organizationId: null,
    });
    const storeAdminHash = await bcrypt.hash("Test@123456", 10);
    const storeAdmin = await saveSeedUser({
        name: "Store Admin",
        email: "store_admin@gblrc.com",
        password: storeAdminHash,
        role: "store_admin",
        organizationId: org._id,
    });
    const customerHash = await bcrypt.hash("Test@123456", 10);
    await saveSeedUser({
        name: "Demo User",
        email: "demo@gblrc.com",
        password: customerHash,
        role: "customer",
        organizationId: org._id,
    });
    if (!org.owner) {
        org.owner = storeAdmin._id;
        await org.save();
    }
    await CategoryModel.deleteMany({});
    let order = 1;
    for (const item of CATEGORY_SEED) {
        const parent = await CategoryModel.create({
            slug: item.slug,
            name: item.label,
            label: item.label,
            icon: item.icon,
            image: "",
            parentId: null,
            parentSlug: null,
            level: 1,
            displayOrder: order,
            order,
            isActive: true,
            active: true,
            isNavVisible: true,
            isFooterVisible: true,
            metaTitle: item.label,
            metaDescription: `Shop ${item.label} at GBLrcDrone`,
        });
        order += 1;
        let childOrder = 1;
        for (const child of item.sub) {
            const childName = child
                .split("-")
                .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                .join(" ");
            await CategoryModel.create({
                slug: child,
                name: childName,
                label: childName,
                icon: "",
                image: "",
                parentId: parent._id,
                parentSlug: item.slug,
                level: 2,
                displayOrder: childOrder,
                order: childOrder,
                isActive: true,
                active: true,
                isNavVisible: true,
                isFooterVisible: false,
                metaTitle: childName,
                metaDescription: `Shop ${childName} in ${item.label}`,
            });
            childOrder += 1;
        }
    }
    await ProductModel.deleteMany({});
    const inferAttributes = (item) => {
        const attributes = { origin: 'Imported', warranty: '7 days checking' };
        if (item.category === 'motors' || item.subcategory?.includes('motor')) {
            attributes.type = 'brushless';
            attributes.use = 'drone';
        }
        else if (item.category === 'batteries' || item.subcategory?.includes('lipo') || item.subcategory?.includes('battery')) {
            attributes.chemistry = 'lipo';
            attributes.use = 'power';
        }
        else if (item.category === 'drones') {
            attributes.platform = 'quadcopter';
            attributes.use = 'aerial';
        }
        else if (item.category === 'fpv-racing') {
            attributes.use = 'fpv';
            attributes.platform = 'racing';
        }
        else if (item.category === 'transmitters') {
            attributes.use = 'radio';
        }
        else if (item.category === 'accessories') {
            attributes.use = 'workshop';
        }
        if (item.isBestSeller)
            attributes.tier = 'bestseller';
        else if (item.isNewArrival)
            attributes.tier = 'new';
        return attributes;
    };
    for (const item of PRODUCT_SEED) {
        await createProduct({
            ...item,
            name: item.title,
            tags: [item.category, item.subcategory].filter(Boolean),
            isFeatured: Boolean(item.isBestSeller),
            seoTitle: item.title,
            seoDescription: item.description,
            stock: 50,
            stockAlertThreshold: 5,
            specifications: ['Warranty: 7 days checking', 'Origin: Imported'],
            attributes: inferAttributes(item),
            blockDiagram: '',
            descriptionText: item.description,
            status: 'active',
            subtitle: item.description,
            image: PRODUCT_IMAGE,
            images: [PRODUCT_IMAGE],
            compatibleWith: [],
            variants: [],
        }, org._id);
    }
    console.log(`Seed complete: ${CATEGORY_SEED.length} categories, ${PRODUCT_SEED.length} products`);
    console.log(`Login emails (password Test@123456 unless PLATFORM_ADMIN_PASSWORD is set):`);
    console.log(`  platform: ${platformEmail}`);
    console.log('  store admin: store_admin@gblrc.com');
    console.log('  customer: demo@gblrc.com');
    process.exit(0);
};
run().catch((err) => {
    console.error(err);
    process.exit(1);
});
