import axios from "axios";
import https from "node:https";

const [, , baseUrlArg = "http://127.0.0.1:5173", tenantSlugArg = "mazepro"] = process.argv;

const baseUrl = baseUrlArg.replace(/\/+$/, "");
const tenantSlug = tenantSlugArg.trim();
const tenantBasePath = `/demo/${tenantSlug}`;
const tenantBaseUrl = `${baseUrl}${tenantBasePath}`;
const httpsAgent = new https.Agent({ rejectUnauthorized: false });
const tenantHeaders = {
  "x-tenant-slug": tenantSlug,
  "x-tenant-subdomain": tenantSlug,
  "x-tenant-source": "demo",
};

const fetchText = async (url) => {
  const response = await axios.get(url, {
    responseType: "text",
    httpsAgent,
    maxRedirects: 5,
    validateStatus: () => true,
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Request to ${url} failed with ${response.status}`);
  }

  return response.data;
};

const fetchJson = async (url, headers = {}) => {
  const response = await axios.get(url, {
    responseType: "json",
    headers,
    httpsAgent,
    maxRedirects: 5,
    validateStatus: () => true,
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Request to ${url} failed with ${response.status}`);
  }

  return response.data;
};

const ensureTenantPageLoads = async (path, label) => {
  const html = await fetchText(`${baseUrl}${path}`);
  if (!html.includes("<div id=\"root\">")) {
    throw new Error(`${label} page did not return the app shell for ${path}`);
  }
  console.log(`Loaded ${label}: ${path}`);
};

const run = async () => {
  console.log(`Tenant route smoke check for ${tenantBaseUrl}`);

  await ensureTenantPageLoads(`${tenantBasePath}/`, "Tenant home");
  await ensureTenantPageLoads(`${tenantBasePath}/blogs`, "Tenant blog listing");
  await ensureTenantPageLoads(`${tenantBasePath}/packages`, "Tenant package listing");
  await ensureTenantPageLoads(`${tenantBasePath}/contact`, "Tenant contact");

  const blogs = await fetchJson(`${baseUrl}/api/blogs`, tenantHeaders);
  const tours = await fetchJson(`${baseUrl}/api/tours`, tenantHeaders);

  const firstBlog = Array.isArray(blogs) ? blogs[0] : null;
  const firstTour = Array.isArray(tours) ? tours[0] : null;

  if (!firstBlog?.title) {
    throw new Error("No tenant blogs returned from /api/blogs");
  }

  if (!firstTour?.title) {
    throw new Error("No tenant tours returned from /api/tours");
  }

  const slugify = (value = "") =>
    value
      .toString()
      .trim()
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const blogPath = `${tenantBasePath}/blogs/${slugify(firstBlog.title)}`;
  const packagePath = `${tenantBasePath}/packages/${slugify(firstTour.title)}`;

  await ensureTenantPageLoads(blogPath, "Tenant blog detail");
  await ensureTenantPageLoads(packagePath, "Tenant package detail");

  console.log("Tenant route smoke check passed.");
  console.log(`Verified: ${blogPath}`);
  console.log(`Verified: ${packagePath}`);
};

run().catch((error) => {
  console.error("Tenant route smoke check failed:", error.message);
  process.exitCode = 1;
});
