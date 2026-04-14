#!/usr/bin/env node

/**
 * Script to fix OpenAPI spec issues before Kubb processing
 * This script downloads the OpenAPI spec from NestJS backend and fixes reference issues
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const OPENAPI_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api-json`
  : "http://localhost:7777/api-json";

const OUTPUT_PATH = path.join(__dirname, "../../temp-openapi.json");

function downloadOpenAPI() {
  return new Promise((resolve, reject) => {
    const client = OPENAPI_URL.startsWith("https") ? https : http;

    client
      .get(OPENAPI_URL, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const spec = JSON.parse(data);
            resolve(spec);
          } catch (error) {
            reject(new Error(`Failed to parse OpenAPI JSON: ${error.message}`));
          }
        });
      })
      .on("error", (error) => {
        reject(new Error(`Failed to download OpenAPI spec: ${error.message}`));
      });
  });
}

function fixOpenAPISpec(spec) {
  // Fix any missing references
  const missingRefs = [];

  // Scan for $ref patterns and check if they exist
  function scanForRefs(obj, path = "") {
    if (typeof obj === "object" && obj !== null) {
      if (obj.$ref && typeof obj.$ref === "string") {
        const ref = obj.$ref;
        if (ref.startsWith("#/components/schemas/")) {
          const schemaName = ref.replace("#/components/schemas/", "");
          if (!spec.components?.schemas?.[schemaName]) {
            missingRefs.push({ ref, path, schemaName });
          }
        }
      }

      for (const [key, value] of Object.entries(obj)) {
        scanForRefs(value, path ? `${path}.${key}` : key);
      }
    }
  }

  scanForRefs(spec);

  // Create placeholder schemas for missing references
  if (missingRefs.length > 0) {
    console.log(`Found ${missingRefs.length} missing schema references:`);

    if (!spec.components) {
      spec.components = {};
    }
    if (!spec.components.schemas) {
      spec.components.schemas = {};
    }

    missingRefs.forEach(({ ref, schemaName }) => {
      console.log(`  - ${ref}`);

      // Create a basic placeholder schema
      if (!spec.components.schemas[schemaName]) {
        spec.components.schemas[schemaName] = {
          type: "object",
          title: schemaName,
          description: `Placeholder schema for ${schemaName}`,
          properties: {
            id: {
              type: "string",
              description: "Identifier",
            },
            value: {
              type: "object",
              description: "Value object",
            },
          },
        };
      }
    });

    console.log("✓ Created placeholder schemas for missing references");
  }

  return spec;
}

async function main() {
  try {
    console.log(`Downloading OpenAPI spec from: ${OPENAPI_URL}`);
    const spec = await downloadOpenAPI();

    console.log("Fixing OpenAPI spec issues...");
    const fixedSpec = fixOpenAPISpec(spec);

    console.log(`Writing fixed spec to: ${OUTPUT_PATH}`);
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(fixedSpec, null, 2));

    console.log("✓ OpenAPI spec fixed successfully");
  } catch (error) {
    console.error("✗ Error fixing OpenAPI spec:", error.message);
    process.exit(1);
  }
}

main();
