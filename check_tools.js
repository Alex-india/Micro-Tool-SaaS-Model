const fs = require('fs');

const content = fs.readFileSync('./lib/constants.ts', 'utf-8');
const toolBlocks = content.split(/{\s*slug:/g).slice(1);
console.log('Total tool blocks parsed:', toolBlocks.length);

const tools = [];
for (const b of toolBlocks) {
  const slugMatch = b.match(/^\s*"([^"]+)"/);
  const nameMatch = b.match(/name:\s*"([^"]+)"/);
  const catMatch = b.match(/category:\s*"([^"]+)"/);
  if (slugMatch && catMatch) {
    tools.push({
      slug: slugMatch[1],
      name: nameMatch ? nameMatch[1] : '',
      category: catMatch[1],
    });
  }
}

console.log(`Parsed ${tools.length} valid tools.`);

const byCat = {};
for (const t of tools) {
  if (!byCat[t.category]) byCat[t.category] = [];
  byCat[t.category].push(t);
}

for (const [cat, list] of Object.entries(byCat)) {
  console.log(`Category: ${cat} (${list.length} tools)`);
  console.log('   First 3:', list.slice(0, 3).map(x => x.slug).join(', '));
}

const pwd = tools.filter(t => t.slug.includes('password') || t.name.toLowerCase().includes('password'));
console.log('\nPassword tools:', pwd);
