import React from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../constants";
import Icon from "../../components/common/Icon/Icon";
import { Button } from "../../components/common/Button/Button";
import {
  COMPANY_INFO,
  COMPLETED_LED_PROJECTS,
  CORE_SERVICES,
  DGFI_PROJECT_SCOPE,
  FLAGSHIP_SOLUTIONS,
  MISSION,
  NOTABLE_CLIENTS,
  VISION,
} from "../../data/companyInfo";

const SectionHeading = ({ eyebrow, title, description }) => (
  <div className="max-w-3xl mb-8">
    <p className="text-xs font-bold uppercase tracking-[0.2em] text-warning mb-2">
      {eyebrow}
    </p>
    <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
      {title}
    </h2>
    {description && (
      <p className="mt-3 text-sm sm:text-base text-text-secondary leading-relaxed">
        {description}
      </p>
    )}
  </div>
);

export const About = () => {
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
        <span className="font-medium text-text">About Us</span>
      </nav>

      <section className="relative mb-10 overflow-hidden rounded-2xl border border-warning/30 bg-gradient-to-br from-warning/15 via-background-secondary to-background p-5 sm:p-8">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-warning/10 blur-3xl" />
        <div className="relative max-w-4xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-warning px-3 py-1 text-[12px] font-bold text-white shadow-sm">
            <Icon name="building" size={3.5} className="cursor-default" />
            Since {COMPANY_INFO.established}
          </div>
          <h1 className="page-title mb-3">
            {COMPANY_INFO.name}
          </h1>
          <p className="mb-2 max-w-3xl text-[15px] font-semibold text-text-primary sm:text-base">
            High-performance Audio-Visual, Communication, Surveillance and
            Integrated Technology Solutions.
          </p>
          <p className="max-w-3xl text-[13px] leading-relaxed text-text-secondary sm:text-sm">
            We combine cutting-edge technology, innovative design and
            professional engineering expertise to deliver reliable,
            future-ready systems for government organizations, defense
            establishments, educational institutions, commercial facilities,
            auditoriums, command centers and critical infrastructure projects.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8 max-w-3xl">
            {[
              { value: "2015", label: "Year established" },
              { value: "BDT 15 Crore", label: "3-year average turnover" },
              { value: "15", label: "Team members" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-border bg-background/80 px-5 py-4 backdrop-blur-sm"
              >
                <p className="text-xl font-extrabold text-warning">{stat.value}</p>
                <p className="text-xs text-text-muted mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-16">
        <SectionHeading
          eyebrow="Company overview"
          title="Technology integration built for demanding environments"
        />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-4 text-sm sm:text-base text-text-secondary leading-relaxed">
            <p>
              From corporate boardrooms and conference facilities to
              large-scale auditoriums, command-and-control centers, broadcast
              studios, museums and mission-critical defense installations,
              GBLrcDrone provides turnkey solutions that enhance
              communication, collaboration, security and operational
              efficiency.
            </p>
            <p>
              The company has successfully delivered projects for government
              ministries, defense organizations and strategic institutions. We
              continue to contribute to Bangladesh&apos;s technological
              advancement through innovative and sustainable solutions.
            </p>
          </div>
          <div className="lg:col-span-5 rounded-2xl border border-border bg-background-secondary p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-xl bg-warning/10 p-3 text-warning">
                <Icon name="briefcase" size={6} className="cursor-default" />
              </div>
              <div>
                <p className="font-bold text-text-primary">Turnkey delivery</p>
                <p className="text-xs text-text-muted">One accountable partner</p>
              </div>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              End-to-end project management, system design, installation,
              testing, commissioning, user training, preventive maintenance and
              after-sales support.
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        <article className="bg-background-secondary p-7 sm:p-8 rounded-2xl border border-border shadow-sm">
          <div className="bg-warning/10 text-warning p-3.5 rounded-xl w-fit mb-4">
            <Icon name="flag" size={6} className="cursor-default" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-3">
            Our Mission
          </h2>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
            {MISSION}
          </p>
        </article>

        <article className="bg-background-secondary p-7 sm:p-8 rounded-2xl border border-border shadow-sm">
          <div className="bg-warning/10 text-warning p-3.5 rounded-xl w-fit mb-4">
            <Icon name="eye" size={6} className="cursor-default" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-3">
            Our Vision
          </h2>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
            {VISION}
          </p>
        </article>
      </section>

      <section className="mb-16">
        <SectionHeading
          eyebrow="Core services"
          title="Integrated solutions from design to commissioning"
          description="Specialist engineering and implementation across AV, sound, lighting, security, communication and industrial automation."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {CORE_SERVICES.map((service) => (
            <article
              key={service.title}
              className="bg-background-secondary border border-border rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="rounded-xl bg-warning/10 p-3 text-warning">
                  <Icon name={service.icon} size={6} className="cursor-default" />
                </div>
                <h3 className="font-bold text-text-primary leading-snug">
                  {service.title}
                </h3>
              </div>
              <ul className="space-y-2.5">
                {service.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-text-secondary"
                  >
                    <Icon
                      name="check"
                      size={4}
                      className="text-warning mt-0.5 flex-shrink-0 cursor-default"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-16 rounded-3xl border border-border bg-background-secondary p-7 sm:p-10">
        <SectionHeading
          eyebrow="Flagship solutions"
          title="Systems engineered around the mission"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
          {FLAGSHIP_SOLUTIONS.map((solution) => (
            <div key={solution} className="flex items-start gap-3">
              <span className="mt-2 h-2 w-2 rounded-full bg-warning flex-shrink-0" />
              <p className="text-sm text-text-secondary leading-relaxed">
                {solution}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <SectionHeading
          eyebrow="Trusted organizations"
          title="Notable clients"
          description="Experience supporting national, government, defense, research and public institutions across Bangladesh."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {NOTABLE_CLIENTS.map((group) => (
            <article
              key={group.category}
              className="rounded-2xl border border-border bg-background-secondary p-6"
            >
              <h3 className="font-bold text-text-primary mb-4">{group.category}</h3>
              <ul className="space-y-3">
                {group.clients.map((client) => (
                  <li
                    key={client}
                    className="flex items-start gap-2.5 text-sm text-text-secondary leading-relaxed"
                  >
                    <Icon
                      name="building"
                      size={4}
                      className="text-warning mt-0.5 flex-shrink-0 cursor-default"
                    />
                    <span>{client}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <SectionHeading
          eyebrow="Delivery record"
          title="Major completed LED display projects"
        />
        <div className="max-w-full overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead className="bg-background-secondary">
              <tr>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-text-primary">
                  Authority
                </th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-text-primary">
                  Display type
                </th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-text-primary text-center">
                  Quantity
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {COMPLETED_LED_PROJECTS.map((project) => (
                <tr key={project.authority} className="bg-background">
                  <td className="px-5 py-4 text-sm text-text-primary font-medium leading-relaxed">
                    {project.authority}
                  </td>
                  <td className="px-5 py-4 text-sm text-text-secondary whitespace-nowrap">
                    {project.displayType}
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-warning text-center">
                    {project.quantity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-16 rounded-3xl border border-warning/30 bg-gradient-to-br from-warning/15 to-background-secondary p-7 sm:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-warning mb-2">
              Ongoing major project
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight mb-4">
              DGFI — 247-inch Samsung COB LED Display Project
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              This high-profile engagement demonstrates GBLrcDrone&apos;s
              capability to execute large-scale, mission-critical display and
              communication projects for strategic national organizations.
            </p>
          </div>
          <div className="lg:col-span-7 rounded-2xl border border-border bg-background/80 p-6">
            <h3 className="font-bold text-text-primary mb-4">Project scope</h3>
            <ul className="space-y-3">
              {DGFI_PROJECT_SCOPE.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-sm text-text-secondary"
                >
                  <Icon
                    name="success"
                    size={5}
                    className="text-warning mt-0.5 flex-shrink-0 cursor-default"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mb-16">
        <SectionHeading eyebrow="Corporate information" title="Legal & financial profile" />
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {COMPANY_INFO.legal.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-border bg-background-secondary p-5"
            >
              <dt className="text-xs uppercase tracking-wider text-text-muted mb-2">
                {item.label}
              </dt>
              <dd className="font-bold text-text-primary break-words">{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="bg-background-secondary border border-border rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary mb-3">
          Planning a mission-critical technology project?
        </h2>
        <p className="text-sm sm:text-base text-text-secondary max-w-2xl mb-6">
          Talk to GBLrcDrone about your AV, communication, surveillance,
          security or automation requirements.
        </p>
        <Link to={ROUTES.CONTACT}>
          <Button
            variant="solid"
            size="lg"
            className="bg-warning text-white hover:bg-warning/90 font-medium px-8 py-3.5 rounded-xl shadow-lg shadow-warning/20"
          >
            Contact Our Team
          </Button>
        </Link>
      </section>
    </div>
  );
};

export default About;
