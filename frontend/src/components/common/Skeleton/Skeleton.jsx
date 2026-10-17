import React, { useState } from "react";
import { cn } from "../../../utils/cn";

/** Shimmer skeleton used while lazy images / product grids load. */
export const Skeleton = ({ className = "" }) => (
  <div className={cn("animate-pulse rounded-xl bg-background-tertiary/80", className)} />
);

export const ProductCardSkeleton = () => (
  <div className="overflow-hidden rounded-2xl border border-border bg-background">
    <Skeleton className="h-48 w-full rounded-none sm:h-52" />
    <div className="space-y-3 p-4">
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
    </div>
  </div>
);

/** Image with lazy load + scale-in / skeleton while loading. */
export const LazyImage = ({
  src,
  alt = "",
  className = "",
  wrapperClassName = "",
  onLoad,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className={cn("relative overflow-hidden bg-background-secondary", wrapperClassName)}>
      {!loaded && !failed ? <Skeleton className="absolute inset-0 rounded-none" /> : null}
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={(event) => {
            setLoaded(true);
            onLoad?.(event);
          }}
          onError={() => setFailed(true)}
          className={cn(
            "h-full w-full object-cover transition-all duration-500",
            loaded ? "scale-100 opacity-100" : "scale-105 opacity-0",
            className,
          )}
        />
      ) : null}
    </div>
  );
};

export default Skeleton;
