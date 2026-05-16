import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer } from "./server";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Extract base path from VITE_FRONTEND_URL if available, otherwise default to '/'
  // This ensures assets are loaded correctly regardless of nested routes (fixes MIME type errors)
  let basePath = "/";
  if (process.env.VITE_FRONTEND_URL) {
    try {
      const url = new URL(process.env.VITE_FRONTEND_URL);
      basePath = url.pathname.endsWith('/') ? url.pathname : url.pathname + '/';
    } catch (e) {
      console.warn("Invalid VITE_FRONTEND_URL, defaulting base to /");
    }
  }

  return {
    base: basePath,
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: ["./client", "./shared", "./node_modules", "."],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  };
});

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    configureServer(server) {
      const app = createServer();

      // Add Express app as middleware to Vite dev server
      server.middlewares.use(app);
    },
  };
}
