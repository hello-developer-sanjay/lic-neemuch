const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const LICFeedback = require('./models/LICFeedback');
const LICQuery = require('./models/LICQuery');
const LICReview = require('./models/LICReview');
const LICRating = require('./models/LICRating');
const homePageSSR = require('./homePageSSR');

dotenv.config();

const app = express();

// Log environment variables
console.log('Environment variables during startup:');
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI_LIC:', process.env.MONGODB_URI_LIC ? '[REDACTED]' : 'Not set');
console.log('NODE_ENV:', process.env.NODE_ENV);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`Request received: ${req.method} ${req.url} at ${new Date().toISOString()}`);
  next();
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI_LIC, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.error('MongoDB connection error:', error);
});

// SSR Route - Takes precedence for /
app.use('/', homePageSSR);

// Serve static assets (Vite build) with logging
const staticMiddleware = express.static(path.join(__dirname, 'dist'));
app.use((req, res, next) => {
  console.log(`Attempting to serve static file: ${req.url}`);
  staticMiddleware(req, res, (err) => {
    if (err) {
      console.error(`Static file error for ${req.url}:`, err);
      return next(err);
    }
    if (!res.headersSent) {
      console.log(`Static file not found: ${req.url}, proceeding to next middleware`);
      next();
    } else {
      console.log(`Static file served: ${req.url}`);
    }
  });
});

// API Endpoints
app.post('/api/lic/submit-feedback', async (req, res) => {
  try {
    const { name, email, feedback } = req.body;
    if (!name || !feedback) {
      return res.status(400).json({ error: 'Name and feedback are required' });
    }
    const newFeedback = new LICFeedback({ name, email, feedback });
    await newFeedback.save();
    res.status(201).json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/lic/feedbacks', async (req, res) => {
  try {
    const feedbacks = await LICFeedback.find();
    res.json(feedbacks);
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/lic/submit-query', async (req, res) => {
  try {
    const { name, email, query } = req.body;
    if (!name || !query) {
      return res.status(400).json({ error: 'Name and query are required' });
    }
    const newQuery = new LICQuery({ name, email, query });
    await newQuery.save();
    res.status(201).json({ message: 'Query submitted successfully' });
  } catch (error) {
    console.error('Error submitting query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/lic/queries', async (req, res) => {
  try {
    const queries = await LICQuery.find();
    res.json(queries);
  } catch (error) {
    console.error('Error fetching queries:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/lic/reviews', async (req, res) => {
  try {
    const { username, comment } = req.body;
    if (!username || !comment) {
      return res.status(400).json({ error: 'Username and comment are required' });
    }
    const newReview = new LICReview({ username, comment });
    await newReview.save();
    res.status(201).json(newReview);
  } catch (error) {
    console.error('Error posting review:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/lic/reviews', async (req, res) => {
  try {
    const reviews = await LICReview.find();
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/lic/ratings', async (req, res) => {
  try {
    const { userId, rating } = req.body;
    if (!userId || !rating) {
      return res.status(400).json({ error: 'User ID and rating are required' });
    }
    const existingRating = await LICRating.findOneAndUpdate(
      { userId },
      { rating },
      { upsert: true, new: true }
    );
    res.json(existingRating);
  } catch (error) {
    console.error('Error updating rating:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/lic/ratings', async (req, res) => {
  try {
    const ratings = await LICRating.find();
    res.json(ratings);
  } catch (error) {
    console.error('Error fetching ratings:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Fallback for client-side routes - Exclude API and static asset routes
app.get('*', (req, res) => {
  if (req.url.startsWith('/api/') || req.url.startsWith('/assets/')) {
    console.log(`Skipping fallback for ${req.url}`);
    return res.status(404).send('Not found');
  }
  console.log(`Fallback route hit: ${req.url} at ${new Date().toISOString()}`);
  res.sendFile(path.join(__dirname, 'dist/index.html'), (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).send('Error serving page');
    }
  });
});

const PORT = process.env.PORT || 4500;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
