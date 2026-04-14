// @ts-check
const { defineConfig } = require("@kubb/core");
const { pluginOas } = require("@kubb/plugin-oas");
const { pluginClient } = require("@kubb/plugin-client");
const { pluginTs } = require("@kubb/plugin-ts");
const { pluginReactQuery } = require("@kubb/plugin-react-query");
const fs = require("fs");

/**
 * Helper function to convert camelCase to kebab-case
 * @param {string} str
 * @returns {string}
 */
function toKebabCase(str) {
  if (!str || typeof str !== "string") return str;
  return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

/**
 * Kubb Configuration for Oyrade Frontend with NestJS Backend
 */
const config = defineConfig({
  input: {
    path: (() => {
      const fixedSpecPath = "./temp-openapi.json";

      if (fs.existsSync(fixedSpecPath)) {
        return fixedSpecPath;
      }

      if (process.env.NEXT_PUBLIC_API_URL) {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
        return `${baseUrl}/api-json`;
      }
      return "http://localhost:7777/api-json";
    })(),
  },

  output: {
    path: "./lib/api-client",
    clean: true,
    write: true,
    format: false,
  },

  hooks: {
    done: ['echo "✓ API generation completed"'],
  },

  plugins: [
    pluginOas({
      output: {
        path: "./schemas",
      },
      validate: false,
      serverIndex: 0,
      contentType: "application/json",
    }),

    pluginTs({
      output: {
        path: "./types",
      },
      transformers: {
        name: (name, type) => {
          if (!name) return name;
          if (type === "file") {
            return toKebabCase(name);
          }
          return name;
        },
      },
    }),

    pluginClient({
      output: {
        path: "./client",
      },
      importPath: "@/lib/kubb",
      transformers: {
        name: (name, type) => {
          if (!name) return name;
          if (type === "file") {
            return toKebabCase(name);
          }
          return name;
        },
      },
    }),

    pluginReactQuery({
      output: {
        path: "./hooks",
      },
      transformers: {
        name: (name, type) => {
          if (!name) return name;
          if (type === "file") {
            return toKebabCase(name);
          }
          return name;
        },
      },
    }),
  ],
});

module.exports = config;
