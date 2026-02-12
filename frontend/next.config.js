/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async redirects() {
    return [
      { source: '/contact-us.html', destination: '/contact-us', permanent: true },
      { source: '/about-us.html', destination: '/about-us', permanent: true },
      { source: '/services.html', destination: '/services', permanent: true },
    ];
  },
};

module.exports = nextConfig;
