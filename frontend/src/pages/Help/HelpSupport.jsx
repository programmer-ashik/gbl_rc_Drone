import React, { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../../components/common/Icon/Icon";
import Button from "../../components/common/Button/Button";
import { ROUTES } from "../../constants";
import { COMPANY_INFO } from "../../data/companyInfo";
import { supportService } from "../../services/supportService";

const { contact } = COMPANY_INFO;

const supportChannels = [
  {
    icon: "phone",
    label: "Call support",
    value: contact.phone,
    href: `tel:${contact.phoneHref}`,
  },
  {
    icon: "email",
    label: "Email support",
    value: contact.email,
    href: `mailto:${contact.email}`,
  },
  {
    icon: "globe",
    label: "Company website",
    value: contact.website,
    href: contact.websiteHref,
    external: true,
  },
];

const frequentlyAskedQuestions = [
  {
    question: "How can I get help with an existing order?",
    answer:
      "Choose Order support in the form and include your order number, the item name, and a short description of the issue. This gives our team the context needed to review your request.",
  },
  {
    question: "Can I ask for product or system recommendations?",
    answer:
      "Yes. Choose Product information and describe your intended use, technical requirements, site conditions, and budget range. GBLrcDrone can help identify a suitable solution.",
  },
  {
    question: "Where can I request installation or after-sales support?",
    answer:
      "Submit a Technical support ticket with the installed system, location, and observed problem. You can also call or email GBLrcDrone using the contact options on this page.",
  },
  {
    question: "Where is GBLrcDrone located?",
    answer: `The corporate office is at ${contact.corporateOffice}. The registered address is ${contact.registeredAddress}.`,
  },
];

const initialForm = {
  name: "",
  email: "",
  phone: "",
  category: "order",
  subject: "",
  message: "",
};

const fieldClass =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-warning focus:ring-2 focus:ring-warning/20";

export const HelpSupport = () => {
  const [formData, setFormData] = useState(initialForm);
  const [openQuestion, setOpenQuestion] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback({ type: "", message: "" });

    try {
      const ticket = await supportService.create(formData);
      setFeedback({
        type: "success",
        message: `Your request was submitted successfully. Ticket: ${ticket.ticketNumber}`,
      });
      setFormData(initialForm);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || `Unable to submit the request. Please email ${contact.email}.`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="site-container bg-background py-5 text-text md:py-8">
      <nav className="page-breadcrumb" aria-label="Breadcrumb">
        <Link to={ROUTES.HOME} className="transition-colors hover:text-warning">Home</Link>
        <Icon name="chevron-right" size={3} className="cursor-default" />
        <span className="font-medium text-text">Help &amp; Support</span>
      </nav>

      <section className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-warning/20 via-background-secondary to-background px-5 py-6 sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-warning/10 blur-3xl" />
        <div className="relative max-w-3xl">
          <span className="mb-2 inline-flex items-center gap-2 rounded-full bg-warning/10 px-2.5 py-0.5 text-[12px] font-semibold text-warning">
            <Icon name="question" size={3.5} className="cursor-default" />
            {COMPANY_INFO.name} Support
          </span>
          <h1 className="page-title">
            How can we help?
          </h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-6 text-text-secondary sm:text-sm">
            Get assistance with orders, products, payments, accounts, technical issues,
            installation, or after-sales service from {COMPANY_INFO.name}.
          </p>
        </div>
      </section>

      <section className="mb-10 grid gap-4 sm:grid-cols-3" aria-label="Support contact options">
        {supportChannels.map((channel) => (
          <a
            key={channel.label}
            href={channel.href}
            target={channel.external ? "_blank" : undefined}
            rel={channel.external ? "noreferrer" : undefined}
            className="group flex min-w-0 items-start gap-4 rounded-2xl bg-background-secondary p-5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-warning-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning transition-colors group-hover:bg-warning group-hover:text-white">
              <Icon name={channel.icon} size={5} className="cursor-default" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-semibold uppercase tracking-wide text-text-muted">{channel.label}</span>
              <span className="mt-1 block break-words text-sm font-bold text-text group-hover:text-warning">{channel.value}</span>
            </span>
          </a>
        ))}
      </section>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.8fr)]">
        <section className="rounded-2xl bg-background-secondary p-5 sm:p-8" aria-labelledby="support-form-title">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-warning">Support ticket</p>
            <h2 id="support-form-title" className="mt-1 text-2xl font-bold text-text-primary">Tell us what you need</h2>
            <p className="mt-2 text-sm text-text-secondary">Provide enough detail for the support team to understand and route your request.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="support-name" className="mb-1.5 block text-xs font-semibold text-text-primary">Name</label>
                <input id="support-name" name="name" value={formData.name} onChange={handleChange} required minLength={2} autoComplete="name" placeholder="Your full name" className={fieldClass} />
              </div>
              <div>
                <label htmlFor="support-email" className="mb-1.5 block text-xs font-semibold text-text-primary">Email</label>
                <input id="support-email" type="email" name="email" value={formData.email} onChange={handleChange} required autoComplete="email" placeholder="name@example.com" className={fieldClass} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="support-phone" className="mb-1.5 block text-xs font-semibold text-text-primary">Phone <span className="font-normal text-text-muted">(optional)</span></label>
                <input id="support-phone" type="tel" name="phone" value={formData.phone} onChange={handleChange} autoComplete="tel" placeholder="Your phone number" className={fieldClass} />
              </div>
              <div>
                <label htmlFor="support-category" className="mb-1.5 block text-xs font-semibold text-text-primary">Support type</label>
                <select id="support-category" name="category" value={formData.category} onChange={handleChange} className={fieldClass}>
                  <option value="order">Order support</option>
                  <option value="product">Product information</option>
                  <option value="payment">Payment support</option>
                  <option value="account">Account support</option>
                  <option value="technical">Technical support</option>
                  <option value="other">Other inquiry</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="support-subject" className="mb-1.5 block text-xs font-semibold text-text-primary">Subject</label>
              <input id="support-subject" name="subject" value={formData.subject} onChange={handleChange} required minLength={3} placeholder="Brief summary of your issue" className={fieldClass} />
            </div>

            <div>
              <label htmlFor="support-message" className="mb-1.5 block text-xs font-semibold text-text-primary">Message</label>
              <textarea id="support-message" name="message" rows={6} value={formData.message} onChange={handleChange} required minLength={10} placeholder="Include order numbers, product names, or technical details when relevant..." className={`${fieldClass} resize-y`} />
            </div>

            {feedback.message && (
              <div role="status" className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${feedback.type === "success" ? "bg-success/10 text-success" : "bg-red-500/10 text-red-400"}`}>
                <Icon name={feedback.type === "success" ? "success" : "error"} size={5} className="mt-0.5 shrink-0 cursor-default" />
                <span>{feedback.message}</span>
              </div>
            )}

            <Button type="submit" variant="solid" size="lg" disabled={submitting} className="w-full justify-center rounded-xl bg-warning px-6 py-3 font-semibold text-white transition-colors hover:bg-warning/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
              {submitting ? "Submitting..." : "Submit support request"}
              {!submitting && <Icon name="arrow-right" size={4} className="cursor-default" />}
            </Button>
          </form>
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl bg-background-secondary p-5 sm:p-6" aria-labelledby="faq-title">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-warning">Common questions</p>
            <h2 id="faq-title" className="mt-1 text-2xl font-bold text-text-primary">Quick answers</h2>
            <div className="mt-5 divide-y divide-border">
              {frequentlyAskedQuestions.map((item, index) => {
                const isOpen = openQuestion === index;
                return (
                  <div key={item.question}>
                    <button type="button" onClick={() => setOpenQuestion(isOpen ? -1 : index)} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-semibold text-text-primary transition-colors hover:text-warning focus-visible:outline-none focus-visible:text-warning">
                      {item.question}
                      <Icon name="chevron-down" size={4} className={`shrink-0 cursor-default transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    <div className={`grid transition-[grid-template-rows,opacity] duration-200 ${isOpen ? "grid-rows-[1fr] pb-4 opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                      <p className="overflow-hidden text-sm leading-6 text-text-secondary">{item.answer}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl bg-warning-bg p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <Icon name="location" size={6} className="mt-0.5 shrink-0 cursor-default text-warning" />
              <div>
                <h2 className="font-bold text-text-primary">Corporate office</h2>
                <address className="mt-2 text-sm not-italic leading-6 text-text-secondary">{contact.corporateOffice}</address>
                <Link to={ROUTES.CONTACT} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-warning hover:underline">
                  View full contact information
                  <Icon name="arrow-right" size={4} className="cursor-default" />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;
