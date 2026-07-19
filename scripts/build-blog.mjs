import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";
import matter from "gray-matter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CONTENT_DIR = path.join(ROOT, "content");
const OUT_DIR = path.join(ROOT, "dist", "blog");

function template({ title, meta, keywords, bodyHtml, canonicalPath }) {
  const kw = Array.isArray(keywords) ? keywords.join(", ") : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title} | Gluebird</title>
<meta name="description" content="${meta}" />
<meta name="keywords" content="${kw}" />
<link rel="canonical" href="https://gluebird.com${canonicalPath}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${meta}" />
<meta property="og:type" content="article" />
<link rel="icon" type="image/svg+xml" href="/mascot.svg" />
<style>
  :root { --ink:#141311; --dim:#5C594E; --hair:#E4E0D4; --orange:#FF6A00; --orange-deep:#D45700; --bg:#FFFFFF; }
  * { box-sizing: border-box; }
  body { margin:0; font-family: 'Barlow', 'Helvetica Neue', Arial, sans-serif; background: var(--bg); color: var(--ink); line-height:1.6; }
  header { border-bottom: 3px solid var(--ink); padding: 18px 20px; display:flex; align-items:center; justify-content:space-between; }
  header a.logo { font-family: Georgia, serif; font-weight:800; font-size: 22px; letter-spacing: 0.02em; color: var(--ink); text-decoration:none; text-transform:uppercase; }
  header nav a { color: var(--ink); text-decoration:none; font-weight:600; margin-left:18px; font-size:14px; }
  main { max-width: 720px; margin: 0 auto; padding: 36px 20px 60px; }
  h1 { font-size: 34px; line-height:1.15; margin: 0 0 10px; }
  h2 { font-size: 22px; margin-top: 34px; border-bottom: 2px solid var(--hair); padding-bottom: 6px; }
  a { color: var(--orange-deep); }
  ul { padding-left: 20px; }
  li { margin-bottom: 6px; }
  .cta { display:inline-block; margin-top: 28px; background: var(--ink); color:#fff; padding: 12px 22px; border-radius:3px; text-decoration:none; font-weight:700; text-transform:uppercase; letter-spacing:0.03em; font-size:13px; }
  .cta:hover { background: var(--orange); }
  footer { border-top: 1px solid var(--hair); padding: 24px 20px; text-align:center; color: var(--dim); font-size: 13px; }
</style>
</head>
<body>
<header>
  <a class="logo" href="/">Gluebird</a>
  <nav><a href="/blog/">Guides</a><a href="/">Bond Finder</a></nav>
</header>
<main>
${bodyHtml}
<a class="cta" href="/">Try the Gluebird Bond Finder →</a>
</main>
<footer>Gluebird — general adhesive guidance. Always check the product label for specifics.</footer>
</body>
</html>`;
}

function fixLinks(html) {
  // content links are relative .md paths like ../glues/epoxy-adhesive.md or pairs/foo.md or ../index.md
  return html
    .replace(/href="\.\.\/glues\/([a-z0-9-]+)\.md"/g, 'href="/blog/glues/$1/"')
    .replace(/href="\.\.\/pairs\/([a-z0-9-]+)\.md"/g, 'href="/blog/pairs/$1/"')
    .replace(/href="([a-z0-9-]+)\.md"/g, 'href="/blog/pairs/$1/"')
    .replace(/href="glues\/([a-z0-9-]+)\.md"/g, 'href="/blog/glues/$1/"')
    .replace(/href="pairs\/([a-z0-9-]+)\.md"/g, 'href="/blog/pairs/$1/"')
    .replace(/href="\.\.\/index\.md"/g, 'href="/blog/"')
    .replace(/href="#"/g, 'href="/"');
}

function buildOne(mdPath, outPath, canonicalPath) {
  const raw = fs.readFileSync(mdPath, "utf8");
  const { data, content } = matter(raw);
  let bodyHtml = marked.parse(content);
  bodyHtml = fixLinks(bodyHtml);
  const html = template({
    title: data.title || "Gluebird",
    meta: data.meta_description || "",
    keywords: data.keywords || [],
    bodyHtml,
    canonicalPath,
  });
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html);
}

// index
fs.mkdirSync(OUT_DIR, { recursive: true });
buildOne(path.join(CONTENT_DIR, "index.md"), path.join(OUT_DIR, "index.html"), "/blog/");

// glues
for (const file of fs.readdirSync(path.join(CONTENT_DIR, "glues"))) {
  const slug = file.replace(/\.md$/, "");
  buildOne(
    path.join(CONTENT_DIR, "glues", file),
    path.join(OUT_DIR, "glues", slug, "index.html"),
    `/blog/glues/${slug}/`
  );
}

// pairs
for (const file of fs.readdirSync(path.join(CONTENT_DIR, "pairs"))) {
  const slug = file.replace(/\.md$/, "");
  buildOne(
    path.join(CONTENT_DIR, "pairs", file),
    path.join(OUT_DIR, "pairs", slug, "index.html"),
    `/blog/pairs/${slug}/`
  );
}

console.log("Blog build complete:", OUT_DIR);
