#!/usr/bin/env node

/**
 * Script to fix import paths in generated Kubb files
 * - Convert relative paths (./ ../) to absolute paths (@/)
 * - Remove .ts extensions from imports
 * - Fix incorrect paths to point to correct subdirectories
 */

const fs = require("fs");
const path = require("path");

const GEN_DIR = path.join(__dirname, "../../lib/api-client");

function getAllTsFiles(dir) {
  const files = [];

  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip .kubb directory
        if (item !== ".kubb") {
          traverse(fullPath);
        }
      } else if (item.endsWith(".ts") || item.endsWith(".tsx")) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

function findTypeFile(typeName) {
  // Common locations for types
  const possiblePaths = [
    path.join(GEN_DIR, "types", `${typeName}.ts`),
    path.join(GEN_DIR, `${typeName}.ts`),
    path.join(GEN_DIR, "client", `${typeName}.ts`),
    path.join(GEN_DIR, "hooks", `${typeName}.ts`),
  ];

  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      // Return relative path from gen directory
      return path.relative(GEN_DIR, possiblePath).replace(/\\/g, "/").replace(/\.ts$/, "");
    }
  }

  return null;
}

function fixClientIndexFile(filePath) {
  console.log("🔧 Fixing client index.ts exports...");

  const clientDir = path.dirname(filePath);
  const clientFiles = fs
    .readdirSync(clientDir)
    .filter((file) => file.endsWith(".ts") && file !== "index.ts")
    .map((file) => file.replace(".ts", ""));

  // Read each client file to get the exported function name
  const exports = [];

  for (const fileName of clientFiles) {
    const clientFilePath = path.join(clientDir, `${fileName}.ts`);
    const content = fs.readFileSync(clientFilePath, "utf8");

    // Find export function name using regex
    const exportMatch = content.match(/export\s+async\s+function\s+(\w+)/);
    if (exportMatch) {
      const functionName = exportMatch[1];
      // Use absolute path instead of relative path
      exports.push(`export { ${functionName} } from "@/lib/api-client/client/${fileName}";`);
    }
  }

  // Write the new index.ts content
  const newContent = exports.join("\n") + "\n";
  fs.writeFileSync(filePath, newContent, "utf8");

  console.log(`✅ Fixed client/index.ts with ${exports.length} exports using absolute paths`);
  return true;
}

function fixHooksIndexFile(filePath) {
  console.log("🔧 Fixing hooks index.ts exports...");

  const hooksDir = path.dirname(filePath);
  const hooksFiles = fs
    .readdirSync(hooksDir)
    .filter((file) => file.endsWith(".ts") && file !== "index.ts")
    .map((file) => file.replace(".ts", ""));

  // Read each hooks file to get the exported names
  const exports = [];

  for (const fileName of hooksFiles) {
    const hooksFilePath = path.join(hooksDir, `${fileName}.ts`);
    const content = fs.readFileSync(hooksFilePath, "utf8");

    // Find all export types and functions
    const typeExports = content.match(/export\s+type\s+(\w+)/g);
    const functionExports = content.match(/export\s+(const|function)\s+(\w+)/g);

    if (typeExports) {
      typeExports.forEach((match) => {
        const typeName = match.match(/export\s+type\s+(\w+)/)[1];
        exports.push(`export type { ${typeName} } from "@/lib/api-client/hooks/${fileName}";`);
      });
    }

    if (functionExports) {
      functionExports.forEach((match) => {
        const funcName = match.match(/export\s+(?:const|function)\s+(\w+)/)[1];
        exports.push(`export { ${funcName} } from "@/lib/api-client/hooks/${fileName}";`);
      });
    }
  }

  // Write the new index.ts content
  const newContent = exports.join("\n") + "\n";
  fs.writeFileSync(filePath, newContent, "utf8");

  console.log(`✅ Fixed hooks/index.ts with ${exports.length} exports using absolute paths`);
  return true;
}

function fixTypesIndexFile(filePath) {
  console.log("🔧 Fixing types index.ts exports...");

  const typesDir = path.dirname(filePath);
  const typesFiles = fs
    .readdirSync(typesDir)
    .filter((file) => file.endsWith(".ts") && file !== "index.ts")
    .map((file) => file.replace(".ts", ""));

  // Read each types file to get the exported names
  const exports = [];

  for (const fileName of typesFiles) {
    const typesFilePath = path.join(typesDir, `${fileName}.ts`);
    const content = fs.readFileSync(typesFilePath, "utf8");

    // Find all export types and consts
    const typeExports = content.match(/export\s+type\s+(\w+)/g);
    const constExports = content.match(/export\s+const\s+(\w+)/g);

    if (typeExports) {
      typeExports.forEach((match) => {
        const typeName = match.match(/export\s+type\s+(\w+)/)[1];
        exports.push(`export type { ${typeName} } from "@/lib/api-client/types/${fileName}";`);
      });
    }

    if (constExports) {
      constExports.forEach((match) => {
        const constName = match.match(/export\s+const\s+(\w+)/)[1];
        exports.push(`export { ${constName} } from "@/lib/api-client/types/${fileName}";`);
      });
    }
  }

  // Write the new index.ts content
  const newContent = exports.join("\n") + "\n";
  fs.writeFileSync(filePath, newContent, "utf8");

  console.log(`✅ Fixed types/index.ts with ${exports.length} exports using absolute paths`);
  return true;
}

