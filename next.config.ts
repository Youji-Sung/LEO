import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // E2E 서버가 개발 서버와 같은 폴더에서 함께 뜰 수 있도록 빌드 폴더(dev 잠금 위치)를 분리한다.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3", "unpdf"],
  // 개발 서버를 127.0.0.1 로 열어도 HMR·RSC 요청이 차단되지 않게 한다.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // 마이크는 이 앱 자신만, 카메라·위치는 아무도 못 쓰게.
          { key: "Permissions-Policy", value: "microphone=(self), camera=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
