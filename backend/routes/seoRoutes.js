import express from 'express';
import TourPackage from '../models/TourPackage.js';
import Blog from '../models/Blog.js';

const router = express.Router();

const BASE_URL = 'https://mazexpeditions.com';

const slugify = (text) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');

router.get('/sitemap.xml', async (req, res) => {
  try {
    const tours = await TourPackage.find({}, 'title updatedAt');
    const blogs = await Blog.find({}, 'title updatedAt');

    const staticPages = [
      '',
      '/about',
      '/contact',
      '/gallery',
      '/plan-my-trip',
      '/packages',
      '/blogs',
    ];

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Static pages
    staticPages.forEach((page) => {
      sitemap += `
  <url>
    <loc>${BASE_URL}${page}</loc>
    <changefreq>weekly</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>`;
    });

    // Tour pages
    tours.forEach((tour) => {
      const slug = slugify(tour.title);
      sitemap += `
  <url>
    <loc>${BASE_URL}/packages/${slug}</loc>
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
    <loc>${BASE_URL}/blogs/${slug}</loc>
    <lastmod>${blog.updatedAt?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

    sitemap += '\n</urlset>';

    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).send('Error generating sitemap');
  }
});

router.get('/robots.txt', (req, res) => {
  const robots = `User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
`;
  res.header('Content-Type', 'text/plain');
  res.send(robots);
});

export default router;
