const express = require('express');
const mongoose = require('mongoose');
const LICReview = require('./models/LICReview');
const LICRating = require('./models/LICRating');

const router = express.Router();

const escapeHTML = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const fetchRatingsAndReviews = async () => {
  try {
    const ratings = await LICRating.find();
    const reviews = await LICReview.find().sort({ createdAt: -1 }).limit(5); // Increased to 5 for more visibility
    const validRatings = ratings.filter(r => r.rating >= 1 && r.rating <= 5);
    const averageRating = validRatings.length
      ? validRatings.reduce((sum, r) => sum + r.rating, 0) / validRatings.length
      : 0;
    return {
      averageRating: averageRating.toFixed(1),
      ratingCount: validRatings.length,
      reviews: reviews.map(review => ({
        username: review.username,
        comment: review.comment,
        createdAt: review.createdAt,
      })),
    };
  } catch (error) {
    console.error('[fetchRatingsAndReviews] Error:', error.stack);
    return { averageRating: 0, ratingCount: 0, reviews: [] };
  }
};

const renderStars = (rating) => {
  const starCount = Math.round(rating);
  let stars = '';
  for (let i = 0; i < 5; i++) {
    stars += i < starCount ? '★' : '☆';
  }
  return stars;
};

router.get('/', async (req, res) => {
  console.log('SSR route hit for / at', new Date().toISOString());

  try {
    const { averageRating, ratingCount, reviews } = await fetchRatingsAndReviews();
    const pageUrl = 'https://lic-neemuch.onrender.com/';
    const metaTitle = 'LIC Neemuch: Life Insurance by Jitendra Patidar';
    const metaDescription = `Trusted life insurance in Neemuch by Jitendra Patidar, LIC Development Officer. Rated ${averageRating}/5 by ${ratingCount} clients.`; // 134 chars
    const metaImage = 'https://mys3resources.s3.ap-south-1.amazonaws.com/LIC/titleImage_LICBlo.jpeg';

    // Structured Data
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'LIC Neemuch',
      description: metaDescription,
      url: pageUrl,
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Vikas Nagar, Scheme No. 14-3, Neemuch Chawni',
        addressLocality: 'Neemuch',
        addressRegion: 'Madhya Pradesh',
        postalCode: '458441',
        addressCountry: 'IN',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 24.4716, // Approximate coordinates for Neemuch
        longitude: 74.8742,
      },
      telephone: '+917987235207',
      openingHours: 'Mo-Fr 09:00-17:00',
      image: metaImage,
      aggregateRating: ratingCount > 0 ? {
        '@type': 'AggregateRating',
        ratingValue: averageRating,
        reviewCount: ratingCount,
        bestRating: '5',
        worstRating: '1',
      } : undefined,
      review: reviews.map(review => ({
        '@type': 'Review',
        author: { '@type': 'Person', name: review.username },
        datePublished: new Date(review.createdAt).toISOString().split('T')[0],
        reviewBody: review.comment,
      })),
    };

    const faqStructuredData = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What types of life insurance plans does LIC Neemuch offer?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'LIC Neemuch offers a variety of life insurance plans including term insurance, endowment plans, ULIPs, and pension plans tailored to your financial goals.',
          },
        },
        {
          '@type': 'Question',
          name: 'How can I contact Jitendra Patidar for insurance advice?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'You can contact Jitendra Patidar at +91 7987235207 or visit our office at Vikas Nagar, Scheme No. 14-3, Neemuch Chawni, Neemuch, Madhya Pradesh 458441.',
          },
        },
        {
          '@type': 'Question',
          name: 'Why choose LIC Neemuch for financial planning?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'LIC Neemuch, led by Jitendra Patidar, provides personalized financial planning with trusted LIC products, ensuring security and growth for your future.',
          },
        },
      ],
    };

    const htmlContent = `
      <header class="header" role="banner">
        <nav class="navbar" aria-label="Main navigation">
          <div class="navbar-brand">
            <a href="/" class="nav-logo" aria-label="LIC Neemuch Homepage">
              <span>LIC Neemuch</span>
            </a>
          </div>
          <div class="nav-menu">
            <a href="/" class="nav-link active" aria-label="Homepage">Home</a>
            <a href="/reviews" class="nav-link" aria-label="Reviews">Reviews</a>
            <a href="/join" class="nav-link" aria-label="Join as Agent">Join as Agent</a>
            <a href="/services" class="nav-link" aria-label="Services">Services</a>
            <a href="/about" class="nav-link" aria-label="About">About</a>
          </div>
        </nav>
        <div class="hero-section">
          <div class="hero-content">
            <h1>LIC Neemuch: Secure Your Future with Jitendra Patidar</h1>
            <p class="hero-subtitle">
              Trusted Life Insurance and Financial Planning in Neemuch, Madhya Pradesh
            </p>
            ${ratingCount > 0 && averageRating >= 1 ? `
              <div class="hero-rating" aria-label="Average rating ${averageRating} out of 5 based on ${ratingCount} reviews">
                <span class="stars" aria-hidden="true">${renderStars(averageRating)}</span>
                <span class="rating-text">${averageRating}/5 (${ratingCount} reviews)</span>
              </div>
            ` : ''}
            <a href="tel:+917987235207" class="cta-button" aria-label="Call Jitendra Patidar">Contact Now</a>
          </div>
          <div class="hero-image">
            <img src="${metaImage}" alt="Jitendra Patidar, LIC Development Officer in Neemuch" loading="lazy">
          </div>
        </div>
      </header>
      <div class="container">
        <main role="main">
          <article aria-labelledby="welcome-heading">
            <section class="section welcome-section" aria-labelledby="welcome-heading">
              <h2 id="welcome-heading">Welcome to LIC Neemuch</h2>
              <p lang="en">
                At <strong>LIC Neemuch</strong>, we are committed to securing your future through reliable life insurance and expert financial planning. Led by Development Officer <strong>Jitendra Patidar</strong>, our team provides personalized solutions to meet your financial goals in Neemuch, Madhya Pradesh.
              </p>
              <p lang="hi">
                <strong>नीमच में एलआईसी</strong>, विकास अधिकारी <strong>जीतेंद्र पाटीदार</strong> के नेतृत्व में, आपके सुरक्षित जीवन को सुनिश्चित करता है। हम नीमच, मध्य प्रदेश में आपके वित्तीय लक्ष्यों को पूरा करने के लिए वैयक्तिकृत समाधान प्रदान करते हैं।
              </p>
            </section>
          </article>

          <article aria-labelledby="services-heading">
            <section class="section services-section" aria-labelledby="services-heading">
              <h2 id="services-heading">Our Life Insurance Services in Neemuch</h2>
              <p>
                LIC Neemuch offers a wide range of life insurance and financial planning services tailored to your needs. Whether you're looking for term insurance, endowment plans, ULIPs, or pension plans, Jitendra Patidar ensures you get the best LIC products to secure your family’s future.
              </p>
              <div class="services-grid">
                <div class="service-card">
                  <h3>Term Insurance</h3>
                  <p>Protect your loved ones with affordable and high-coverage term plans.</p>
                </div>
                <div class="service-card">
                  <h3>Endowment Plans</h3>
                  <p>Secure your future with savings and insurance combined.</p>
                </div>
                <div class="service-card">
                  <h3>ULIPs</h3>
                  <p>Invest in market-linked plans for wealth creation.</p>
                </div>
                <div class="service-card">
                  <h3>Pension Plans</h3>
                  <p>Plan for a worry-free retirement with LIC’s pension schemes.</p>
                </div>
              </div>
            </section>
          </article>

          <article aria-labelledby="contact-heading">
            <section class="section contact-section" aria-labelledby="contact-heading">
              <h2 id="contact-heading">Contact Jitendra Patidar</h2>
              <div class="contact-info">
                <p>
                  📞 <strong>Contact Number:</strong> <a href="tel:+917987235207" class="content-link" aria-label="Call Jitendra Patidar">+91 7987235207</a>
                </p>
                <p>
                  📸 <strong>Instagram:</strong> <a href="https://www.instagram.com/jay7268patidar" class="content-link" target="_blank" rel="noopener noreferrer" aria-label="Visit Instagram profile">jay7268patidar</a>
                </p>
                <address>
                  <strong>Office Address:</strong> Vikas Nagar, Scheme No. 14-3, Neemuch Chawni, Neemuch, Madhya Pradesh 458441
                </address>
                <p>
                  📍 <strong>Find Us:</strong> <a href="https://maps.app.goo.gl/your-map-link" class="content-link" target="_blank" rel="noopener noreferrer" aria-label="View on Google Maps">View on Google Maps</a>
                </p>
              </div>
            </section>
          </article>

          <article aria-labelledby="reviews-heading">
            <section class="section reviews-section" aria-labelledby="reviews-heading">
              <h2 id="reviews-heading">What Our Clients Say</h2>
              ${reviews.length > 0 ? `
                <div class="reviews-grid" aria-label="Recent customer reviews">
                  ${reviews.map(review => `
                    <div class="review-card">
                      <div class="review-header">
                        <span class="review-author">${escapeHTML(review.username)}</span>
                        <span class="review-date">${new Date(review.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <p class="review-body">${escapeHTML(review.comment)}</p>
                      <div class="review-stars" aria-hidden="true">${renderStars(averageRating)}</div>
                    </div>
                  `).join('')}
                </div>
                <a href="/reviews" class="cta-button secondary" aria-label="View all reviews">View All Reviews</a>
              ` : '<p>No reviews yet. Be the first to share your experience!</p>'}
            </section>
          </article>

          <article aria-labelledby="faq-heading">
            <section class="section faq-section" aria-labelledby="faq-heading">
              <h2 id="faq-heading">Frequently Asked Questions</h2>
              <div class="faq-list" itemscope itemtype="https://schema.org/FAQPage">
                <div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
                  <h3 itemprop="name">What types of life insurance plans does LIC Neemuch offer?</h3>
                  <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
                    <p itemprop="text">
                      LIC Neemuch offers a variety of life insurance plans including term insurance, endowment plans, ULIPs, and pension plans tailored to your financial goals.
                    </p>
                  </div>
                </div>
                <div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
                  <h3 itemprop="name">How can I contact Jitendra Patidar for insurance advice?</h3>
                  <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
                    <p itemprop="text">
                      You can contact Jitendra Patidar at +91 7987235207 or visit our office at Vikas Nagar, Scheme No. 14-3, Neemuch Chawni, Neemuch, Madhya Pradesh 458441.
                    </p>
                  </div>
                </div>
                <div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
                  <h3 itemprop="name">Why choose LIC Neemuch for financial planning?</h3>
                  <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
                    <p itemprop="text">
                      LIC Neemuch, led by Jitendra Patidar, provides personalized financial planning with trusted LIC products, ensuring security and growth for your future.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </article>

          <article aria-labelledby="cta-heading">
            <section class="section cta-section" aria-labelledby="cta-heading">
              <h2 id="cta-heading">Secure Your Future Today</h2>
              <p>
                Ready to plan your financial future? Contact Jitendra Patidar at LIC Neemuch for expert advice and the best life insurance plans in Neemuch, Madhya Pradesh.
              </p>
              <a href="tel:+917987235207" class="cta-button" aria-label="Get in touch now">Get in Touch Now</a>
            </section>
          </article>
        </main>
        <footer role="contentinfo">
          <div class="footer-content">
            <p>© EduXcel by Sanjay Patidar | June 10, 2025</p>
            <div class="footer-links">
              <a href="/reviews" class="footer-link" aria-label="Reviews">Reviews</a>
              <a href="/join" class="footer-link" aria-label="Join as Agent">Join as Agent</a>
              <a href="/services" class="footer-link" aria-label="Services">Services</a>
              <a href="/about" class="footer-link" aria-label="About">About</a>
            </div>
            <div class="footer-social">
              <a href="https://www.instagram.com/jay7268patidar" class="social-link" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <span>Instagram</span>
              </a>
            </div>
          </div>
        </footer>
      </div>
    `;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="description" content="${escapeHTML(metaDescription)}">
        <meta name="keywords" content="LIC Neemuch, Jitendra Patidar, life insurance Neemuch, financial planning Neemuch, term insurance, endowment plans, ULIPs, pension plans">
        <meta name="author" content="Jitendra Patidar">
        <meta name="robots" content="index, follow">
        <meta name="geo.region" content="IN-MP">
        <meta name="geo.placename" content="Neemuch">
        <meta name="geo.position" content="24.4716;74.8742">
        <meta name="ICBM" content="24.4716, 74.8742">
        <meta property="og:type" content="website">
        <meta property="og:title" content="${metaTitle}">
        <meta property="og:description" content="${escapeHTML(metaDescription)}">
        <meta property="og:url" content="${pageUrl}">
        <meta property="og:image" content="${metaImage}">
        <meta property="og:site_name" content="LIC Neemuch">
        <meta property="og:locale" content="en_IN">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="${metaTitle}">
        <meta name="twitter:description" content="${escapeHTML(metaDescription)}">
        <meta name="twitter:image" content="${metaImage}">
        <meta name="twitter:site" content="@jay7268patidar">
        <title>${metaTitle}</title>
        <link rel="canonical" href="${pageUrl}">
        <link rel="icon" type="image/png" href="${metaImage}" sizes="32x32">
        <link rel="alternate" hreflang="en" href="${pageUrl}">
        <link rel="alternate" hreflang="hi" href="${pageUrl}">
        <script type="application/ld+json">${JSON.stringify(structuredData)}</script>
        <script type="application/ld+json">${JSON.stringify(faqStructuredData)}</script>
        <style>
          :root {
            --primary-color: #ffbb00;
            --secondary-color: #e85d04;
            --bg-start: #050816;
            --bg-end: #010204;
            --text-color: #e0e0e0;
            --card-bg: rgba(255, 255, 255, 0.05);
            --shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
          }

          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          body {
            font-family: 'Inter', sans-serif;
            color: var(--text-color);
            background: linear-gradient(180deg, var(--bg-start), var(--bg-end));
            line-height: 1.7;
            overflow-x: hidden;
          }

          .header {
            position: relative;
            background: linear-gradient(135deg, var(--bg-start), var(--bg-end));
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }

          .navbar {
            position: sticky;
            top: 0;
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(10px);
            padding: 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 1000;
          }

          .navbar-brand {
            font-size: 1.5rem;
            font-weight: bold;
          }

          .nav-logo {
            color: var(--primary-color);
            text-decoration: none;
          }

          .nav-menu {
            display: flex;
            gap: 1.5rem;
          }

          .nav-link {
            color: var(--primary-color);
            text-decoration: none;
            font-size: 1.125rem;
            padding: 0.5rem;
            transition: color 0.3s ease;
          }

          .nav-link:hover,
          .nav-link:focus,
          .nav-link.active {
            color: #fff;
            outline: 2px solid var(--primary-color);
            outline-offset: 2px;
          }

          .hero-section {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            padding: 3rem 1rem;
            min-height: 70vh;
            background: linear-gradient(45deg, rgba(255, 187, 0, 0.1), transparent);
          }

          .hero-content {
            flex: 1;
            max-width: 600px;
            padding: 1rem;
          }

          .hero-section h1 {
            font-size: 3rem;
            color: var(--primary-color);
            margin-bottom: 1rem;
            line-height: 1.2;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
          }

          .hero-subtitle {
            font-size: 1.25rem;
            margin-bottom: 1.5rem;
            color: #ccc;
          }

          .hero-rating {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 2rem;
          }

          .stars {
            font-size: 1.5rem;
            color: var(--primary-color);
          }

          .rating-text {
            font-size: 1.125rem;
          }

          .hero-image {
            flex: 1;
            max-width: 500px;
            padding: 1rem;
          }

          .hero-image img {
            width: 100%;
            height: auto;
            border-radius: 10px;
            box-shadow: var(--shadow);
            object-fit: cover;
          }

          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem 1rem;
          }

          .section {
            margin-bottom: 3rem;
          }

          h2 {
            font-size: 2.5rem;
            color: var(--primary-color);
            margin-bottom: 1.5rem;
            border-left: 6px solid var(--primary-color);
            padding-left: 1rem;
            line-height: 1.2;
          }

          h3 {
            font-size: 1.5rem;
            color: #fff;
            margin-bottom: 1rem;
          }

          p {
            font-size: 1.125rem;
            margin-bottom: 1rem;
          }

          .content-link {
            color: var(--primary-color);
            text-decoration: none;
            padding-bottom: 2px;
            position: relative;
            transition: color 0.3s ease;
          }

          .content-link::after {
            content: '';
            position: absolute;
            width: 100%;
            height: 2px;
            bottom: 0;
            left: 0;
            background-color: var(--primary-color);
            transform: scaleX(0);
            transform-origin: bottom right;
            transition: transform 0.3s ease;
          }

          .content-link:hover::after,
          .content-link:focus::after {
            transform: scaleX(1);
            transform-origin: bottom left;
          }

          .content-link:hover,
          .content-link:focus {
            color: #fff;
          }

          .services-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
          }

          .service-card {
            background: var(--card-bg);
            padding: 1.5rem;
            border-radius: 10px;
            box-shadow: var(--shadow);
            transition: transform 0.3s ease;
          }

          .service-card:hover {
            transform: translateY(-5px);
          }

          .contact-info {
            background: var(--card-bg);
            padding: 1.5rem;
            border-radius: 10px;
            box-shadow: var(--shadow);
          }

          .reviews-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
          }

          .review-card {
            background: var(--card-bg);
            padding: 1.5rem;
            border-radius: 10px;
            box-shadow: var(--shadow);
            transition: transform 0.3s ease;
          }

          .review-card:hover {
            transform: translateY(-5px);
          }

          .review-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 1rem;
          }

          .review-author {
            font-weight: bold;
            color: var(--primary-color);
          }

          .review-date {
            font-size: 0.9rem;
            color: #aaa;
          }

          .review-body {
            font-style: italic;
            margin-bottom: 0.5rem;
          }

          .review-stars {
            font-size: 1.2rem;
            color: var(--primary-color);
          }

          .faq-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          .faq-item {
            background: var(--card-bg);
            padding: 1.5rem;
            border-radius: 10px;
            box-shadow: var(--shadow);
          }

          .faq-item h3 {
            margin-bottom: 0.5rem;
            color: var(--primary-color);
          }

          .cta-section {
            text-align: center;
            background: linear-gradient(135deg, rgba(255, 187, 0, 0.1), transparent);
            padding: 2rem;
            border-radius: 10px;
            box-shadow: var(--shadow);
          }

          .cta-button {
            display: inline-block;
            padding: 1rem 2rem;
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            color: #fff;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }

          .cta-button:hover,
          .cta-button:focus {
            transform: scale(1.05);
            box-shadow: var(--shadow);
          }

          .cta-button.secondary {
            background: transparent;
            border: 2px solid var(--primary-color);
            color: var(--primary-color);
          }

          .cta-button.secondary:hover,
          .cta-button.secondary:focus {
            background: var(--primary-color);
            color: #fff;
          }

          footer {
            text-align: center;
            padding: 2rem 1rem;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            margin-top: 3rem;
          }

          .footer-content {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
          }

          .footer-links {
            display: flex;
            gap: 1rem;
          }

          .footer-link {
            color: var(--primary-color);
            text-decoration: none;
            font-size: 1rem;
          }

          .footer-link:hover,
          .footer-link:focus {
            color: #fff;
          }

          .footer-social {
            display: flex;
            gap: 1rem;
          }

          .social-link {
            color: var(--primary-color);
            text-decoration: none;
          }

          .social-link:hover,
          .social-link:focus {
            color: #fff;
          }

          @media (max-width: 1024px) {
            .hero-section h1 {
              font-size: 2.5rem;
            }
            .hero-image {
              max-width: 400px;
            }
            .nav-menu {
              gap: 1rem;
            }
            .nav-link {
              font-size: 1rem;
            }
          }

          @media (max-width: 768px) {
            .hero-section {
              flex-direction: column;
              text-align: center;
            }
            .hero-section h1 {
              font-size: 2rem;
            }
            .hero-subtitle {
              font-size: 1rem;
            }
            .hero-image {
              max-width: 100%;
            }
            .navbar {
              flex-direction: column;
              gap: 1rem;
            }
            .nav-menu {
              flex-wrap: wrap;
              justify-content: center;
            }
            h2 {
              font-size: 2rem;
            }
            h3 {
              font-size: 1.25rem;
            }
            p {
              font-size: 1rem;
            }
            .footer-content {
              flex-direction: column;
              text-align: center;
            }
          }

          @media (max-width: 480px) {
            .hero-section h1 {
              font-size: 1.75rem;
            }
            .hero-subtitle {
              font-size: 0.9rem;
            }
            .nav-link {
              font-size: 0.9rem;
            }
            .services-grid,
            .reviews-grid {
              grid-template-columns: 1fr;
            }
          }
        </style>
        <script type="module" src="/assets/index.js"></script>
      </head>
      <body>
        <div id="root">${htmlContent}</div>
      </body>
      </html>
    `;

    console.log('SSR HTML generated, length:', html.length);
    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.status(200).send(html);
    console.log('SSR Response sent for / at', new Date().toISOString());
  } catch (error) {
    console.error('SSR Error:', error.stack);
    res.status(500).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="robots" content="noindex">
        <title>Server Error</title>
        <style>
          body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(180deg, #050816, #010204);
            color: #e0e0e0;
            text-align: center;
            padding: 2rem;
            margin: 0;
          }
          .error {
            color: #ffbb00;
            font-size: 1.5rem;
            margin-bottom: 1rem;
          }
          a {
            color: #ffbb00;
            text-decoration: none;
          }
          a:hover, a:focus {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div id="root">
          <div class="error">An error occurred. Please try again later.</div>
          <a href="/" aria-label="Back to Home">Home</a>
        </div>
      </body>
      </html>
    `);
  }
});

module.exports = router;
