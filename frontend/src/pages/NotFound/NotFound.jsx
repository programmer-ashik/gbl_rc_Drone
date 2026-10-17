// src/pages/NotFound/NotFound.jsx
import React from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../constants";
import Icon from "../../components/common/Icon/Icon";
import Button from "../../components/common/Button/Button";

const NotFound = () => {
  return (
    <div className='min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 bg-background text-text'>
      <div className='w-full max-w-md bg-background-secondary border border-border p-8 sm:p-12 rounded-3xl shadow-lg text-center flex flex-col items-center'>
        {/* Error Icon / Badge */}
        <div className='inline-flex items-center justify-center bg-warning/10 text-warning p-4 rounded-2xl mb-6 shadow-sm'>
          <Icon name='alert-triangle' size={8} />
        </div>

        {/* 404 Heading */}
        <h1 className='text-6xl sm:text-7xl font-extrabold text-text tracking-tight mb-2'>
          404
        </h1>

        <h2 className='text-xl sm:text-2xl font-bold text-text mb-3'>
          Page Not Found
        </h2>

        <p className='text-xs sm:text-sm text-text-muted mb-8 leading-relaxed'>
          Oops! The drone component, documentation, or page you are looking for
          might have been moved or doesn't exist.
        </p>

        {/* Action Buttons */}
        <div className='flex flex-col sm:flex-row items-center gap-3 w-full'>
          <Link to={ROUTES.HOME} className='w-full'>
            <Button
              variant='solid'
              size='lg'
              className='w-full bg-warning text-white hover:bg-warning/90 font-medium py-3 rounded-xl shadow-lg shadow-warning/20 transition-all text-xs sm:text-sm flex items-center justify-center gap-2'
            >
              <Icon name='home' size={4} />
              <span>Back to Home</span>
            </Button>
          </Link>

          <Link to={ROUTES.PRODUCTS || "/products"} className='w-full'>
            <Button
              variant='outline'
              size='lg'
              className='w-full border-border bg-background hover:bg-background-secondary text-text font-medium py-3 rounded-xl transition-all text-xs sm:text-sm flex items-center justify-center gap-2'
            >
              <Icon name='shopping-bag' size={4} />
              <span>Browse Products</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
