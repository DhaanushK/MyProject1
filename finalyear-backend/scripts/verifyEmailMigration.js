#!/usr/bin/env node

/**
 * 📧 EMAIL MIGRATION VERIFICATION SCRIPT
 * =====================================
 * This script helps verify that all email addresses have been properly
 * updated throughout your project after the MongoDB email changes.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const EMAIL_PATTERNS = [
  /@gmail\.com/g,
  /@example\.com/g,
  /dhaanushk1110/g,
  /kanishka.*gmail/g,
  /praveen.*gmail/g,
  /winnish.*gmail/g,
  /vuppu.*gmail/g,
  /jsam.*gmail/g,
  /kkumar.*gmail/g
];

const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.git/,
  /\.env$/,
  /\.log$/,
  /dist/,
  /build/,
  /coverage/,
  /\.min\./,
  /\.bundle\./
];

const FILE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.txt', '.env.example'];

/**
 * Recursively search for files containing email patterns
 */
function searchFiles(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    // Skip excluded directories/files
    if (EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath))) {
      continue;
    }
    
    if (stat.isDirectory()) {
      searchFiles(filePath, results);
    } else if (FILE_EXTENSIONS.includes(path.extname(file).toLowerCase())) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const matches = [];
        
        EMAIL_PATTERNS.forEach((pattern, index) => {
          const patternMatches = content.match(pattern);
          if (patternMatches) {
            matches.push({
              pattern: pattern.source,
              matches: patternMatches,
              lines: getLineNumbers(content, pattern)
            });
          }
        });
        
        if (matches.length > 0) {
          results.push({
            file: filePath,
            matches: matches
          });
        }
      } catch (error) {
        console.log(`⚠️  Could not read file: ${filePath}`);
      }
    }
  }
  
  return results;
}

/**
 * Get line numbers where pattern matches occur
 */
function getLineNumbers(content, pattern) {
  const lines = content.split('\n');
  const lineNumbers = [];
  
  lines.forEach((line, index) => {
    if (pattern.test(line)) {
      lineNumbers.push({
        lineNumber: index + 1,
        content: line.trim()
      });
    }
  });
  
  return lineNumbers;
}

/**
 * Generate Postman collection update helper
 */
function generatePostmanHelper() {
  const postmanHelper = `
/**
 * 📮 POSTMAN COLLECTION EMAIL UPDATE HELPER
 * =========================================
 * Use this script to update emails in exported Postman collections
 */

const fs = require('fs');

const emailMapping = {
  'dhaanushk1110@gmail.com': 'dhaanushk1110@gmail.com', // Keep unchanged
  'kanishka.a0208@gmail.com': 'kanishkka0208@gmail.com',
  'praveenj.jio@gmail.com': 'japraveen1212@gmail.com',
  'winnishej703@gmail.com': 'winnish0703@gmail.com',
  'reddyvuppu@gmail.com': 'reddyvuppu3@gmail.com', // Updated
  'jsam01@gmail.com': 'jsam290104@gmail.com', // Updated
  'kkumar05@gmail.com': 'kkumar210504@gmail.com'
};

function updatePostmanCollection(collectionPath) {
  try {
    const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));
    let updated = JSON.stringify(collection, null, 2);
    
    Object.entries(emailMapping).forEach(([oldEmail, newEmail]) => {
      updated = updated.replace(new RegExp(oldEmail, 'g'), newEmail);
    });
    
    const outputPath = collectionPath.replace('.json', '_updated.json');
    fs.writeFileSync(outputPath, updated);
    console.log('✅ Updated collection saved as:', outputPath);
  } catch (error) {
    console.error('❌ Error updating collection:', error.message);
  }
}

// Usage: updatePostmanCollection('./your_collection.json');
module.exports = { updatePostmanCollection, emailMapping };
`;

  fs.writeFileSync(path.join(__dirname, 'postman-email-updater.js'), postmanHelper);
  console.log('📮 Created Postman helper script: postman-email-updater.js');
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 EMAIL MIGRATION VERIFICATION REPORT');
  console.log('=====================================\n');
  
  const projectRoot = path.resolve(__dirname, '..');
  console.log('📂 Scanning project directory:', projectRoot);
  console.log('');
  
  const results = searchFiles(projectRoot);
  
  if (results.length === 0) {
    console.log('✅ No old email patterns found! All emails appear to be updated.');
  } else {
    console.log('⚠️  Found potential email references that may need updating:\n');
    
    results.forEach((result, index) => {
      console.log(`${index + 1}. 📄 ${result.file}`);
      result.matches.forEach(match => {
        console.log(`   🔍 Pattern: ${match.pattern}`);
        console.log(`   📍 Found: ${match.matches.join(', ')}`);
        match.lines.forEach(line => {
          console.log(`   📝 Line ${line.lineNumber}: ${line.content}`);
        });
        console.log('');
      });
    });
    
    console.log('📋 NEXT STEPS:');
    console.log('1. Review each file listed above');
    console.log('2. Update any remaining old email references');
    console.log('3. Run this script again to verify all updates');
    console.log('4. Test your application with the new emails');
  }
  
  // Generate Postman helper
  generatePostmanHelper();
  
  console.log('\\n🎯 EMAIL UPDATE CHECKLIST:');
  console.log('☐ MongoDB users collection (manually updated via Compass)');
  console.log('☐ Backend scripts (createUser.js, checkUser.js)');
  console.log('☐ Google Sheets data (manual update required)');
  console.log('☐ Postman collections (use generated helper script)');
  console.log('☐ Test with new login credentials');
  console.log('☐ Verify Google Sheets integration works');
  console.log('\\n🚀 Ready for email integration implementation!');
}

// Run the script
main();