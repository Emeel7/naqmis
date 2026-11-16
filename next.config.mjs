/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["three"],
  // "/" is not a page: it simply forwards to /login (keeps the app at 9 routes).
  async redirects() {
    return [{ source: "/", destination: "/login", permanent: false }];
  },
};
export default nextConfig;
