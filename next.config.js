const { parsed: localEnv } = require("dotenv").config();

module.exports = {
  env: {
    API_KEY: process.env.SHOPIFY_API_KEY,
    NEXT_PUBLIC_WIDGET_PATH: process.env.NEXT_PUBLIC_WIDGET_PATH,
    NEXT_PUBLIC_PREVIEW_WIDGET_PATH:
      process.env.NEXT_PUBLIC_PREVIEW_WIDGET_PATH,
  },
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
