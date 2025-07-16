const Logger = require('../logger');

const logger = new Logger();

const validateCreateUrl = async (req, res, next) => {
  try {
    const { url, validity, shortcode } = req.body;

    await logger.debug(
      'backend',
      'middleware',
      'Validating create URL request'
    );

    if (!url) {
      await logger.warn('backend', 'middleware', 'URL field is missing');
      return res.status(400).json({
        error: 'Missing required field',
        message: 'URL is required',
      });
    }

    if (typeof url !== 'string' || url.trim().length === 0) {
      await logger.warn('backend', 'middleware', 'Invalid URL format');
      return res.status(400).json({
        error: 'Invalid URL',
        message: 'URL must be a non-empty string',
      });
    }

    if (validity !== undefined) {
      if (!Number.isInteger(validity) || validity <= 0) {
        await logger.warn(
          'backend',
          'middleware',
          `Invalid validity value: ${validity}`
        );
        return res.status(400).json({
          error: 'Invalid validity',
          message: 'Validity must be a positive integer representing minutes',
        });
      }
    }

    if (shortcode !== undefined) {
      if (typeof shortcode !== 'string' || shortcode.trim().length === 0) {
        await logger.warn('backend', 'middleware', 'Invalid shortcode format');
        return res.status(400).json({
          error: 'Invalid shortcode',
          message: 'Shortcode must be a non-empty string',
        });
      }
    }

    await logger.debug('backend', 'middleware', 'Request validation passed');
    next();
  } catch (error) {
    await logger.error(
      'backend',
      'middleware',
      `Validation error: ${error.message}`
    );
    res.status(500).json({
      error: 'Internal server error',
      message: 'Validation failed',
    });
  }
};

module.exports = {
  validateCreateUrl,
};
