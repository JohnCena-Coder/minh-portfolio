import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel/serverless'; // Phải có dòng này

export default defineConfig({
  output: 'server',
  adapter: vercel(), // Phải có dòng này
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false }),
  ],
});