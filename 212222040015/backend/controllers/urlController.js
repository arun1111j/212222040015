const storageService = require('../services/storageService');
const {
  generateShortcode,
  isValidUrl,
  getLocationFromIP,
} = require('../utils/helpers');
const Logger = require('../logger');

class UrlController {
  constructor() {
    this.logger = new Logger();
  }

  async createShortUrl(req, res) {
    try {
      const { url, validity = 30, shortcode } = req.body;
      // console.log(shortcode)
      await this.logger.info(
        'backend',
        'controller',
        `Creating short URL for: ${url}`
      );

      if (!isValidUrl(url)) {
        await this.logger.warn(
          'backend',
          'controller',
          `Invalid URL provided: ${url}`
        );
        return res.status(400).json({
          error: 'Invalid URL',
          message: 'Please provide a valid URL',
        });
      }

      let finalShortcode = shortcode;

      if (shortcode) {
        if (!/^[a-zA-Z0-9]{3,10}$/.test(shortcode)) {
          await this.logger.warn(
            'backend',
            'controller',
            `Invalid shortcode format: ${shortcode}`
          );
          return res.status(400).json({
            error: 'Invalid shortcode',
            message: 'Shortcode must be 3-10 alphanumeric characters',
          });
        }

        if (await storageService.shortcodeExists(shortcode)) {
          await this.logger.warn(
            'backend',
            'controller',
            `Shortcode collision: ${shortcode}`
          );
          return res.status(409).json({
            error: 'Shortcode collision',
            message: 'The provided shortcode is already in use',
          });
        }
      } else {
        do {
          finalShortcode = generateShortcode();
        } while (await storageService.shortcodeExists(finalShortcode));
      }

      const expiryDate = new Date();
      expiryDate.setMinutes(expiryDate.getMinutes() + validity);

      const urlData = {
        originalUrl: url,
        shortcode: finalShortcode,
        createdAt: new Date().toISOString(),
        expiresAt: expiryDate.toISOString(),
        validity: validity,
      };

      await storageService.saveUrl(finalShortcode, urlData);

      const shortLink = `http://localhost:${
        process.env.PORT || 3000
      }/${finalShortcode}`;

      await this.logger.info(
        'backend',
        'controller',
        `Short URL created successfully: ${shortLink}`
      );

      res.status(201).json({
        shortLink: shortLink,
        expiry: expiryDate.toISOString(),
      });
    } catch (error) {
      await this.logger.error(
        'backend',
        'controller',
        `Error creating short URL: ${error.message}`
      );
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create short URL',
      });
    }
  }

  async getUrlStatistics(req, res) {
    try {
      const { shortcode } = req.params;

      await this.logger.info(
        'backend',
        'controller',
        `Retrieving statistics for shortcode: ${shortcode}`
      );

      const urlData = await storageService.getUrl(shortcode);
      if (!urlData) {
        await this.logger.warn(
          'backend',
          'controller',
          `Shortcode not found: ${shortcode}`
        );
        return res.status(404).json({
          error: 'Not found',
          message: 'Shortcode does not exist',
        });
      }

      const analytics = await storageService.getAnalytics(shortcode);

      const response = {
        shortcode: shortcode,
        originalUrl: urlData.originalUrl,
        createdAt: urlData.createdAt,
        expiresAt: urlData.expiresAt,
        totalClicks: analytics.totalClicks,
        clickDetails: analytics.clicks.map((click) => ({
          timestamp: click.timestamp,
          referrer: click.referrer || 'Direct',
          location: click.location || 'Unknown',
          userAgent: click.userAgent || 'Unknown',
        })),
      };

      await this.logger.info(
        'backend',
        'controller',
        `Statistics retrieved for shortcode: ${shortcode}`
      );
      res.json(response);
    } catch (error) {
      await this.logger.error(
        'backend',
        'controller',
        `Error retrieving statistics: ${error.message}`
      );
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve statistics',
      });
    }
  }

  async redirectToOriginalUrl(req, res) {
    try {
      const { shortcode } = req.params;

      await this.logger.info(
        'backend',
        'controller',
        `Redirect request for shortcode: ${shortcode}`
      );

      const urlData = await storageService.getUrl(shortcode);
      if (!urlData) {
        await this.logger.warn(
          'backend',
          'controller',
          `Shortcode not found for redirect: ${shortcode}`
        );
        return res.status(404).json({
          error: 'Not found',
          message: 'Shortcode does not exist',
        });
      }

      const now = new Date();
      const expiryDate = new Date(urlData.expiresAt);
      if (now > expiryDate) {
        await this.logger.warn(
          'backend',
          'controller',
          `Expired shortcode accessed: ${shortcode}`
        );
        return res.status(410).json({
          error: 'Link expired',
          message: 'This short link has expired',
        });
      }

      const clickData = {
        timestamp: new Date().toISOString(),
        referrer: req.get('Referer') || null,
        userAgent: req.get('User-Agent') || null,
        location: getLocationFromIP(req.ip || req.connection.remoteAddress),
      };

      await storageService.saveAnalytics(shortcode, clickData);

      await this.logger.info(
        'backend',
        'controller',
        `Redirecting to: ${urlData.originalUrl}`
      );

      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      });

      res.redirect(302, urlData.originalUrl);
    } catch (error) {
      await this.logger.error(
        'backend',
        'controller',
        `Error during redirect: ${error.message}`
      );
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to redirect',
      });
    }
  }
}

module.exports = new UrlController();
