// src/routes/RouteErrorBoundary.jsx
import React from "react";
import { useRouteError, Link, isRouteErrorResponse } from "react-router-dom";
import { Button } from "../components/common/Button/Button";
import { Icon } from "../components/common/Icon/Icon";

export const RouteErrorBoundary = () => {
  const error = useRouteError();
  let errorMessage = "Something went wrong";
  let errorStatus = 500;

  if (isRouteErrorResponse(error)) {
    errorStatus = error.status;
    errorMessage =
      error.statusText || error.data?.message || "An error occurred";
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  const is404 = errorStatus === 404;

  return (
    <div className='min-h-[60vh] flex items-center justify-center px-4'>
      <div className='text-center max-w-md'>
        {is404 ? (
          //   <Icon
          //     name='search'
          //     size={16}
          //     className='text-gray-400 mx-auto mb-6'
          //   />
          <p>H</p>
        ) : (
          //   <Icon name='close' size={16} className='text-red-400 mx-auto mb-6' />
          <p>i</p>
        )}

        <h1 className='text-6xl font-bold text-gray-900 dark:text-white mb-4'>
          {errorStatus}
        </h1>

        <h2 className='text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4'>
          {is404 ? "Page Not Found" : "Oops! Something went wrong"}
        </h2>

        <p className='text-gray-500 dark:text-gray-400 mb-8'>
          {is404
            ? "The page you're looking for doesn't exist or has been moved."
            : errorMessage || "Please try again later."}
        </p>

        <div className='flex flex-col sm:flex-row gap-4 justify-center'>
          {!is404 && (
            <Button variant='outline' onClick={() => window.location.reload()}>
              <Icon name='refresh' size={5} className='mr-2' />
              Try Again
            </Button>
          )}
          <Link to='/'>
            <Button variant='primary'>
              <Icon name='home' size={5} className='mr-2' />
              Go Back Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
