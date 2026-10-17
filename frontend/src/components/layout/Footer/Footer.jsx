import React, { useEffect, useRef } from "react";
import { motion, useAnimation, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { Icon } from "../../common/Icon/Icon";
import { ROUTES } from "../../../constants";
import { NewsletterSection } from "./NewsletterSection";
import { COMPANY_INFO } from "../../../data/companyInfo";
import { useCatalog } from "../../../contexts/CatalogContext";

const { contact } = COMPANY_INFO;

const footerLinks = [
  { label: "About Us", path: ROUTES.ABOUT },
  { label: "Products", path: ROUTES.PRODUCTS },
  { label: "New Arrivals", path: ROUTES.NEW_ARRIVALS },
  { label: "Sale Items", path: ROUTES.SALE },
  { label: "Contact Us", path: ROUTES.CONTACT },
];

export const Footer = () => {
  const { footerCategories } = useCatalog();
  const controls = useAnimation();
  const footerRef = useRef(null);
  const isInView = useInView(footerRef, {
    once: false,
    amount: 0.1,
    margin: "0px 0px -100px 0px",
  });

  const containerVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: "easeOut",
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  useEffect(() => {
    if (isInView) controls.start("visible");
  }, [isInView, controls]);

  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      ref={footerRef}
      id="footer"
      initial="hidden"
      animate={controls}
      variants={containerVariants}
      className="relative bg-background border-t border-border text-text overflow-hidden"
    >
      <div className="absolute inset-0 opacity-5" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, rgba(0,0,0,0.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="site-container relative z-10 py-14">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="space-y-4 lg:col-span-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center flex-shrink-0">
                <Icon name="building" size={6} className="cursor-default" />
              </div>
              <h2 className="text-xl font-bold text-text-primary leading-tight">
                <span className="text-warning">GBLrc</span>Drone
              </h2>
            </div>
            <p className="text-text-secondary text-sm leading-relaxed max-w-xs">
              A Bangladeshi specialist in high-performance Audio-Visual,
              communication, surveillance and integrated technology solutions.
            </p>
            <a
              href={contact.websiteHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-warning hover:opacity-80 transition-opacity"
            >
              <Icon name="globe" size={4} />
              {contact.website}
            </a>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-4 lg:col-span-2">
            <h3 className="text-lg font-semibold text-text-primary">Quick Links</h3>
            <ul className="space-y-2.5">
              {footerLinks.map((item) => (
                <motion.li
                  key={item.path}
                  whileHover={{ x: 6 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Link
                    to={item.path}
                    className="text-text-secondary hover:text-text-primary transition-colors duration-300 text-sm flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 bg-warning rounded-full group-hover:scale-150 transition-transform" />
                    {item.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-4 lg:col-span-2">
            <h3 className="text-lg font-semibold text-text-primary">Shop</h3>
            <ul className="space-y-2.5">
              {(footerCategories || []).slice(0, 8).map((item) => (
                <motion.li
                  key={item.slug || item.path}
                  whileHover={{ x: 6 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Link
                    to={item.path || `/category/${item.slug}`}
                    className="text-text-secondary hover:text-text-primary transition-colors duration-300 text-sm flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 bg-warning rounded-full group-hover:scale-150 transition-transform" />
                    {item.label || item.name}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-4 lg:col-span-3">
            <h3 className="text-lg font-semibold text-text-primary">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Icon
                  name="location"
                  size={5}
                  className="text-warning mt-0.5 flex-shrink-0 cursor-default"
                />
                <div>
                  <p className="text-sm text-text font-medium">Corporate Office</p>
                  <address className="not-italic text-sm text-text-secondary leading-relaxed">
                    {contact.corporateOffice}
                  </address>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Icon
                  name="phone"
                  size={5}
                  className="text-warning mt-0.5 flex-shrink-0 cursor-default"
                />
                <div>
                  <p className="text-sm text-text font-medium">Telephone</p>
                  <a
                    href={`tel:${contact.phoneHref}`}
                    className="text-sm text-text-secondary hover:text-warning transition-colors"
                  >
                    {contact.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 min-w-0">
                <Icon
                  name="email"
                  size={5}
                  className="text-warning mt-0.5 flex-shrink-0 cursor-default"
                />
                <div className="min-w-0">
                  <p className="text-sm text-text font-medium">Email</p>
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-sm text-text-secondary hover:text-warning transition-colors break-all"
                  >
                    {contact.email}
                  </a>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-4 lg:col-span-2">
            <h3 className="text-lg font-semibold text-text-primary">
              Corporate Details
            </h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-text font-medium">Established</dt>
                <dd className="text-text-secondary">{COMPANY_INFO.established}</dd>
              </div>
              <div>
                <dt className="text-text font-medium">Trade License</dt>
                <dd className="text-text-secondary break-words">
                  TRAD/DNCC/078433/2022
                </dd>
              </div>
              <div>
                <dt className="text-text font-medium">Registered Address</dt>
                <dd className="text-text-secondary leading-relaxed">
                  {contact.registeredAddress}
                </dd>
              </div>
            </dl>
          </motion.div>
        </motion.div>

        <NewsletterSection />

        <motion.div variants={itemVariants} className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-text-secondary text-center md:text-left">
              &copy; {currentYear}{" "}
              <span className="text-warning font-medium">GBLrcDrone</span>.
              All rights reserved.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm">
              <Link
                to={ROUTES.PRIVACY}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to={ROUTES.TERMS}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                to={ROUTES.SHIPPING}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                Shipping Info
              </Link>
              <Link
                to={ROUTES.RETURNS}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                Returns Policy
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-8 right-8 p-3 bg-warning hover:bg-warning-hover text-white rounded-full shadow-lg transition-all duration-300 z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8 }}
        aria-label="Scroll to top"
      >
        <Icon name="chevron-up" size={6} />
      </motion.button>
    </motion.footer>
  );
};

export default Footer;
