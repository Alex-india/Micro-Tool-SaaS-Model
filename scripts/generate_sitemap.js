const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '../lib/constants.ts'), 'utf-8');
const toolBlocks = content.split(/{\s*slug:/g).slice(1);
const tools = [];

for (const b of toolBlocks) {
  const pathMatch = b.match(/path:\s*"([^"]+)"/);
  const popMatch = b.match(/isPopular:\s*(true|false)/);
  if (pathMatch) {
    tools.push({
      path: pathMatch[1],
      isPopular: popMatch ? popMatch[1] === 'true' : false,
    });
  }
}

const categories = [
  'finance',
  'pdf',
  'image',
  'video',
  'text',
  'developer',
  'web',
  'student',
  'calculators',
  'business',
  'privacy',
  'converters',
  'creator',
];

const baseUrl = 'https://toolverse.app';
const currentDate = new Date().toISOString().split('T')[0];

let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

// Static pages
const staticPages = [
  { url: '', priority: '1.0', changefreq: 'daily' },
  { url: '/tools', priority: '0.9', changefreq: 'daily' },
  { url: '/pricing', priority: '0.8', changefreq: 'weekly' },
  { url: '/about', priority: '0.7', changefreq: 'monthly' },
  { url: '/contact', priority: '0.6', changefreq: 'monthly' },
  { url: '/privacy', priority: '0.3', changefreq: 'yearly' },
  { url: '/terms', priority: '0.3', changefreq: 'yearly' },
];

for (const p of staticPages) {
  xml += '  <url>\n';
  xml += '    <loc>' + baseUrl + p.url + '</loc>\n';
  xml += '    <lastmod>' + currentDate + '</lastmod>\n';
  xml += '    <changefreq>' + p.changefreq + '</changefreq>\n';
  xml += '    <priority>' + p.priority + '</priority>\n';
  xml += '  </url>\n';
}

// Categories
for (const cat of categories) {
  xml += '  <url>\n';
  xml += '    <loc>' + baseUrl + '/' + cat + '</loc>\n';
  xml += '    <lastmod>' + currentDate + '</lastmod>\n';
  xml += '    <changefreq>daily</changefreq>\n';
  xml += '    <priority>0.85</priority>\n';
  xml += '  </url>\n';
}

// Tools
for (const t of tools) {
  xml += '  <url>\n';
  xml += '    <loc>' + baseUrl + t.path + '</loc>\n';
  xml += '    <lastmod>' + currentDate + '</lastmod>\n';
  xml += '    <changefreq>weekly</changefreq>\n';
  xml += '    <priority>' + (t.isPopular ? '0.9' : '0.8') + '</priority>\n';
  xml += '  </url>\n';
}

xml += '</urlset>\n';

const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml, 'utf-8');
console.log(`Generated public/sitemap.xml with ${staticPages.length + categories.length + tools.length} URLs.`);
