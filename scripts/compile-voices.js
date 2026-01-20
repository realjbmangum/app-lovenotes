#!/usr/bin/env node
/**
 * Compile voice messages into SQL for D1
 */

const fs = require('fs');
const path = require('path');

const voicesDir = path.join(__dirname, '..', 'data', 'voices');
const outputFile = path.join(__dirname, '..', 'data', 'seed-voices.sql');

const voices = ['quick', 'flirty', 'deep', 'grateful', 'sorry', 'supportive', 'proud', 'playful'];

let allMessages = [];
let id = 1;

for (const voice of voices) {
  const filePath = path.join(voicesDir, `${voice}.json`);
  if (fs.existsSync(filePath)) {
    const messages = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    for (const msg of messages) {
      allMessages.push({
        id: id++,
        voice: msg.voice,
        content: msg.content
      });
    }
    console.log(`Loaded ${messages.length} messages from ${voice}.json`);
  }
}

console.log(`\nTotal messages: ${allMessages.length}`);

// Generate SQL
let sql = `-- Voice messages for LoveNotes
-- Generated: ${new Date().toISOString()}
-- Total: ${allMessages.length} messages

`;

// Insert messages in batches of 50
const batchSize = 50;
for (let i = 0; i < allMessages.length; i += batchSize) {
  const batch = allMessages.slice(i, i + batchSize);
  sql += `INSERT INTO messages (id, theme, content) VALUES\n`;

  const values = batch.map((msg, idx) => {
    const escapedContent = msg.content.replace(/'/g, "''");
    const comma = idx < batch.length - 1 ? ',' : ';';
    return `  (${msg.id}, '${msg.voice}', '${escapedContent}')${comma}`;
  });

  sql += values.join('\n') + '\n\n';
}

fs.writeFileSync(outputFile, sql);
console.log(`\nGenerated: ${outputFile}`);

// Summary by voice
console.log('\nBy voice:');
for (const voice of voices) {
  const count = allMessages.filter(m => m.voice === voice).length;
  console.log(`  ${voice}: ${count}`);
}
