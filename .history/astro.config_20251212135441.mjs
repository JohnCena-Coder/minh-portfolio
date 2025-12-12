import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  output: 'server', // QUAN TRỌNG: Dòng này sửa lỗi Dynamic (getStaticPaths)
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false, // Dòng này giúp Tailwind hoạt động ổn định
    }),
  ],
});