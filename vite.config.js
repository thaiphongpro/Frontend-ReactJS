import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Tự động cập nhật app khi có phiên bản mới
      // Đã thêm dấu / ở trước để trỏ đúng vào thư mục public/
      includeAssets: ['/logo-1.png', '/apple-touch-icon.png', '/mask-icon.svg'],
      manifest: {
        name: 'Góc Tài Chính',
        short_name: 'Tài Chính',
        description: 'Trợ lý quản lý tài chính cá nhân thông minh',
        theme_color: '#D4AF37', // Màu vàng đồng chuẩn của app
        background_color: '#1C1C1E', // Màu nền dark mode của Apple
        display: 'standalone', // Chạy full màn hình như app thật
        icons: [
          {
            src: '/pwa-192x192.png', // Đã thêm dấu /
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png', // Đã thêm dấu /
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png', // Đã thêm dấu /
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' // Hỗ trợ icon bo góc chuẩn Android/iOS
          }
        ]
      },
      workbox: {
        // VŨ KHÍ TỐI THƯỢNG TRỊ CACHE IOS: Ép dọn sạch cache cũ khi có code mới
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
      }
    })
  ],
});