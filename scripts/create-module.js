const fs = require('fs');
const path = require('path');

const templateDir = path.join(__dirname, '../src/modules/_template');
const moduleName = process.argv[2];

if (!moduleName) {
  console.error('Usage: node create-module.js <module-name>');
  process.exit(1);
}

const targetDir = path.join(__dirname, '../src/modules', moduleName);

if (fs.existsSync(targetDir)) {
  console.error(`Module "${moduleName}" already exists`);
  process.exit(1);
}

fs.cpSync(templateDir, targetDir, { recursive: true });

const moduleJsonPath = path.join(targetDir, 'module.json');
const moduleJson = JSON.parse(fs.readFileSync(moduleJsonPath, 'utf-8'));
moduleJson.name = moduleName;
fs.writeFileSync(moduleJsonPath, JSON.stringify(moduleJson, null, 2));

console.log(`Module "${moduleName}" created successfully`);