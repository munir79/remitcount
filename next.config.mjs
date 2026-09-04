// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   /* config options here */
//   reactCompiler: true,
// };

// export default nextConfig;


import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
     
     
     
      {
        protocol: "https",
        hostname: "*.ngrok-free.app",
        pathname: "/**",
      },
         {
        protocol: "http",
        // hostname: "172.16.10.130",
        hostname: "192.168.10.166",
        port: "5000",
        pathname: "/**",
      },

      {
        protocol: "https",
        hostname: "final-account-posh.onrender.com",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "final-account-posh.onrender.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "pro-acc-soft-with-posh-git-main-jakir-hossain-munirs-projects.vercel.app/",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "flagcdn.com",
        pathname: "/**",
      },
      
    ],
  },
};

export default nextConfig;