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
      name: nameMatch ? nameMatch[1] : slugMatch[1],
    });
  }
}

const pdfTools = tools.filter(t => t.category === 'pdf');
const videoTools = tools.filter(t => t.category === 'video');

console.log(`Auditing target tools:`);
console.log(`- PDF Tools: ${pdfTools.length}`);
console.log(`- Video & Audio Tools: ${videoTools.length}`);
console.log(`Total: ${pdfTools.length + videoTools.length}\n`);

async function audit() {
  const allTargetTools = [...pdfTools, ...videoTools];
  let success = 0;
  let failed = [];

  for (const t of allTargetTools) {
    const url = `http://localhost:3000/${t.category}/${t.slug}`;
    try {
      const res = await fetch(url);
      if (res.status !== 200) {
        failed.push({ tool: t.slug, category: t.category, status: res.status });
      } else {
        const text = await res.text();
        if (text.includes("Application error: a client-side exception has occurred")) {
          failed.push({ tool: t.slug, category: t.category, error: "Client-side exception in render" });
        } else {
          success++;
          console.log(`✓ [200 OK] /${t.category}/${t.slug} (${t.name})`);
        }
      }
    } catch (e) {
      failed.push({ tool: t.slug, category: t.category, error: e.message });
    }
  }

  console.log(`\n========================================`);
  console.log(`Audit Results: ${success} / ${allTargetTools.length} Passed`);
  if (failed.length > 0) {
    console.log(`Failed:`, failed);
  }
  console.log(`========================================\n`);
}

audit();
