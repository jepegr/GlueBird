// Fetches product images from Amazon's Product Advertising API (PA API 5.0)
// and writes content/product-images.json for the site to display alongside
// "View product" buttons. This is the only Amazon-sanctioned way to pull
// product images for an Associates site — do not scrape product pages.
//
// Requires content/product-asins.json to be filled in with real ASINs, and
// these env vars set: PAAPI_ACCESS_KEY, PAAPI_SECRET_KEY, PAAPI_PARTNER_TAG
//
// Usage: node scripts/fetch-product-images.mjs

import { createHmac, createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASIN_MAP_PATH = path.join(__dirname, "../content/product-asins.json");
const OUTPUT_PATH = path.join(__dirname, "../content/product-images.json");

// PA API 5.0 host + region per marketplace. Add more if you route to
// additional Amazon stores (see MARKET_BY_COUNTRY in src/App.jsx).
const MARKETPLACES = {
  "www.amazon.com": { host: "webservices.amazon.com", region: "us-east-1" },
  "www.amazon.de": { host: "webservices.amazon.de", region: "eu-west-1" },
  "www.amazon.co.uk": { host: "webservices.amazon.co.uk", region: "eu-west-1" },
  "www.amazon.fr": { host: "webservices.amazon.fr", region: "eu-west-1" },
  "www.amazon.it": { host: "webservices.amazon.it", region: "eu-west-1" },
  "www.amazon.es": { host: "webservices.amazon.es", region: "eu-west-1" },
};

const ACCESS_KEY = process.env.PAAPI_ACCESS_KEY;
const SECRET_KEY = process.env.PAAPI_SECRET_KEY;
const PARTNER_TAG = process.env.PAAPI_PARTNER_TAG;

if (!ACCESS_KEY || !SECRET_KEY || !PARTNER_TAG) {
  console.error(
    "Missing credentials. Set PAAPI_ACCESS_KEY, PAAPI_SECRET_KEY, and PAAPI_PARTNER_TAG " +
    "(from Associates Central -> Tools -> Product Advertising API) before running this script."
  );
  process.exit(1);
}

function sign(key, msg) {
  return createHmac("sha256", key).update(msg, "utf8").digest();
}

function sha256Hex(msg) {
  return createHash("sha256").update(msg, "utf8").digest("hex");
}

// AWS Signature Version 4 — see docs/paapi5/troubleshooting/api-request-signing.html
async function callGetItems(marketplace, asins) {
  const { host, region } = MARKETPLACES[marketplace];
  const service = "ProductAdvertisingAPI";
  const target = "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems";
  const uri = "/paapi5/getitems";
  const endpoint = `https://${host}${uri}`;

  const payload = JSON.stringify({
    ItemIds: asins,
    Resources: ["Images.Primary.Large"],
    PartnerTag: PARTNER_TAG,
    PartnerType: "Associates",
    Marketplace: marketplace,
  });

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);

  const canonicalHeaders =
    `content-encoding:amz-1.0\n` +
    `content-type:application/json; charset=utf-8\n` +
    `host:${host}\n` +
    `x-amz-date:${amzDate}\n` +
    `x-amz-target:${target}\n`;
  const signedHeaders = "content-encoding;content-type;host;x-amz-date;x-amz-target";

  const canonicalRequest =
    `POST\n${uri}\n\n${canonicalHeaders}\n${signedHeaders}\n${sha256Hex(payload)}`;

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign =
    `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${sha256Hex(canonicalRequest)}`;

  const kDate = sign(`AWS4${SECRET_KEY}`, dateStamp);
  const kRegion = sign(kDate, region);
  const kService = sign(kRegion, service);
  const kSigning = sign(kService, "aws4_request");
  const signature = sign(kSigning, stringToSign).toString("hex");

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-encoding": "amz-1.0",
      "content-type": "application/json; charset=utf-8",
      "x-amz-date": amzDate,
      "x-amz-target": target,
      authorization,
    },
    body: payload,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PA API ${res.status} for ${marketplace}: ${text}`);
  }
  return res.json();
}

async function main() {
  const asinMap = JSON.parse(await readFile(ASIN_MAP_PATH, "utf8"));
  const entries = Object.entries(asinMap).filter(([key]) => key !== "_comment");

  const byMarketplace = new Map();
  for (const [name, info] of entries) {
    if (!info?.asin) continue;
    if (!byMarketplace.has(info.marketplace)) byMarketplace.set(info.marketplace, []);
    byMarketplace.get(info.marketplace).push({ name, asin: info.asin });
  }

  if (byMarketplace.size === 0) {
    console.log("No ASINs filled in yet in content/product-asins.json — nothing to fetch.");
    return;
  }

  const images = {};
  for (const [marketplace, items] of byMarketplace) {
    if (!MARKETPLACES[marketplace]) {
      console.warn(`Skipping unknown marketplace "${marketplace}"`);
      continue;
    }
    // PA API allows up to 10 ASINs per GetItems call.
    for (let i = 0; i < items.length; i += 10) {
      const batch = items.slice(i, i + 10);
      const data = await callGetItems(marketplace, batch.map((b) => b.asin));
      for (const item of data.ItemsResult?.Items ?? []) {
        const match = batch.find((b) => b.asin === item.ASIN);
        const url = item.Images?.Primary?.Large?.URL;
        if (match && url) images[match.name] = url;
      }
      for (const err of data.Errors ?? []) {
        console.warn(`PA API error: ${err.Code} — ${err.Message}`);
      }
      // Stay well under the default 1 request/sec throttle.
      await new Promise((r) => setTimeout(r, 1100));
    }
  }

  const existing = JSON.parse(await readFile(OUTPUT_PATH, "utf8"));
  const merged = { ...existing, ...images };
  await writeFile(OUTPUT_PATH, JSON.stringify(merged, null, 2) + "\n");
  console.log(`Wrote ${Object.keys(images).length} image URL(s) to content/product-images.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
