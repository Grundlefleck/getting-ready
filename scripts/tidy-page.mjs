import fs from "fs";
import path from "path";

const build = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  "..",
  "build",
);
const replacements = [
  ["/manifest.json", "/tidy/manifest.json"],
  ["/apple-touch-icon.png", "/tidy/apple-touch-icon.png"],
  ["<title>Getting ready</title>", "<title>Getting tidy</title>"],
  ['content="Getting ready"', 'content="Getting tidy"'],
  ['content="#dbeafe"', 'content="#fef3c7"'],
];

let html = fs.readFileSync(path.join(build, "index.html"), "utf8");
for (const [from, to] of replacements) {
  if (!html.includes(from)) {
    throw new Error(`tidy-page: "${from}" not found in build/index.html`);
  }
  html = html.replace(from, to);
}
fs.writeFileSync(path.join(build, "tidy", "index.html"), html);
