// src/pages/PrivacyPolicy/PrivacyPolicy.jsx
import React from "react";
import { Link } from "react-router-dom";
import Icon from "../../components/common/Icon/Icon";

export const PrivacyPolicy = () => {
  return (
    <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 bg-background text-text'>
      {/* Breadcrumb Navigation */}
      <nav className='flex items-center gap-2 text-xs sm:text-sm text-text-muted mb-6'>
        <Link to='/' className='hover:text-warning transition-colors'>
          Home
        </Link>
        <Icon name='chevron-right' size={3} />
        <span className='text-text font-medium'>Privacy Policy</span>
      </nav>

      {/* Page Header */}
      <div className='mb-10 pb-6 border-b border-border'>
        <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-warning/10 border border-warning/30 text-warning text-xs font-semibold mb-3'>
          <span>🔒 Legal & Security</span>
        </div>
        <h1 className='text-3xl sm:text-4xl font-extrabold text-text tracking-tight mb-3'>
          Privacy Policy
        </h1>
        <p className='text-sm text-text-muted'>
          Last updated:{" "}
          <span className='font-semibold text-text'>July 28, 2026</span>
        </p>
      </div>

      {/* Policy Content Sections */}
      <div className='space-y-8 text-sm sm:text-base leading-relaxed text-text-muted'>
        {/* Section 1 */}
        <section className='bg-background-secondary p-6 rounded-2xl border border-border shadow-sm'>
          <h2 className='text-lg sm:text-xl font-bold text-text mb-3 flex items-center gap-2'>
            <span className='text-warning'>01.</span> Introduction
          </h2>
          <p>
            Welcome to Robotics & Drone Hub. We respect your privacy and are
            committed to protecting your personal data. This privacy policy will
            inform you as to how we look after your personal data when you visit
            our website (regardless of where you visit it from) and tell you
            about your privacy rights and how the law protects you.
          </p>
        </section>

        {/* Section 2 */}
        <section className='bg-background-secondary p-6 rounded-2xl border border-border shadow-sm'>
          <h2 className='text-lg sm:text-xl font-bold text-text mb-3 flex items-center gap-2'>
            <span className='text-warning'>02.</span> Data We Collect About You
          </h2>
          <p className='mb-3'>
            Personal data, or personal information, means any information about
            an individual from which that person can be identified. We may
            collect, use, store and transfer different kinds of personal data
            about you which we have grouped together as follows:
          </p>
          <ul className='list-disc pl-5 space-y-2'>
            <li>
              <strong className='text-text'>Identity Data:</strong> Includes
              first name, last name, username or similar identifier.
            </li>
            <li>
              <strong className='text-text'>Contact Data:</strong> Includes
              billing address, delivery address, email address, and telephone
              numbers.
            </li>
            <li>
              <strong className='text-text'>Financial Data:</strong> Includes
              bank account and payment card details (processed securely via
              encrypted gateways).
            </li>
            <li>
              <strong className='text-text'>Transaction Data:</strong> Includes
              details about payments to and from you and other details of
              products you have purchased from us.
            </li>
            <li>
              <strong className='text-text'>Technical Data:</strong> Includes
              internet protocol (IP) address, browser type and version, time
              zone setting, and operating system.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className='bg-background-secondary p-6 rounded-2xl border border-border shadow-sm'>
          <h2 className='text-lg sm:text-xl font-bold text-text mb-3 flex items-center gap-2'>
            <span className='text-warning'>03.</span> How We Use Your Personal
            Data
          </h2>
          <p className='mb-3'>
            We will only use your personal data when the law allows us to. Most
            commonly, we will use your personal data in the following
            circumstances:
          </p>
          <ul className='list-disc pl-5 space-y-2'>
            <li>
              Where we need to perform the contract we are about to enter into
              or have entered into with you (e.g., fulfilling drone component
              orders).
            </li>
            <li>
              Where it is necessary for our legitimate interests and your
              interests do not override those rights.
            </li>
            <li>Where we need to comply with a legal obligation.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className='bg-background-secondary p-6 rounded-2xl border border-border shadow-sm'>
          <h2 className='text-lg sm:text-xl font-bold text-text mb-3 flex items-center gap-2'>
            <span className='text-warning'>04.</span> Data Security
          </h2>
          <p>
            We have put in place appropriate security measures to prevent your
            personal data from being accidentally lost, used, or accessed in an
            unauthorized way, altered, or disclosed. In addition, we limit
            access to your personal data to those employees, agents,
            contractors, and other third parties who have a business need to
            know.
          </p>
        </section>

        {/* Section 5 */}
        <section className='bg-background-secondary p-6 rounded-2xl border border-border shadow-sm'>
          <h2 className='text-lg sm:text-xl font-bold text-text mb-3 flex items-center gap-2'>
            <span className='text-warning'>05.</span> Contact Us
          </h2>
          <p className='mb-2'>
            If you have any questions about this privacy policy or our privacy
            practices, please contact us at:
          </p>
          <p className='text-text font-medium'>
            Email: privacy@roboticsdronehub.com
            <br />
            Address: 123/A Robotics Avenue, Science Lab Road, Dhaka-1205,
            Bangladesh
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
