import React, { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../../components/common/Icon/Icon";
import Button from "../../components/common/Button/Button";
import { ROUTES } from "../../constants";
import { COMPANY_INFO } from "../../data/companyInfo";

const { contact } = COMPANY_INFO;

const ContactCard = ({ icon, title, children }) => (
  <div className="flex items-start gap-4 p-5 sm:p-6 rounded-2xl bg-background-secondary border border-border shadow-sm">
    <div className="bg-warning/10 text-warning p-3 rounded-xl flex-shrink-0">
      <Icon name={icon} size={6} className="cursor-default" />
    </div>
    <div className="min-w-0">
      <h3 className="font-bold text-text-primary text-base mb-1">{title}</h3>
      <div className="text-xs sm:text-sm text-text-secondary leading-relaxed break-words">
        {children}
      </div>
    </div>
  </div>
);

export const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [emailOpened, setEmailOpened] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const body = [
      `Name: ${formData.name}`,
      `Email: ${formData.email}`,
      "",
      formData.message,
    ].join("\n");
    const mailtoUrl = `mailto:${contact.email}?subject=${encodeURIComponent(
      formData.subject,
    )}&body=${encodeURIComponent(body)}`;

    setEmailOpened(true);
    window.location.href = mailtoUrl;
  };

  return (
    <div className="site-container bg-background py-5 text-text md:py-8">
      <nav
        className="page-breadcrumb"
        aria-label="Breadcrumb"
      >
        <Link to={ROUTES.HOME} className="hover:text-warning transition-colors">
          Home
        </Link>
        <Icon name="chevron-right" size={3} />
        <span className="font-medium text-text">Contact Us</span>
      </nav>

      <section className="relative mb-8 overflow-hidden rounded-2xl border border-warning/30 bg-gradient-to-br from-warning/15 via-background-secondary to-background p-5 sm:p-7">
        <div className="relative max-w-3xl">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-warning/30 bg-warning/10 px-2.5 py-0.5 text-[12px] font-semibold text-warning">
            <Icon name="email" size={3.5} className="cursor-default" />
            Get in touch
          </div>
          <h1 className="page-title mb-2">
            Let&apos;s Build the Right Technology Solution
          </h1>
          <p className="max-w-2xl text-[13px] leading-relaxed text-text-secondary sm:text-sm">
            Contact GBLrcDrone to discuss Audio-Visual, communication,
            surveillance, security, smart infrastructure or industrial
            automation requirements. Our team can support projects from design
            and integration through commissioning and after-sales service.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        <section className="lg:col-span-5 flex flex-col gap-4" aria-label="Contact information">
          <ContactCard icon="building" title="Corporate Office">
            <address className="not-italic">{contact.corporateOffice}</address>
          </ContactCard>

          <ContactCard icon="location" title="Registered Address">
            <address className="not-italic">{contact.registeredAddress}</address>
          </ContactCard>

          <ContactCard icon="phone" title="Telephone">
            <a
              href={`tel:${contact.phoneHref}`}
              className="hover:text-warning transition-colors"
            >
              {contact.phone}
            </a>
          </ContactCard>

          <ContactCard icon="email" title="Email">
            <a
              href={`mailto:${contact.email}`}
              className="hover:text-warning transition-colors"
            >
              {contact.email}
            </a>
          </ContactCard>

          <ContactCard icon="globe" title="Website">
            <a
              href={contact.websiteHref}
              target="_blank"
              rel="noreferrer"
              className="hover:text-warning transition-colors"
            >
              {contact.website}
            </a>
          </ContactCard>
        </section>

        <section className="lg:col-span-7 bg-background-secondary p-6 sm:p-8 rounded-2xl border border-border shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-2">
              Send an Inquiry
            </h2>
            <p className="text-sm text-text-secondary">
              Share your project requirements and your default email application
              will prepare a message to our team.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="contact-name" className="text-xs font-semibold text-text-primary">
                  Your Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  className="bg-background border border-border text-text-primary text-xs sm:text-sm rounded-xl px-4 py-3 outline-none focus:border-warning focus:ring-2 focus:ring-warning/20 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="contact-email" className="text-xs font-semibold text-text-primary">
                  Your Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@company.com"
                  className="bg-background border border-border text-text-primary text-xs sm:text-sm rounded-xl px-4 py-3 outline-none focus:border-warning focus:ring-2 focus:ring-warning/20 transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="contact-subject" className="text-xs font-semibold text-text-primary">
                Subject
              </label>
              <input
                id="contact-subject"
                type="text"
                name="subject"
                required
                value={formData.subject}
                onChange={handleChange}
                placeholder="Project or service requirement"
                className="bg-background border border-border text-text-primary text-xs sm:text-sm rounded-xl px-4 py-3 outline-none focus:border-warning focus:ring-2 focus:ring-warning/20 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="contact-message" className="text-xs font-semibold text-text-primary">
                Message
              </label>
              <textarea
                id="contact-message"
                name="message"
                required
                rows={6}
                value={formData.message}
                onChange={handleChange}
                placeholder="Tell us about the site, scope, timeline and technical requirements..."
                className="bg-background border border-border text-text-primary text-xs sm:text-sm rounded-xl px-4 py-3 outline-none focus:border-warning focus:ring-2 focus:ring-warning/20 transition-colors resize-y"
              />
            </div>

            <Button
              variant="solid"
              size="lg"
              type="submit"
              className="mt-2 bg-warning text-white hover:bg-warning/90 font-medium py-3 px-6 rounded-xl shadow-lg shadow-warning/20 transition-all text-sm flex items-center justify-center gap-2"
            >
              Prepare Email
              <Icon name="arrow-right" size={4} />
            </Button>

            {emailOpened && (
              <p className="text-xs text-success text-center" role="status">
                Your email application should now be open. If it did not open,
                email us directly at {contact.email}.
              </p>
            )}
          </form>
        </section>
      </div>
    </div>
  );
};

export default Contact;
