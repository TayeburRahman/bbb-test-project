import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In local dev, proxy /api to the Node server. In Docker, nginx does this.
export default defineConfig({
  plugins: [react()],
  server: {
    // Bind IPv4 loopback explicitly. On some Windows setups "localhost" resolves
    // to IPv6 (::1) and Vite binds there only, so the browser's IPv4 request to
    // 127.0.0.1 is refused. 127.0.0.1 avoids that mismatch.
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': 'http://127.0.0.1:3000',
    },
  },
});
