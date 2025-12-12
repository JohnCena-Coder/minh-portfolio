import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel/serverless'; // Thêm cái này

export default defineConfig({
  output: 'server',
  adapter: vercel(), // Thêm dòng này để Vercel hiểu
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false }),
  ],
});