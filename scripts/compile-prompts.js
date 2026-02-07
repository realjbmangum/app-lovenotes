#!/usr/bin/env node
/**
 * Compile prompt template JSON files into SQL INSERT statements
 * Usage: node scripts/compile-prompts.js > data/seed-prompts.sql
 */

const fs = require('fs');
const path = require('path');

const PROMPTS_DIR = path.join(__dirname, '..', 'data', 'prompts');
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'seed-prompts.sql');

const themes = ['romantic', 'funny', 'flirty', 'appreciative', 'encouraging', 'spicy'];

let sql = `-- Auto-generated prompt template seed data
-- Generated: ${new Date().toISOString()}
-- Run: wrangler d1 execute lovenotes-db --file=data/seed-prompts.sql --env production

DELETE FROM prompt_templates WHERE occasion IS NULL;

`;

let totalCount = 0;

for (const theme of themes) {
  const filePath = path.join(PROMPTS_DIR, `${theme}.json`);

  if (!fs.existsSync(filePath)) {
    console.error(`Warning: ${filePath} not found, skipping`);
    continue;
  }

  const prompts = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  sql += `-- ${theme} prompts (${prompts.length})\n`;

  for (const prompt of prompts) {
    const nudge = prompt.nudge.replace(/'/g, "''");
    const starter = prompt.starter.replace(/'/g, "''");
    const tags = prompt.tags ? `'${prompt.tags.replace(/'/g, "''")}'` : 'NULL';
    const occasion = prompt.occasion ? `'${prompt.occasion.replace(/'/g, "''")}'` : 'NULL';
    const requiresLog = prompt.requires_log ? 1 : 0;

    sql += `INSERT INTO prompt_templates (theme, occasion, nudge_text, starter_text, requires_log, tags) VALUES ('${theme}', ${occasion}, '${nudge}', '${starter}', ${requiresLog}, ${tags});\n`;
    totalCount++;
  }

  sql += '\n';
}

fs.writeFileSync(OUTPUT_FILE, sql);
console.log(`Compiled ${totalCount} prompt templates across ${themes.length} themes`);
console.log(`Output: ${OUTPUT_FILE}`);
