/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // O pdf.js tenta carregar "canvas" no Node; no navegador não é necessário.
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
