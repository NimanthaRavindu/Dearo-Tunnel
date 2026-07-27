import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   allowedDevOrigins: [
        "abs-performer-citation-steven.trycloudflare.com",
        "localhost:3000",
        "192.168.1.11",
        "*"
      ],
};

export default nextConfig;
