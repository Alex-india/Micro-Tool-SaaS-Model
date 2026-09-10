const fs = require('fs');

async function auditAll209Tools() {
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

  console.log(`Auditing all ${tools.length} tools on http://localhost:3000...`);

  let success = 0;
  let failures = [];

  for (let i = 0; i < tools.length; i++) {
    const t = tools[i];
    const url = `http://localhost:3000/${t.category}/${t.slug}`;
    try {
      const res = await fetch(url);
      if (res.status !== 200) {
        failures.push({ tool: t, status: res.status });
      } else {
        const text = await res.text();
        // Ensure the title and main tags are present and no React error boundary
        if (!text.includes(t.name) || text.includes("Application error: a client-side exception has occurred")) {
          failures.push({ tool: t, reason: "Page failed render check" });
        } else {
          success++;
        }
      }
    } catch (e) {
      failures.push({ tool: t, error: e.message });
    }
  }

  console.log(`\n========================================`);
  console.log(`Audit Summary:`);
  console.log(`Successfully Verified: ${success} / ${tools.length}`);
  console.log(`Failures: ${failures.length}`);
  if (failures.length > 0) {
    console.log(`Failed tools:`, failures);
  }
  console.log(`========================================\n`);
}

auditAll209Tools();
