import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

export default defineConfig({
  output: 'server', // Dòng này sửa lỗi getStaticPaths (Dynamic)
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false }), // Dòng này sửa lỗi giao diện xấu
  ],
});