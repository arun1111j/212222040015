const http = require('http');
const https = require('https');
const { URL } = require('url');

class Logger {
  constructor(config = {}) {
    this.apiUrl =
      config.apiUrl || 'http://20.244.56.144/evaluation-service/logs';
    this.timeout = config.timeout || 5000;
    this.retries = config.retries || 3;
    this.validStacks = ['backend', 'frontend'];
    this.validLevels = ['debug', 'info', 'warn', 'error', 'fatal'];
    this.validBackendPackages = [
      'cache',
      'controller',
      'cron_job',
      'domain',
      'handler',
      'repository',
      'route',
    ];
    this.validFrontendPackages = [
      'api',
      'component',
      'hook',
      'page',
      'state',
      'style',
    ];
    this.validCommonPackages = ['auth', 'config', 'middleware', 'utils'];
  }

  validateParams(stack, level, packageName, message) {
    if (!this.validStacks.includes(stack)) {
      throw new Error(
        `Invalid stack: ${stack}. Must be one of: ${this.validStacks.join(
          ', '
        )}`
      );
    }

    if (!this.validLevels.includes(level)) {
      throw new Error(
        `Invalid level: ${level}. Must be one of: ${this.validLevels.join(
          ', '
        )}`
      );
    }

    const allValidPackages = [
      ...this.validBackendPackages,
      ...this.validFrontendPackages,
      ...this.validCommonPackages,
    ];

    if (!allValidPackages.includes(packageName)) {
      throw new Error(
        `Invalid package: ${packageName}. Must be one of: ${allValidPackages.join(
          ', '
        )}`
      );
    }

    if (
      stack === 'backend' &&
      this.validFrontendPackages.includes(packageName)
    ) {
      throw new Error(
        `Package ${packageName} cannot be used with backend stack`
      );
    }

    if (
      stack === 'frontend' &&
      this.validBackendPackages.includes(packageName)
    ) {
      throw new Error(
        `Package ${packageName} cannot be used with frontend stack`
      );
    }

    if (typeof message !== 'string' || message.trim().length === 0) {
      throw new Error('Message must be a non-empty string');
    }

    return true;
  }

  makeApiCall(logData) {
    return new Promise((resolve, reject) => {
      const url = new URL(this.apiUrl);
      const isHttps = url.protocol === 'https:';
      const httpModule = isHttps ? https : http;

      const postData = JSON.stringify(logData);

      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          Authorization: `Bearer ${process.env.access_token}`,
        },
        timeout: this.timeout,
      };

      const req = httpModule.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (res.statusCode === 200) {
              resolve(response);
            } else {
              reject(
                new Error(
                  `API call failed with status ${res.statusCode}: ${data}`
                )
              );
            }
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.write(postData);
      req.end();
    });
  }

  async logWithRetry(stack, level, packageName, message, attempt = 1) {
    try {
      this.validateParams(stack, level, packageName, message);

      const logData = {
        stack: stack.toLowerCase(),
        level: level.toLowerCase(),
        package: packageName.toLowerCase(),
        message: message,
      };

      const response = await this.makeApiCall(logData);
      return response;
    } catch (error) {
      if (attempt < this.retries) {
        console.warn(
          `Log attempt ${attempt} failed, retrying... Error: ${error.message}`
        );
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
        return this.logWithRetry(
          stack,
          level,
          packageName,
          message,
          attempt + 1
        );
      } else {
        console.error(
          `Failed to send log after ${this.retries} attempts:`,
          error.message
        );
        throw error;
      }
    }
  }

  async Log(stack, level, packageName, message) {
    try {
      const response = await this.logWithRetry(
        stack,
        level,
        packageName,
        message
      );
      console.log(`Log sent successfully. LogID: ${response.logId}`);
      return response;
    } catch (error) {
      console.error('Logging failed:', error.message);
      return null;
    }
  }

  debug(stack, packageName, message) {
    return this.Log(stack, 'debug', packageName, message);
  }

  info(stack, packageName, message) {
    return this.Log(stack, 'info', packageName, message);
  }

  warn(stack, packageName, message) {
    return this.Log(stack, 'warn', packageName, message);
  }

  error(stack, packageName, message) {
    return this.Log(stack, 'error', packageName, message);
  }

  fatal(stack, packageName, message) {
    return this.Log(stack, 'fatal', packageName, message);
  }
}

export default Logger;
