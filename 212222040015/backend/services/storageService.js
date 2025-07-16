const fs = require('fs').promises;
const path = require('path');
const Logger = require('../logger');

class StorageService {
  constructor() {
    this.logger = new Logger();
    this.urlsFile = path.join(__dirname, '../data/urls.json');
    this.analyticsFile = path.join(__dirname, '../data/analytics.json');
    this.initializeStorage();
  }

  async initializeStorage() {
    try {
      const dataDir = path.dirname(this.urlsFile);
      // console.log(dataDir)
      await fs.mkdir(dataDir, { recursive: true });

      try {
        await fs.access(this.urlsFile);
      } catch {
        await fs.writeFile(this.urlsFile, JSON.stringify({}));
        await this.logger.info(
          'backend',
          'repository',
          'URLs storage file initialized'
        );
      }

      try {
        await fs.access(this.analyticsFile);
      } catch {
        await fs.writeFile(this.analyticsFile, JSON.stringify({}));
        await this.logger.info(
          'backend',
          'repository',
          'Analytics storage file initialized'
        );
      }
    } catch (error) {
      // console.log(error)
      await this.logger.error(
        'backend',
        'repository',
        `Failed to initialize storage: ${error.message}`
      );
      throw error;
    }
  }

  async saveUrl(shortcode, urlData) {
    try {
      const urls = await this.loadUrls();
      urls[shortcode] = urlData;
      // console.log(urls,urlData)
      await fs.writeFile(this.urlsFile, JSON.stringify(urls, null, 2));
      await this.logger.info(
        'backend',
        'repository',
        `URL saved with shortcode: ${shortcode}`
      );
    } catch (error) {
      await this.logger.error(
        'backend',
        'repository',
        `Failed to save URL: ${error.message}`
      );
      throw error;
    }
  }

  async getUrl(shortcode) {
    try {
      const urls = await this.loadUrls();
      const urlData = urls[shortcode];
      if (urlData) {
        await this.logger.debug(
          'backend',
          'repository',
          `URL retrieved for shortcode: ${shortcode}`
        );
      }
      return urlData;
    } catch (error) {
      await this.logger.error(
        'backend',
        'repository',
        `Failed to get URL: ${error.message}`
      );
      throw error;
    }
  }

  async loadUrls() {
    try {
      const data = await fs.readFile(this.urlsFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      await this.logger.warn(
        'backend',
        'repository',
        'Failed to load URLs, returning empty object'
      );
      return {};
    }
  }

  async saveAnalytics(shortcode, clickData) {
    try {
      const analytics = await this.loadAnalytics();
      if (!analytics[shortcode]) {
        analytics[shortcode] = {
          totalClicks: 0,
          clicks: [],
        };
      }
      analytics[shortcode].totalClicks++;
      analytics[shortcode].clicks.push(clickData);

      await fs.writeFile(
        this.analyticsFile,
        JSON.stringify(analytics, null, 2)
      );
      await this.logger.info(
        'backend',
        'repository',
        `Analytics saved for shortcode: ${shortcode}`
      );
    } catch (error) {
      await this.logger.error(
        'backend',
        'repository',
        `Failed to save analytics: ${error.message}`
      );
      throw error;
    }
  }

  async getAnalytics(shortcode) {
    try {
      const analytics = await this.loadAnalytics();
      return analytics[shortcode] || { totalClicks: 0, clicks: [] };
    } catch (error) {
      await this.logger.error(
        'backend',
        'repository',
        `Failed to get analytics: ${error.message}`
      );
      throw error;
    }
  }

  async loadAnalytics() {
    try {
      const data = await fs.readFile(this.analyticsFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      await this.logger.warn(
        'backend',
        'repository',
        'Failed to load analytics, returning empty object'
      );
      return {};
    }
  }

  async shortcodeExists(shortcode) {
    try {
      const urls = await this.loadUrls();
      return urls.hasOwnProperty(shortcode);
    } catch (error) {
      await this.logger.error(
        'backend',
        'repository',
        `Failed to check shortcode existence: ${error.message}`
      );
      return false;
    }
  }
}

module.exports = new StorageService();
