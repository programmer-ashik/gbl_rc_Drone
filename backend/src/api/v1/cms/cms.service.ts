import { z } from "zod";
import { BadRequestError, NotFoundError } from "../../../core/http/errors.js";
import { makeSlug } from "../../../utils/strings.js";
import { CategoryModel } from "../categories/category.model.js";
import { ProductModel } from "../products/product.model.js";
import { PageModel } from "./page.model.js";
import { HomepageModel } from "./homepage.model.js";
import { TestimonialModel } from "./testimonial.model.js";
import { RedirectModel } from "./redirect.model.js";
import { SeoSettingsModel } from "./seo-settings.model.js";

const stripHtml = (value = "") =>
  String(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const pageWriteSchema = z.object({
  title: z.string().trim().min(1).max(160),
  slug: z.string().trim().min(1).max(160).optional(),
  content: z.string().optional().default(""),
  metaTitle: z.string().trim().max(120).optional().default(""),
  metaDescription: z.string().trim().max(320).optional().default(""),
  status: z.enum(["draft", "published"]).optional().default("published"),
  template: z
    .enum(["home", "about", "contact", "faq", "terms", "privacy", "custom"])
    .optional()
    .default("custom"),
});

export const homepageWriteSchema = z.object({
  metaTitle: z.string().trim().max(120).optional(),
  metaDescription: z.string().trim().max(320).optional(),
  heroSlides: z
    .array(
      z.object({
        _id: z.string().optional(),
        title: z.string().optional().default(""),
        subtitle: z.string().optional().default(""),
        description: z.string().optional().default(""),
        badge: z.string().optional().default(""),
        image: z.string().optional().default(""),
        videoUrl: z.string().optional().default(""),
        ctaText: z.string().optional().default("Shop now"),
        ctaLink: z.string().optional().default("/products"),
        secondaryCtaText: z.string().optional().default(""),
        secondaryCtaLink: z.string().optional().default(""),
        enabled: z.boolean().optional().default(true),
        order: z.number().optional().default(0),
      }),
    )
    .optional(),
  sections: z
    .array(
      z.object({
        key: z.enum([
          "hero",
          "featuredCategories",
          "newArrivals",
          "bestSellers",
          "specialOffers",
          "testimonials",
        ]),
        title: z.string().optional().default(""),
        subtitle: z.string().optional().default(""),
        enabled: z.boolean().optional().default(true),
        order: z.number().optional().default(0),
        limit: z.number().int().min(1).max(24).optional().default(8),
        categoryIds: z.array(z.string()).optional().default([]),
      }),
    )
    .optional(),
});

export const testimonialWriteSchema = z.object({
  name: z.string().trim().min(1).max(120),
  role: z.string().trim().max(120).optional().default(""),
  quote: z.string().trim().min(1).max(1000),
  rating: z.coerce.number().min(1).max(5).optional().default(5),
  avatar: z.string().optional().default(""),
  enabled: z.boolean().optional().default(true),
  order: z.coerce.number().optional().default(0),
});

export const redirectWriteSchema = z.object({
  fromPath: z.string().trim().min(1).max(300),
  toPath: z.string().trim().min(1).max(500),
  statusCode: z
    .union([z.literal(301), z.literal(302)])
    .optional()
    .default(301),
  enabled: z.boolean().optional().default(true),
  note: z.string().trim().max(240).optional().default(""),
});

export const seoSettingsWriteSchema = z.object({
  siteName: z.string().trim().max(120).optional(),
  siteUrl: z.string().trim().max(300).optional(),
  defaultMetaTitle: z.string().trim().max(120).optional(),
  defaultMetaDescription: z.string().trim().max(320).optional(),
  productTitlePattern: z.string().trim().max(160).optional(),
  categoryUrlPattern: z.string().trim().max(160).optional(),
  productUrlPattern: z.string().trim().max(160).optional(),
  robotsTxt: z.string().max(10000).optional(),
  ogImage: z.string().optional(),
});

const DEFAULT_PAGES = [
  {
    title: "About Us",
    slug: "about",
    template: "about",
    content:
      "<h2>About GBLrcDrone</h2><p>We supply high-performance RC, FPV, and robotics parts for builders and pilots across Bangladesh and beyond.</p>",
  },
  {
    title: "Contact",
    slug: "contact",
    template: "contact",
    content:
      "<h2>Contact Us</h2><p>Reach our support team for product advice, orders, and technical help.</p>",
  },
  {
    title: "FAQ",
    slug: "faq",
    template: "faq",
    content:
      "<h2>Frequently Asked Questions</h2><h3>Do you ship nationwide?</h3><p>Yes, we deliver across Bangladesh.</p><h3>How do returns work?</h3><p>Unused items can be returned within 7 days as per our policy.</p>",
  },
  {
    title: "Terms & Conditions",
    slug: "terms",
    template: "terms",
    content:
      "<h2>Terms & Conditions</h2><p>By using gblrcdrone.com you agree to our store policies for orders, payments, and deliveries.</p>",
  },
  {
    title: "Privacy Policy",
    slug: "privacy",
    template: "privacy",
    content:
      "<h2>Privacy Policy</h2><p>We protect your personal data and only use it to fulfill orders and improve your shopping experience.</p>",
  },
];

const DEFAULT_SECTIONS = [
  {
    key: "hero",
    title: "Hero Banner",
    subtitle: "",
    enabled: true,
    order: 0,
    limit: 3,
    categoryIds: [],
  },
  {
    key: "featuredCategories",
    title: "Featured Categories",
    subtitle: "Shop by category",
    enabled: true,
    order: 1,
    limit: 6,
    categoryIds: [],
  },
  {
    key: "bestSellers",
    title: "Best Selling Products",
    subtitle: "Popular picks",
    enabled: true,
    order: 2,
    limit: 8,
    categoryIds: [],
  },
  {
    key: "newArrivals",
    title: "New Arrivals",
    subtitle: "Fresh drops",
    enabled: true,
    order: 3,
    limit: 10,
    categoryIds: [],
  },
  {
    key: "specialOffers",
    title: "Special Offers",
    subtitle: "Save on selected gear",
    enabled: true,
    order: 4,
    limit: 8,
    categoryIds: [],
  },
  {
    key: "testimonials",
    title: "What Pilots Say",
    subtitle: "Customer reviews",
    enabled: true,
    order: 5,
    limit: 6,
    categoryIds: [],
  },
];

const DEFAULT_HERO = [
  {
    title: "Next-Gen Robotics & Automation",
    subtitle: "All accessories for robotics and drones",
    description:
      "Explore high-performance microcontrollers, sensors, motors, and smart kits.",
    badge: "Ultimate Robotics Hub",
    ctaText: "Explore Products",
    ctaLink: "/products",
    secondaryCtaText: "Combo Packages",
    secondaryCtaLink: "/combo-packages",
    enabled: true,
    order: 0,
    image: "",
    videoUrl: "",
  },
];

export const ensureCmsDefaults = async () => {
  for (const page of DEFAULT_PAGES) {
    const exists = await PageModel.findOne({ slug: page.slug });
    if (!exists) {
      await PageModel.create({
        ...page,
        metaTitle: `${page.title} | GBLrcDrone`,
        metaDescription: stripHtml(page.content).slice(0, 160),
        status: "published",
      });
    }
  }

  let homepage = await HomepageModel.findOne({ key: "default" });
  if (!homepage) {
    homepage = await HomepageModel.create({
      key: "default",
      heroSlides: DEFAULT_HERO,
      sections: DEFAULT_SECTIONS,
    });
  }

  let seo = await SeoSettingsModel.findOne({ key: "default" });
  if (!seo) {
    seo = await SeoSettingsModel.create({ key: "default" });
  }

  const testimonialCount = await TestimonialModel.countDocuments();
  if (!testimonialCount) {
    await TestimonialModel.create([
      {
        name: "Rakib Hasan",
        role: "FPV Pilot",
        quote:
          "Great parts quality and fast delivery. My go-to store for drone builds.",
        rating: 5,
        order: 0,
      },
      {
        name: "Nusrat Jahan",
        role: "Robotics Student",
        quote: "Clear product info and reliable stock for university projects.",
        rating: 5,
        order: 1,
      },
    ]);
  }

  return { homepage, seo };
};

export const getSeoSettings = async () => {
  await ensureCmsDefaults();
  return SeoSettingsModel.findOne({ key: "default" }).lean();
};

export const updateSeoSettings = async (
  payload: z.infer<typeof seoSettingsWriteSchema>,
) => {
  await ensureCmsDefaults();
  const doc = await SeoSettingsModel.findOneAndUpdate(
    { key: "default" },
    { $set: payload },
    { new: true },
  );
  return doc;
};

export const listPages = async (includeDrafts = false) => {
  const filter = includeDrafts ? {} : { status: "published" };
  return PageModel.find(filter).sort({ title: 1 }).lean();
};

export const getPageBySlug = async (slug: string, allowDraft = false) => {
  const filter: Record<string, unknown> = { slug: String(slug).toLowerCase() };
  if (!allowDraft) filter.status = "published";
  const page = await PageModel.findOne(filter).lean();
  if (!page) throw new NotFoundError("Page not found");
  return page;
};

export const upsertPage = async (
  id: string | null,
  payload: z.infer<typeof pageWriteSchema>,
) => {
  const slug = makeSlug(payload.slug || payload.title);
  if (!slug) throw new BadRequestError("Valid slug is required");
  const data = {
    ...payload,
    slug,
    metaTitle: payload.metaTitle || payload.title,
    metaDescription:
      payload.metaDescription || stripHtml(payload.content).slice(0, 320),
  };

  if (id) {
    const existing = await PageModel.findById(id);
    if (!existing) throw new NotFoundError("Page not found");
    const clash = await PageModel.findOne({ slug, _id: { $ne: id } });
    if (clash) throw new BadRequestError("Slug already in use");
    Object.assign(existing, data);
    await existing.save();
    return existing;
  }

  const clash = await PageModel.findOne({ slug });
  if (clash) throw new BadRequestError("Slug already in use");
  return PageModel.create(data);
};

export const deletePage = async (id: string) => {
  const page = await PageModel.findByIdAndDelete(id);
  if (!page) throw new NotFoundError("Page not found");
  return { deleted: true, id };
};

export const getHomepageConfig = async () => {
  await ensureCmsDefaults();
  return HomepageModel.findOne({ key: "default" }).lean();
};

export const updateHomepageConfig = async (
  payload: z.infer<typeof homepageWriteSchema>,
) => {
  await ensureCmsDefaults();
  const doc = await HomepageModel.findOneAndUpdate(
    { key: "default" },
    { $set: payload },
    { new: true },
  );
  return doc;
};

export const getHomepagePayload = async () => {
  const [homepage, seo, testimonials] = await Promise.all([
    getHomepageConfig(),
    getSeoSettings(),
    TestimonialModel.find({ enabled: true })
      .sort({ order: 1, createdAt: -1 })
      .lean(),
  ]);

  const homepageDoc = homepage && !Array.isArray(homepage) ? homepage : null;
  const seoDoc = seo && !Array.isArray(seo) ? seo : null;

  const sections = [...((homepageDoc?.sections as any[]) || [])].sort(
    (a: any, b: any) => (a.order || 0) - (b.order || 0),
  );
  const enabled = sections.filter((section: any) => section.enabled !== false);
  const byKey = Object.fromEntries(
    enabled.map((section: any) => [section.key, section]),
  );

  const featuredLimit = byKey.featuredCategories?.limit || 6;
  let featuredCategories: any[] = [];
  if (byKey.featuredCategories) {
    const ids = byKey.featuredCategories.categoryIds || [];
    if (ids.length) {
      featuredCategories = await CategoryModel.find({
        _id: { $in: ids },
        isActive: { $ne: false },
      })
        .select("name slug image description")
        .lean();
    } else {
      featuredCategories = await CategoryModel.find({
        $or: [{ isActive: true }, { isActive: { $exists: false } }],
        level: 1,
      })
        .sort({ displayOrder: 1, name: 1 })
        .limit(featuredLimit)
        .select("name slug image description")
        .lean();
    }
  }

  const [newArrivals, bestSellers, specialOffers] = await Promise.all([
    byKey.newArrivals
      ? ProductModel.find({ status: "active", isNewArrival: true })
          .sort({ createdAt: -1 })
          .limit(byKey.newArrivals.limit || 10)
          .lean()
      : Promise.resolve([]),
    byKey.bestSellers
      ? ProductModel.find({
          status: "active",
          $or: [{ isBestSeller: true }, { isFeatured: true }],
        })
          .sort({ isBestSeller: -1, rating: -1, createdAt: -1 })
          .limit(byKey.bestSellers.limit || 8)
          .lean()
      : Promise.resolve([]),
    byKey.specialOffers
      ? ProductModel.find({
          status: "active",
          $or: [
            { onSale: true },
            { discountPrice: { $ne: null } },
            { discount: { $gt: 0 } },
          ],
        })
          .sort({ createdAt: -1 })
          .limit(byKey.specialOffers.limit || 8)
          .lean()
      : Promise.resolve([]),
  ]);

  return {
    seo: {
      metaTitle: homepageDoc?.metaTitle || seoDoc?.defaultMetaTitle,
      metaDescription:
        homepageDoc?.metaDescription || seoDoc?.defaultMetaDescription,
      siteName: seoDoc?.siteName,
      siteUrl: seoDoc?.siteUrl,
      ogImage: seoDoc?.ogImage,
    },
    heroSlides: (homepageDoc?.heroSlides || [])
      .filter((slide: any) => slide.enabled !== false)
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0)),
    sections: enabled,
    featuredCategories,
    newArrivals,
    bestSellers,
    specialOffers,
    testimonials: byKey.testimonials
      ? testimonials.slice(0, byKey.testimonials.limit || 6)
      : [],
  };
};

