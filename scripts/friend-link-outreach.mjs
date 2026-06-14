#!/usr/bin/env node

/**
 * Friend Link Building Tool (Outreach Automation)
 * 
 * Generates personalized outreach emails for friend link building.
 * Target: free tool directories, indie maker blogs, SEO/affiliate sites.
 * 
 * Usage: node scripts/friend-link-outreach.mjs
 * Output: outreach-list.json + email templates
 */

import { writeFileSync, readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "public", "data");
const OUT_FILE = join(DATA_DIR, "outreach-list.json");

// Target sites for outreach (free tool directories, indie blogs, SEO sites)
const TARGETS = [
  {
    name: "AlternativeTo",
    url: "https://alternativeto.com",
    type: "directory",
    contact: "https://alternativeto.com/contact/",
    why: "Craftisle provides free alternatives data that complements AlternativeTo's paid tool listings.",
  },
  {
    name: "Product Hunt",
    url: "https://www.producthunt.com",
    type: "directory",
    contact: "https://www.producthunt.com/contact",
    why: "Craftisle's free tools list is a great resource for PH community members.",
  },
  {
    name: "Awesome Lists (GitHub)",
    url: "https://github.com/sindresorhus/awesome",
    type: "github",
    contact: "https://github.com/sindresorhus/awesome/blob/main/contributing.md",
    why: "Craftisle's free tools directory can be added to relevant Awesome lists.",
  },
  {
    name: "Free for Dev",
    url: "https://free-for.dev",
    type: "directory",
    contact: "https://github.com/ripienaar/free-for-dev/blob/master/README.md",
    why: "Craftisle curates free dev resources, complementary to free-for.dev.",
  },
  {
    name: "LibHunt",
    url: "https://libhunt.com",
    type: "directory",
    contact: "https://libhunt.com/contact",
    why: "Craftisle's tool reviews can drive traffic to LibHunt discussions.",
  },
];

// Email template generator
function generateEmailTemplate(target, craftisleUrl, craftisleDesc) {
  return {
    to: target.contact,
    subject: `Free Tools Directory - Link Exchange Opportunity`,
    body: `
Hi ${target.name} team,

I hope this email finds you well. I'm the founder of Craftisle (${craftisleUrl}), a free tools directory that helps developers and makers find high-quality free alternatives to paid software.

I noticed that ${target.name} provides great resources for [relevant audience]. I think Craftisle would be a valuable addition to your [directory/list/resources] because:

- ${target.why}
- We have 16,000+ curated free resources across 20+ categories
- All data is open-source and regularly updated

I've also included a link to ${target.name} from our [relevant page], which I think your users would find useful.

Would you be open to reviewing Craftisle for inclusion? Happy to provide any additional information.

Best,
[Your Name]
Founder, Craftisle
${craftisleUrl}
    `.trim(),
  };
}

async function main() {
  console.log("🔗 Starting friend link outreach automation...\n");

  const craftisleUrl = "https://craftisle.com";
  const craftisleDesc = "Free tools directory with 16,000+ curated resources";

  const outreachList = TARGETS.map((target) => ({
    ...target,
    emailTemplate: generateEmailTemplate(target, craftisleUrl, craftisleDesc),
    status: "pending", // pending | sent | replied | accepted | rejected
    dateAdded: new Date().toISOString().split("T")[0],
  }));

  writeFileSync(OUT_FILE, JSON.stringify(outreachList, null, 2));
  console.log(`✅ Generated outreach list: ${OUT_FILE}`);
  console.log(`   ${outreachList.length} targets identified.`);
  console.log("\n📧 Next steps:");
  console.log("   1. Review outreach-list.json");
  console.log("   2. Customize email templates");
  console.log("   3. Send outreach emails (manual or via email API)");
  console.log("   4. Track responses and update status");
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