function fixRootIndexFile(filePath) {
  console.log("🔧 Fixing root index.ts exports...");

  const content = fs.readFileSync(filePath, "utf8");
  let fixedContent = content;
  let modified = false;

  // Fix all relative paths to absolute paths and remove .ts extensions
  fixedContent = fixedContent.replace(/from\s+["']\.\/([^"']+)["']/g, (match, relativePath) => {
    const cleanPath = relativePath.replace(/\.(ts|tsx)$/, "");
    modified = true;
    return `from "@/lib/api-client/${cleanPath}"`;
  });

  fixedContent = fixedContent.replace(/from\s+["']\.\.\/([^"']+)["']/g, (match, relativePath) => {
    const cleanPath = relativePath.replace(/\.(ts|tsx)$/, "");
    modified = true;
    return `from "@/lib/api-client/${cleanPath}"`;
  });

  // Fix any remaining .ts extensions
  if (fixedContent.includes("@/lib/api-client/") && (fixedContent.includes('.ts"') || fixedContent.includes(".ts'"))) {
    fixedContent = fixedContent.replace(/(@\/lib\/api-client\/[^"']+)\.ts(["'])/g, "$1$2");
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, fixedContent, "utf8");
    console.log("✅ Fixed root index.ts imports and extensions");
    return true;
  }

  return false;
}

function fixImportsInFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  let modified = false;

  const isIndexFile = path.basename(filePath) === "index.ts";
  const isClientIndex = filePath.includes("/client/index.ts");
  const isHooksIndex = filePath.includes("/hooks/index.ts");
  const isTypesIndex = filePath.includes("/types/index.ts");
  const isRootIndex = filePath === path.join(GEN_DIR, "index.ts");

  if (isClientIndex) {
    return fixClientIndexFile(filePath);
  }

  if (isHooksIndex) {
    return fixHooksIndexFile(filePath);
  }

  if (isTypesIndex) {
    return fixTypesIndexFile(filePath);
  }

  if (isRootIndex) {
    return fixRootIndexFile(filePath);
  }

  const lines = content.split("\n");
  const fixedLines = lines.map((line) => {
    let fixedLine = line;

    if (line.trim().startsWith("import") && line.includes("from")) {
      // Fix relative paths to absolute paths
      fixedLine = fixedLine.replace(/["']\.\.\/([^"']+)["']/g, (_, relativePath) => {
        const cleanPath = relativePath.replace(/\.(ts|tsx)$/, "");
        modified = true;
        return `"@/lib/api-client/${cleanPath}"`;
      });

      fixedLine = fixedLine.replace(/["']\.\/([^"']+)["']/g, (_, relativePath) => {
        const cleanPath = relativePath.replace(/\.(ts|tsx)$/, "");
        modified = true;
        return `"@/lib/api-client/${cleanPath}"`;
      });

      // Fix paths that don't include subdirectories
      fixedLine = fixedLine.replace(/"@\/lib\/api-client\/([^/"']+)"/g, (match, typeName) => {
        if (typeName.includes("/")) {
          return match;
        }

        const correctPath = findTypeFile(typeName);
        if (correctPath) {
          modified = true;
          return `"@/lib/api-client/${correctPath}"`;
        }

        return match;
      });

      // Fix any remaining .ts extensions
      if (fixedLine.includes("@/lib/api-client/") && (fixedLine.includes('.ts"') || fixedLine.includes(".ts'"))) {
        fixedLine = fixedLine.replace(/(@\/lib\/api-client\/[^"']+)\.ts(["'])/g, "$1$2");
        modified = true;
      }
    }

    if (isIndexFile && line.trim().startsWith("export") && line.includes("from")) {
      fixedLine = fixedLine.replace(/from\s+["']\.\/([^"']+)["']/g, (_, relativePath) => {
        const cleanPath = relativePath.replace(/\.(ts|tsx)$/, "");
        modified = true;
        return `from "@/lib/api-client/${cleanPath}"`;
      });

      fixedLine = fixedLine.replace(/from\s+["']\.\.\/([^"']+)["']/g, (_, relativePath) => {
        const cleanPath = relativePath.replace(/\.(ts|tsx)$/, "");
        modified = true;
        return `from "@/lib/api-client/${cleanPath}"`;
      });

      if (fixedLine.includes("@/lib/api-client/") && (fixedLine.includes('.ts"') || fixedLine.includes(".ts'"))) {
        fixedLine = fixedLine.replace(/(@\/lib\/api-client\/[^"']+)\.ts(["'])/g, "$1$2");
        modified = true;
      }
    }

    return fixedLine;
  });

  if (modified) {
    const fixedContent = fixedLines.join("\n");
    fs.writeFileSync(filePath, fixedContent, "utf8");
    return true;
  }

  return false;
}

function main() {
  console.log("🔧 Fixing import paths in generated files...");

  if (!fs.existsSync(GEN_DIR)) {
    console.error("❌ Generated files directory not found:", GEN_DIR);
    process.exit(1);
  }

  const tsFiles = getAllTsFiles(GEN_DIR);
  console.log(`📁 Found ${tsFiles.length} TypeScript files`);

  let fixedCount = 0;

  for (const filePath of tsFiles) {
    const relativePath = path.relative(GEN_DIR, filePath);

    try {
      const wasFixed = fixImportsInFile(filePath);
      if (wasFixed) {
        console.log(`✅ Fixed: ${relativePath}`);
        fixedCount++;
      }
    } catch (error) {
      console.error(`❌ Error fixing ${relativePath}:`, error.message);
    }
  }

  console.log(`\n🎉 Import fixing completed!`);
  console.log(`📊 Files processed: ${tsFiles.length}`);
  console.log(`🔧 Files fixed: ${fixedCount}`);

  if (fixedCount === 0) {
    console.log("ℹ️  No files needed fixing - all imports are already correct!");
  }
}

main();
