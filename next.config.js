/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/meeting-rooms.html'
      },
      {
        source: '/app',
        destination: '/app.html'
      },
      {
        source: '/app/:path*',
        destination: '/app.html'
      },
      {
        source: '/meeting-rooms',
        destination: '/meeting-rooms.html'
      },
      {
        source: '/meeting-rooms/:path*',
        destination: '/meeting-rooms.html'
      },
      {
        source: '/billing',
        destination: '/meeting-rooms.html'
      },
      {
        source: '/bookings',
        destination: '/meeting-rooms.html'
      }
    ];
  }
};

module.exports = nextConfig;
