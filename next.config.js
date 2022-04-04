const { parsed: localEnv } = require("dotenv").config();

module.exports = {
  env: { API_KEY: process.env.SHOPIFY_API_KEY },
  webpack: (config) => {
    // Add ESM support for .mjs files in webpack 4
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: "javascript/auto",
    });

    return config;
  },
};
