const crypto = require('crypto');

const generateShortcode = (length = 6) => {
  const chars =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const isValidUrl = (string) => {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const getLocationFromIP = () => {
  const locations = [
    'New York, US',
    'London, UK',
    'Tokyo, JP',
    'Sydney, AU',
    'Berlin, DE',
  ];
  return locations[Math.floor(Math.random() * locations.length)];
};

module.exports = {
  generateShortcode,
  isValidUrl,
  getLocationFromIP,
};
