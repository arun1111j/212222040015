import express, { json } from 'express';
import path from 'path';
import Logger from './logger.js';
import {
  createShortUrl,
  getUrlStatistics,
  redirectToOriginalUrl,
} from './controllers/urlController.js';
import { validateCreateUrl } from './middleware/validation.js';

const app = express();
const PORT = process.env.PORT || 3000;

const logger = new Logger();

app.use(json());

app.use(async (req, res, next) => {
  const startTime = Date.now();

  await logger.info(
    'backend',
    'middleware',
    `${req.method} ${req.path} - Request received`
  );

  const originalJson = res.json;
  res.json = function (data) {
    const duration = Date.now() - startTime;
    logger.info(
      'backend',
      'middleware',
      `${req.method} ${req.path} - Response sent (${res.statusCode}) in ${duration}ms`
    );
    return originalJson.call(this, data);
  };

  next();
});

// Routes
app.post('/shorturls', validateCreateUrl, createShortUrl);
app.get('/shorturls/:shortcode', getUrlStatistics);
app.get('/:shortcode', redirectToOriginalUrl);

app.use(async (err, req, res, next) => {
  await logger.error('backend', 'middleware', `Error: ${err.message}`);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

app.use(async (req, res) => {
  await logger.warn(
    'backend',
    'route',
    `404 - Route not found: ${req.method} ${req.path}`
  );
  res.status(404).json({
    error: 'Not found',
    message: 'The requested resource was not found',
  });
});

app.listen(PORT, async () => {
  await logger.info(
    'backend',
    'config',
    `URL Shortener Microservice started on port ${PORT}`
  );
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
