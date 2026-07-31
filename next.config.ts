import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   allowedDevOrigins: [
        "jpg-usb-albums-periods.trycloudflare.com",
        "localhost:3000",
        "192.168.1.11",
        "*"
      ],
};

export default nextConfig;
