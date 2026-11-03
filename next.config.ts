import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3", "unpdf"],
  // 개발 서버를 127.0.0.1 로 열어도 HMR·RSC 요청이 차단되지 않게 한다.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
