/** @type {import('next').NextConfig} */
const nextConfig = {
  // Netlify対応の設定（API Routes使用のため静的エクスポートは使用しない）
  trailingSlash: true, // Netlifyのルーティングに適した設定
  images: {
    unoptimized: true // Netlify対応
  },
  // CORS設定（vercel.jsonの代替）
  async headers() {
    return [
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
          {
            key: "X-Robots-Tag",
            value: "noindex",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
