import React from 'react';
import { Helmet } from 'react-helmet';

const Home = () => {
  const pageUrl = 'https://lic-neemuch.onrender.com';
  const metaDescription = 'Jitendra Patidar, LIC Development Officer in Neemuch, offers trusted life insurance and financial planning.';

  return (
    <>
      <Helmet>
        <title>LIC Neemuch: How Jitendra Patidar Ensures Your Secure Life</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={pageUrl} />
      </Helmet>
      {/* No content since SSR handles the homepage */}
    </>
  );
};

export default Home;
