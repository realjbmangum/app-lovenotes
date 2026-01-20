#!/usr/bin/env node

/**
 * Compile all message JSON files into SQL INSERT statements for D1
 */

const fs = require('fs');
const path = require('path');

const MESSAGES_DIR = path.join(__dirname, '../data/messages');
const OUTPUT_FILE = path.join(__dirname, '../data/seed-messages.sql');

function escapeSQL(str) {
  return str.replace(/'/g, "''");
}

function loadMessages() {
  const messages = [];
  const files = fs.readdirSync(MESSAGES_DIR).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const filePath = path.join(MESSAGES_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    messages.push(...data);
  }

  return messages;
}

function generateSQL(messages) {
  const lines = [
    '-- Auto-generated message seed file',
    `-- Generated at: ${new Date().toISOString()}`,
    `-- Total messages: ${messages.length}`,
    '',
    'DELETE FROM messages;', // Clear existing
    '',
  ];

  // Batch inserts for efficiency
  const batchSize = 100;
  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);

    lines.push(`-- Batch ${Math.floor(i / batchSize) + 1}`);
    lines.push('INSERT INTO messages (theme, occasion, content) VALUES');

    const values = batch.map((msg, idx) => {
      const theme = escapeSQL(msg.theme);
      const occasion = msg.occasion ? `'${escapeSQL(msg.occasion)}'` : 'NULL';
      const content = escapeSQL(msg.content);
      const comma = idx < batch.length - 1 ? ',' : ';';
      return `  ('${theme}', ${occasion}, '${content}')${comma}`;
    });

    lines.push(...values);
    lines.push('');
  }

  return lines.join('\n');
}

function main() {
  console.log('Compiling messages...');

  const messages = loadMessages();
  console.log(`Loaded ${messages.length} messages from JSON files`);

  // Count by theme
  const themeCounts = {};
  const occasionCounts = {};

  for (const msg of messages) {
    themeCounts[msg.theme] = (themeCounts[msg.theme] || 0) + 1;
    if (msg.occasion) {
      occasionCounts[msg.occasion] = (occasionCounts[msg.occasion] || 0) + 1;
    }
  }

  console.log('\nBy theme:');
  for (const [theme, count] of Object.entries(themeCounts)) {
    console.log(`  ${theme}: ${count}`);
  }

  console.log('\nBy occasion:');
  for (const [occasion, count] of Object.entries(occasionCounts)) {
    console.log(`  ${occasion}: ${count}`);
  }

  const sql = generateSQL(messages);
  fs.writeFileSync(OUTPUT_FILE, sql);
  console.log(`\nGenerated: ${OUTPUT_FILE}`);
}

main();
