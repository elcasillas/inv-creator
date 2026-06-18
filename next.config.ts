import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

initOpenNextCloudflareForDev({
  remoteBindings: false
});

const nextConfig: NextConfig = {
  typedRoutes: true,
  outputFileTracingRoot: process.cwd()
};

export default nextConfig;
