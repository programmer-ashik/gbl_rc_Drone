import React from 'react';
import { Helmet } from 'react-helmet-async';

const SITE = 'GBLrcDrone';

export const SeoHead = ({
  title,
  description,
  canonical,
  image,
  type = 'website',
  jsonLd,
  noIndex = false,
}) => {
  const fullTitle = title ? (title.includes(SITE) ? title : `${title}`) : SITE;
  const desc = description || 'Shop FPV drones, RC parts, and robotics kits online.';
  const url = canonical || (typeof window !== 'undefined' ? window.location.href : '');

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name='description' content={desc} />
      {noIndex ? <meta name='robots' content='noindex,nofollow' /> : <meta name='robots' content='index,follow' />}
      {url ? <link rel='canonical' href={url} /> : null}
      <meta property='og:type' content={type} />
      <meta property='og:title' content={fullTitle} />
      <meta property='og:description' content={desc} />
      {url ? <meta property='og:url' content={url} /> : null}
      {image ? <meta property='og:image' content={image} /> : null}
      <meta name='twitter:card' content={image ? 'summary_large_image' : 'summary'} />
      <meta name='twitter:title' content={fullTitle} />
      <meta name='twitter:description' content={desc} />
      {image ? <meta name='twitter:image' content={image} /> : null}
      {jsonLd ? <script type='application/ld+json'>{JSON.stringify(jsonLd)}</script> : null}
    </Helmet>
  );
};

export default SeoHead;
