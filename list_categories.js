const fs = require('fs');
const content = fs.readFileSync('./lib/constants.ts', 'utf-8');
const toolBlocks = content.split(/{\s*slug:/g).slice(1);
const tools = [];
for (const b of toolBlocks) {
  const slugMatch = b.match(/^\s*"([^"]+)"/);
  const catMatch = b.match(/category:\s*"([^"]+)"/);
  const nameMatch = b.match(/name:\s*"([^"]+)"/);
  if (slugMatch && catMatch) {
    tools.push({
      slug: slugMatch[1],
      category: catMatch[1],
      name: nameMatch ? nameMatch[1] : slugMatch[1]
    });
  }
}

const byCat = {};
for (const t of tools) {
  if (!byCat[t.category]) byCat[t.category] = [];
  byCat[t.category].push(t.slug + ' (' + t.name + ')');
}

for (const [cat, list] of Object.entries(byCat)) {
  console.log(`\n=== CATEGORY: ${cat.toUpperCase()} (${list.length} tools) ===`);
  list.forEach((s, idx) => console.log(`  ${idx + 1}. ${s}`));
}
