import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // E2E·새 배포가 실행 중인 서버의 빌드 폴더를 덮어쓰지 않도록 분리한다.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // 배포용 임시 타입 경로가 원본 tsconfig.json에 추가되지 않게 한다.
  typescript: { tsconfigPath: process.env.LEO_TSCONFIG_PATH || "tsconfig.json" },
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3", "@prisma/adapter-libsql", "@libsql/client", "unpdf"],
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
