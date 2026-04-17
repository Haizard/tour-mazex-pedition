import express from 'express';
import TourPackage from '../models/TourPackage.js';
import Blog from '../models/Blog.js';
import { buildTenantFilter, resolveTenantBaseUrl } from '../utils/tenantContext.js';

const router = express.Router();

const DESTINATION_PAGES = [
  { slug: 'serengeti', updatedAt: '2026-01-01' },
  { slug: 'ngorongoro', updatedAt: '2026-01-01' },
  { slug: 'tarangire', updatedAt: '2026-01-01' },
  { slug: 'manyara', updatedAt: '2026-01-01' },
  { slug: 'natron', updatedAt: '2026-01-01' },
];

const slugify = (text) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');

router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = resolveTenantBaseUrl(req).replace(/\/+$/, '');
    const tours = await TourPackage.find(buildTenantFilter(req), 'title updatedAt');
    const blogs = await Blog.find(buildTenantFilter(req), 'title category updatedAt');
    const blogCategories = [...new Set(
      blogs
        .map((blog) => blog.category)
        .filter(Boolean)
        .map((category) => slugify(category)),
    )];

    const staticPages = [
      '',
      '/about',
      '/contact',
      '/gallery',
      '/plan-my-trip',
      '/packages',
      '/blogs',
      '/destinations',
      '/privacy-policy',
      '/terms',
    ];

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Static pages
    staticPages.forEach((page) => {
      sitemap += `
  <url>
    <loc>${baseUrl}${page}</loc>
    <changefreq>weekly</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>`;
    });

    // Tour pages
    tours.forEach((tour) => {
      const slug = slugify(tour.title);
      sitemap += `
  <url>
        <loc>${baseUrl}/packages/${slug}</loc>
    <lastmod>${tour.updatedAt?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>`;
    });

    // Blog pages
    blogs.forEach((blog) => {
      const slug = slugify(blog.title);
      sitemap += `
  <url>
    <loc>${baseUrl}/blogs/${slug}</loc>
    <lastmod>${blog.updatedAt?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

    // Destination pages
    DESTINATION_PAGES.forEach((destination) => {
      sitemap += `
  <url>
    <loc>${baseUrl}/destinations/${destination.slug}</loc>
    <lastmod>${destination.updatedAt}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>`;
    });

    // Blog category pages
    blogCategories.forEach((category) => {
      sitemap += `
  <url>
    <loc>${baseUrl}/blogs/category/${category}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.65</priority>
  </url>`;
    });

    sitemap += '\n</urlset>';

    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.send(sitemap);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).send('Error generating sitemap');
  }
});

router.get('/robots.txt', (req, res) => {
  const baseUrl = resolveTenantBaseUrl(req).replace(/\/+$/, '');
  const robots = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
Host: ${baseUrl}
`;
  res.header('Content-Type', 'text/plain');
  res.header('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.send(robots);
});

export default router;
