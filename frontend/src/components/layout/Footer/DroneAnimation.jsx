// src/components/layout/Footer/DroneAnimation.jsx
import React from "react";
import { motion } from "framer-motion";
import droneImage from "../../../../public/camera-drone.png";
export const DroneAnimation = () => {
  return (
    <div
      className='absolute right-0 bottom-0 w-48 h-48 lg:w-64 lg:h-64 opacity-10 pointer-events-none'
      style={{ zIndex: -1 }}>
      <img
        src={droneImage}
        alt='Drone'
        className='w-full h-full object-contain'
      />
    </div>
  );
};

export default DroneAnimation;