export const listTestimonials = async (all = false) =>
  TestimonialModel.find(all ? {} : { enabled: true })
    .sort({ order: 1, createdAt: -1 })
    .lean();

export const upsertTestimonial = async (
  id: string | null,
  payload: z.infer<typeof testimonialWriteSchema>,
) => {
  if (id) {
    const doc = await TestimonialModel.findByIdAndUpdate(id, payload, {
      new: true,
    });
    if (!doc) throw new NotFoundError("Testimonial not found");
    return doc;
  }
  return TestimonialModel.create(payload);
};

export const deleteTestimonial = async (id: string) => {
  const doc = await TestimonialModel.findByIdAndDelete(id);
  if (!doc) throw new NotFoundError("Testimonial not found");
  return { deleted: true, id };
};

export const listRedirects = async () =>
  RedirectModel.find().sort({ fromPath: 1 }).lean();

export const upsertRedirect = async (
  id: string | null,
  payload: z.infer<typeof redirectWriteSchema>,
) => {
  const data = {
    ...payload,
    fromPath: payload.fromPath.startsWith("/")
      ? payload.fromPath
      : `/${payload.fromPath}`,
  };
  if (id) {
    const clash = await RedirectModel.findOne({
      fromPath: data.fromPath,
      _id: { $ne: id },
    });
    if (clash) throw new BadRequestError("From path already exists");
    const doc = await RedirectModel.findByIdAndUpdate(id, data, { new: true });
    if (!doc) throw new NotFoundError("Redirect not found");
    return doc;
  }
  const clash = await RedirectModel.findOne({ fromPath: data.fromPath });
  if (clash) throw new BadRequestError("From path already exists");
  return RedirectModel.create(data);
};

