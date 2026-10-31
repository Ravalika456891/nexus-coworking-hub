/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  async rewrites() {
    return [
      {
        source: '/app',
        destination: '/app.html'
      },
      {
        source: '/meeting-rooms',
        destination: '/meeting-rooms.html'
      }
    ];
  }
};

module.exports = nextConfig;
