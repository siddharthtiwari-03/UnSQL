// eslint.config.js
const js = require("@eslint/js");
const globals = require("globals");
const { defineConfig } = require("eslint/config"); // Import defineConfig

module.exports = defineConfig([ // Call defineConfig here and export its result
  { files: ["**/*.{js,mjs,cjs}"], plugins: { js }, extends: [js.configs.recommended] }, // Corrected extends for @eslint/js
  { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },
  { files: ["**/*.{js,mjs,cjs}"], languageOptions: { globals: globals.node } },
  {
    rules: {
      "no-unused-vars": "off", // Turn off the rule entirely
    },
  },
]);