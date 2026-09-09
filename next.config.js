/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // bcryptjs is pure JS, no native bindings needed, so no serverComponentsExternalPackages
  // required. Kept minimal on purpose for maximum Vercel compatibility.
};

module.exports = nextConfig;
