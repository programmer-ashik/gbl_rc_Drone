// src/components/layout/Footer/NewsletterSection.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "../../common/Button/Button";
import { Icon } from "../../common/Icon/Icon";
import { cn } from "../../../utils/cn";

export const NewsletterSection = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSuccess(true);
    setEmail("");
    setTimeout(() => setIsSuccess(false), 3000);
  };

  return (
    <motion.div
      className='relative mt-12 pt-8 border-t border-border'
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className='max-w-2xl mx-auto text-center'>
        <motion.h3
          className='text-xl font-semibold text-text-primary mb-2'
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Subscribe to Our Newsletter
        </motion.h3>

        <motion.p
          className='text-text-secondary text-sm mb-6'
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Get the latest updates on new products, special offers, and exclusive
          deals.
        </motion.p>

        <motion.form
          onSubmit={handleSubmit}
          className='flex flex-col sm:flex-row gap-3 max-w-md mx-auto'
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className='relative flex-1'>
            <input
              type='email'
              placeholder='Enter your email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className='w-full px-4 py-3 bg-background-secondary border border-border rounded-lg text-text placeholder-text-muted focus:outline-none focus:border-warning focus:ring-2 focus:ring-warning/20 transition-all duration-300'
              disabled={isSubmitting}
            />
            {isSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className='absolute right-3 top-1/2 -translate-y-1/2'
              >
                <Icon name='check' size={5} className='text-success' />
              </motion.div>
            )}
          </div>

          <Button
            type='submit'
            variant='warning'
            size='md'
            loading={isSubmitting}
            disabled={isSubmitting || !email}
            className='sm:flex-shrink-0'
          >
            {isSubmitting ? "Subscribing..." : "Subscribe"}
          </Button>
        </motion.form>

        {isSuccess && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className='text-success text-sm mt-3'
          >
            ✓ Successfully subscribed to our newsletter!
          </motion.p>
        )}

        <motion.p
          className='text-xs text-text-muted mt-4'
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          We respect your privacy. Unsubscribe at any time.
        </motion.p>
      </div>
    </motion.div>
  );
};

export default NewsletterSection;
