import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Blog from "../backend/models/Blog.js";
import MenuItem from "../backend/models/MenuItem.js";
import SiteSettings from "../backend/models/SiteSettings.js";
import Taxonomy from "../backend/models/Taxonomy.js";
import TourPackage from "../backend/models/TourPackage.js";
import { DESTINATION_META } from "../src/data/destinationMeta.js";
import {
  buildBlogSidebarData,
  buildDestinationFaqs,
  buildDynamicRoutes,
  buildPackageRelatedTours,
  matchDestinationBlog,
  matchDestinationTours,
} from "../src/utils/contentMatchers.js";
import { slugifySeo } from "../src/utils/seo.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

dotenv.config({ path: path.join(rootDir, ".env") });

const baseRoutes = [
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
  "/login",
  "/admin/login",
  "/plan-my-trip",
  "/platform/login",
  "/privacy-policy",
  "/super-admin/login",
  "/terms",
];

const { render } = await import(pathToFileUrl(path.join(rootDir, "dist", "server", "entry-server.js")));

const template = sanitizeTemplate(await fs.readFile(path.join(distDir, "index.html"), "utf8"));

const { blogs, tours, menuItems, siteSettings, taxonomies } = await fetchCmsContent();
const destinations = Object.values(DESTINATION_META);
const routes = [...new Set([...baseRoutes, ...buildDynamicRoutes({ blogs, tours, destinations })])];

for (const route of routes) {
  const routeData = buildRouteData(route, {
    blogs,
    tours,
    destinations,
    menuItems,
    siteSettings,
    taxonomies,
  });
  const { appHtml, headTags } = render(route, routeData);
  const dataScript = `<script>window.__PRERENDER_DATA__=${JSON.stringify(routeData).replace(/</g, "\\u003c")}</script>`;
  const html = template
    .replace("<div id=\"root\"></div>", `<div id="root">${appHtml}</div>${dataScript}`)
    .replace("</head>", `${headTags}</head>`);

  const routePath = route === "/" ? path.join(distDir, "index.html") : path.join(distDir, route.slice(1), "index.html");
  await fs.mkdir(path.dirname(routePath), { recursive: true });
  await fs.writeFile(routePath, html, "utf8");
}

await mongoose.disconnect();

function pathToFileUrl(filePath) {
  const resolvedPath = path.resolve(filePath).replace(/\\/g, "/");
  return `file:///${resolvedPath}`;
}

function sanitizeTemplate(html) {
  return html
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+name="description"[\s\S]*?>/i, "")
    .replace(/<meta\s+name="robots"[\s\S]*?>/i, "");
}

async function ensureDbConnection() {
  if (mongoose.connection.readyState >= 1) return;
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI is not configured for build-time CMS prerendering.");
  }
  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });
}

async function fetchCmsContent() {
  try {
    await ensureDbConnection();
    const [blogs, tours, menuItems, siteSettings, taxonomies] = await Promise.all([
      Blog.find({}).sort({ createdAt: -1 }).lean(),
      TourPackage.find({}).sort({ createdAt: -1 }).lean(),
      MenuItem.find({}).sort({ sortOrder: 1, createdAt: 1 }).lean(),
      SiteSettings.findOne({}).lean(),
      Taxonomy.find({}).sort({ name: 1 }).lean(),
    ]);

    return { blogs, tours, menuItems, siteSettings, taxonomies };
  } catch (error) {
    console.warn(
      `[prerender] Continuing without build-time CMS content: ${error.message}`
    );

    return {
      blogs: [],
      tours: [],
      menuItems: [],
      siteSettings: null,
      taxonomies: [],
    };
  }
}

function buildRouteData(route, {
  blogs,
  tours,
  destinations,
  menuItems,
  siteSettings,
  taxonomies,
}) {
  const shared = {
    blogs,
    tours,
    menuItems,
    siteSettings,
    taxonomies: {
      categories: taxonomies.filter((item) => item.type === "tourCategory"),
      tourTypes: taxonomies.filter((item) => item.type === "tourType"),
    },
  };

  if (route.startsWith("/blogs/") && !route.startsWith("/blogs/category/")) {
    const slug = route.replace("/blogs/", "");
    const blog = blogs.find((item) => slugifySeo(item.title) === slug) || null;
    const sidebar = buildBlogSidebarData(blog, blogs, tours);

    return {
      shared,
      blogDetail: {
        blog,
        latestBlogs: sidebar.latestBlogs,
        featuredTours: sidebar.featuredTours,
        categories: sidebar.categories,
      },
    };
  }

  if (route.startsWith("/packages/") && route !== "/packages") {
    const slug = route.replace("/packages/", "");
    const tour = tours.find((item) => slugifySeo(item.title) === slug) || null;

    return {
      shared,
      packageDetail: {
        tour,
        relatedTours: buildPackageRelatedTours(tour, tours),
      },
    };
  }

  if (route.startsWith("/destinations/") && route !== "/destinations") {
    const slug = route.replace("/destinations/", "");
    const destination = destinations.find((item) => item.slug === slug) || null;
    const blog = matchDestinationBlog(blogs, destination);
    const relatedTours = matchDestinationTours(tours, destination);

    return {
      shared,
      destinationDetail: {
        blog,
        relatedTours,
        faqs: buildDestinationFaqs(relatedTours),
      },
    };
  }

  return { shared };
}
