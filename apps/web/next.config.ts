import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@sydeso/domain", "@sydeso/api-contracts"],
  // The product vocabulary changed; old links keep working.
  async redirects() {
    return [
      { source: "/app/projects/:projectId/features", destination: "/app/projects/:projectId/requests", permanent: true },
      { source: "/app/projects/:projectId/features/:path*", destination: "/app/projects/:projectId/requests/:path*", permanent: true },
      { source: "/app/projects/:projectId/artifacts", destination: "/app/projects/:projectId/documents", permanent: true },
      { source: "/app/projects/:projectId/artifacts/:path*", destination: "/app/projects/:projectId/documents/:path*", permanent: true },
      { source: "/app/organizations/:organizationId/runners", destination: "/app/organizations/:organizationId/machines", permanent: true },
    ];
  },
};

export default nextConfig;
