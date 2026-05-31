import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@sydeso/domain", "@sydeso/api-contracts"],
};

export default nextConfig;
