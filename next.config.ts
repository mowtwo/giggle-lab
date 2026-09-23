import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const recorderIsolation = [
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
];

const ffmpegAssetHeaders = [
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/screen-recorder", headers: recorderIsolation },
      { source: "/:locale(zh|en)/screen-recorder", headers: recorderIsolation },
      { source: "/ffmpeg/:path*", headers: ffmpegAssetHeaders },
    ];
  },
};

export default withNextIntl(nextConfig);
