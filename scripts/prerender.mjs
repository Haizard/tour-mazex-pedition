import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

const routes = [
  "/",
  "/about",
  "/contact",
  "/blogs",
  "/blogs/category/safari",
  "/blogs/category/trekking",
  "/blogs/category/other",
  "/packages",
  "/destinations",
  "/destinations/serengeti",
  "/destinations/ngorongoro",
  "/destinations/tarangire",
  "/destinations/manyara",
  "/destinations/natron",
  "/plan-my-trip",
  "/privacy-policy",
  "/terms",
];

const { render } = await import(pathToFileUrl(path.join(rootDir, "dist", "server", "entry-server.js")));

const template = await fs.readFile(path.join(distDir, "index.html"), "utf8");

for (const route of routes) {
  const { appHtml, headTags } = render(route);
  const html = template
    .replace("<div id=\"root\"></div>", `<div id="root">${appHtml}</div>`)
    .replace("</head>", `${headTags}</head>`);

  const routePath = route === "/" ? path.join(distDir, "index.html") : path.join(distDir, route.slice(1), "index.html");
  await fs.mkdir(path.dirname(routePath), { recursive: true });
  await fs.writeFile(routePath, html, "utf8");
}

function pathToFileUrl(filePath) {
  const resolvedPath = path.resolve(filePath).replace(/\\/g, "/");
  return `file:///${resolvedPath}`;
}
