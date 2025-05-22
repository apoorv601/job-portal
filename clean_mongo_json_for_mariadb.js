// clean_mongo_json_for_mariadb.js
// Usage: node clean_mongo_json_for_mariadb.js
// This script will clean and transform MongoDB-exported JSON files for MariaDB import.
// It will:
//   - Remove or fix invalid dates
//   - Convert MongoDB ObjectIDs to integer IDs (mapping required)
//   - Remove $oid wrappers
//   - Output cleaned files as *_cleaned.json

const fs = require('fs');
const path = require('path');

// Helper: parse date or return null
function parseDate(val) {
  if (!val || val === 'Invalid date') return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 19).replace('T', ' ');
}

// Helper: flatten $oid
function flattenOid(val) {
  if (val && typeof val === 'object' && val.$oid) return val.$oid;
  return val;
}

// Helper: recursively clean an object
function cleanObj(obj) {
  if (Array.isArray(obj)) return obj.map(cleanObj);
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const k in obj) {
      if (k === '$oid') return obj[k];
      if (k === 'createdAt' || k === 'updatedAt' || k === 'lastLogin' || k === 'postedAt' || k === 'appliedAt') {
        out[k] = parseDate(obj[k]);
      } else if (k.endsWith('Id') && typeof obj[k] === 'object' && obj[k].$oid) {
        out[k] = obj[k].$oid; // Will need mapping to integer after import
      } else {
        out[k] = cleanObj(obj[k]);
      }
    }
    return out;
  }
  return obj;
}

function cleanFile(filename) {
  const raw = fs.readFileSync(filename, 'utf8');
  const data = JSON.parse(raw);
  const cleaned = cleanObj(data);
  const outname = filename.replace(/\.json$/, '_cleaned.json');
  fs.writeFileSync(outname, JSON.stringify(cleaned, null, 2));
  console.log(`Cleaned: ${filename} -> ${outname}`);
}

const files = ['users.json', 'jobs.json', 'companies.json', 'applications.json'];
for (const file of files) {
  if (fs.existsSync(file)) cleanFile(file);
  else console.warn(`File not found: ${file}`);
}

console.log('Cleaning complete. You must manually map string IDs to integer IDs after import.');
