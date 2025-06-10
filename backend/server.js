const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
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
app.use(cors({
  origin: ['http://localhost:5173', 'https://lic-backend-8jun.onrender.com'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept'],
  credentials: true,
  maxAge: 86400,
}));
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

// Serve static assets (Vite build)
app.use(express.static(path.join(__dirname, 'dist')));

// SSR Route
app.use(homePageSSR);

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

// Fallback for client-side routes
app.get('*', (req, res) => {
  console.log(`Fallback route hit: ${req.url} at ${new Date().toISOString()}`);
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

const PORT = process.env.PORT || 4500;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});