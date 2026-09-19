const http = require('http');

async function testAllAPIs() {
  console.log("Testing Text & Privacy Backend APIs on Next.js server...");

  const endpoints = [
    {
      url: "http://localhost:3000/api/text/word-counter",
      body: { text: "Hello world. This is a complete test of the ToolVerse word counter API." },
    },
    {
      url: "http://localhost:3000/api/text/character-counter",
      body: { text: "Testing character counter limits for social and SEO." },
    },
    {
      url: "http://localhost:3000/api/text/transform",
      body: { text: "apple\nbanana\napple", operation: "remove-duplicates" },
    },
    {
      url: "http://localhost:3000/api/text/case-converter",
      body: { text: "hello world", targetCase: "camelCase" },
    },
    {
      url: "http://localhost:3000/api/text/text-diff",
      body: { originalText: "line 1\nline 2", modifiedText: "line 1\nline 2 modified" },
    },
    {
      url: "http://localhost:3000/api/text/slug-generator",
      body: { text: "How to Build High-Yield SaaS in 2026!" },
    },
    {
      url: "http://localhost:3000/api/privacy/password-generator",
      body: { length: 20, count: 3, includeUppercase: true, includeNumbers: true },
    },
    {
      url: "http://localhost:3000/api/privacy/secure-random",
      body: { length: 32, format: "hex" },
    },
    {
      url: "http://localhost:3000/api/privacy/hash",
      body: { text: "ToolVerse Security", algorithm: "sha256" },
    },
    {
      url: "http://localhost:3000/api/privacy/qr-code",
      body: { text: "https://toolverse.app", size: 300, format: "png" },
    },
    {
      url: "http://localhost:3000/api/privacy/metadata-remover",
      body: { fileName: "photo.jpg", sizeBytes: 245000 },
    },
  ];

  let passed = 0;
  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ep.body),
      });

      if (res.status === 200) {
        const data = await res.json();
        console.log(`[PASS] ${ep.url} -> Status: 200, Success: ${data.success}`);
        passed++;
      } else {
        console.error(`[FAIL] ${ep.url} -> Status: ${res.status}`);
      }
    } catch (err) {
      console.error(`[ERR] ${ep.url} -> ${err.message}`);
    }
  }

  console.log(`\n========================================`);
  console.log(`API Tests Result: ${passed} / ${endpoints.length} passed`);
  console.log(`========================================\n`);
}

testAllAPIs();