export const deleteRedirect = async (id: string) => {
  const doc = await RedirectModel.findByIdAndDelete(id);
  if (!doc) throw new NotFoundError("Redirect not found");
  return { deleted: true, id };
};

export const findRedirect = async (pathname: string) => {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return RedirectModel.findOne({ fromPath: normalized, enabled: true }).lean();
};

export const applyUrlPattern = (pattern: string, slug: string) =>
  String(pattern || "").replace("{slug}", slug);

export const buildProductSeo = async (product: {
  name?: string;
  title?: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
}) => {
  const seo = (await getSeoSettings()) as Record<string, any> | null;
  const name = product.name || product.title || "Product";
  const autoTitle = String(
    seo?.productTitlePattern || "{productName} - Buy Online at gblrcdrone.com",
  ).replace("{productName}", name);
  const autoDescription = stripHtml(product.description || "").slice(0, 320);
  return {
    seoTitle: product.seoTitle?.trim() || autoTitle.slice(0, 120),
    seoDescription: product.seoDescription?.trim() || autoDescription,
    canonicalPath: applyUrlPattern(
      seo?.productUrlPattern || "/product/{slug}",
      "",
    ),
  };
};

export const buildSitemapXml = async () => {
  const seo = (await getSeoSettings()) as Record<string, any> | null;
  const base = String(seo?.siteUrl || "https://gblrcdrone.com").replace(
    /\/+$/,
    "",
  );
  const [pages, products, categories] = await Promise.all([
    PageModel.find({ status: "published" }).select("slug updatedAt").lean(),
    ProductModel.find({ status: "active" }).select("slug updatedAt").lean(),
    CategoryModel.find({
      $or: [{ isActive: true }, { isActive: { $exists: false } }],
    })
      .select("slug updatedAt")
      .lean(),
  ]);

  const productPattern = seo?.productUrlPattern || "/product/{slug}";
  const categoryPattern = seo?.categoryUrlPattern || "/category/{slug}";

  const urls: Array<{ loc: string; lastmod?: string; priority: string }> = [
    { loc: `${base}/`, priority: "1.0" },
    { loc: `${base}/products`, priority: "0.8" },
    { loc: `${base}/new-arrivals`, priority: "0.7" },
    { loc: `${base}/sale`, priority: "0.7" },
  ];

  pages.forEach((page: any) => {
    urls.push({
      loc: `${base}/${page.slug}`,
      lastmod: page.updatedAt
        ? new Date(page.updatedAt).toISOString()
        : undefined,
      priority: "0.6",
    });
  });
  categories.forEach((category: any) => {
    urls.push({
      loc: `${base}${applyUrlPattern(categoryPattern, category.slug)}`,
      lastmod: category.updatedAt
        ? new Date(category.updatedAt).toISOString()
        : undefined,
      priority: "0.7",
    });
  });
  products.forEach((product: any) => {
    urls.push({
      loc: `${base}${applyUrlPattern(productPattern, product.slug)}`,
      lastmod: product.updatedAt
        ? new Date(product.updatedAt).toISOString()
        : undefined,
      priority: "0.8",
    });
  });

  const body = urls
    .map(
      (entry) => `  <url>
    <loc>${entry.loc}</loc>${entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : ""}
    <priority>${entry.priority}</priority>
  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
};

export const getRobotsTxt = async () => {
  const result = await getSeoSettings();
  const seo = result && !Array.isArray(result) ? result : null;
  const base = String(seo?.siteUrl || "https://gblrcdrone.com").replace(
    /\/+$/,
    "",
  );
  let text = seo?.robotsTxt || `User-agent: *\nAllow: /\n`;
  if (!/sitemap:/i.test(text)) {
    text += `\nSitemap: ${base}/sitemap.xml\n`;
  }
  return text;
};
