import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  async redirects() {
    // Roles, users, and Super Admin moved under Settings.
    return [
      { source: "/admin/roles/:path*", destination: "/settings/roles/:path*", permanent: false },
      { source: "/admin/users/:path*", destination: "/settings/users/:path*", permanent: false },
      { source: "/admin/staff", destination: "/settings/users", permanent: false },
      { source: "/account/settings", destination: "/settings/admins", permanent: false },
      { source: "/account", destination: "/settings", permanent: false },
    ];
  },
};

export default nextConfig;
