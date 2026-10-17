// src/components/layout/Footer/WhatsAppQR.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Icon } from "../../common/Icon/Icon";
import { Button } from "../../common/Button/Button";
import { cn } from "../../../utils/cn";

export const WhatsAppQR = () => {
  const [isHovered, setIsHovered] = useState(false);

  const qrCodeData = {
    phone: "+8801234567890",
    message: "Hi GBLrcDrone! I have a question about your products.",
  };

  const handleWhatsAppClick = () => {
    const url = `https://wa.me/${qrCodeData.phone}?text=${encodeURIComponent(qrCodeData.message)}`;
    window.open(url, "_blank");
  };

  return (
    <motion.div
      className='relative'
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <motion.div
        className={cn(
          "bg-background-secondary border border-border rounded-xl p-4 transition-all duration-300",
          isHovered && "border-warning shadow-lg shadow-warning/20",
        )}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <div className='flex items-center gap-3 mb-3'>
          <div className='p-2 bg-success/20 rounded-lg'>
            <Icon name='phone' size={6} className='text-success' />
          </div>
          <div>
            <p className='text-sm font-medium text-text-primary'>WhatsApp</p>
            <p className='text-xs text-text-muted'>Quick support</p>
          </div>
        </div>

        {/* QR Code Placeholder */}
        <motion.div
          className='relative w-32 h-32 mx-auto bg-background rounded-lg overflow-hidden border border-border'
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
        >
          <div className='absolute inset-0 grid grid-cols-7 gap-0.5 p-2'>
            {Array.from({ length: 49 }).map((_, i) => {
              const isFilled = Math.random() > 0.5;
              return (
                <motion.div
                  key={i}
                  className={cn(
                    "rounded-sm transition-all duration-300",
                    isFilled ? "bg-text-primary" : "bg-background-tertiary",
                  )}
                  animate={{
                    opacity: isFilled ? [0.8, 1, 0.8] : [0.2, 0.3, 0.2],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.02,
                    ease: "easeInOut",
                  }}
                />
              );
            })}
          </div>

          <div className='absolute inset-0 flex items-center justify-center'>
            <div className='p-1.5 bg-background rounded-md'>
              <Icon name='phone' size={4} className='text-success' />
            </div>
          </div>

          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className='absolute inset-0 bg-black/50 flex items-center justify-center'
            >
              <Button
                variant='success'
                size='sm'
                leftIcon='phone'
                onClick={handleWhatsAppClick}
                className='text-xs'
              >
                Chat Now
              </Button>
            </motion.div>
          )}
        </motion.div>

        <p className='text-center text-xs text-text-muted mt-3'>
          Scan to chat with us on WhatsApp
        </p>

        <Button
          variant='success'
          size='sm'
          fullWidth
          leftIcon='phone'
          onClick={handleWhatsAppClick}
          className='mt-3'
        >
          +880 1234-567890
        </Button>
      </motion.div>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className='absolute -top-2 -right-2'
      >
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className='px-2 py-0.5 bg-success rounded-full text-xs font-medium text-white'
        >
          Live
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default WhatsAppQR;
