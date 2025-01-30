/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export', // Enables static export for GitHub Pages
    images: { unoptimized: true }, // Required for images in static mode
    basePath: "/pdf-maker", // Must match your repo name
    assetPrefix: "/pdf-maker/", // Ensures assets load correctly
  };
  
  module.exports = nextConfig;
  