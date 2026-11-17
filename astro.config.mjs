import { defineConfig, envField } from 'astro/config'
import { loadEnv } from 'vite'
import sitemap from '@astrojs/sitemap'
import sanity from '@sanity/astro'
import tailwindcss from '@tailwindcss/vite'

const env = loadEnv(process.env.NODE_ENV, process.cwd(), '')
const projectId = env.PUBLIC_SANITY_PROJECT_ID
const dataset = env.PUBLIC_SANITY_DATASET || 'production'

// https://astro.new/config
export default defineConfig({
  site: 'https://chuhai.openoio.com',
  output: 'static',
  vite: {
    plugins: [tailwindcss()],
  },
  i18n: {
    locales: ['zh-CN'],
    defaultLocale: 'zh-CN',
    routing: {
      prefixDefaultLocale: false,
    },
  },
  env: {
    schema: {
      PUBLIC_GOOGLE_SITE_VERIFICATION: envField.string({
        access: 'public',
        context: 'client',
        optional: true,
      }),
    },
  },
  integrations: [
    sitemap(),
    // 有 Sanity 凭据时才启用集成；无凭据时构建走 src/data/*.json 兜底（见 src/lib/content.ts）
    ...(projectId
      ? [
          sanity({
            projectId,
            dataset,
            apiVersion: env.SANITY_API_VERSION || '2026-03-01',
            useCdn: false,
          }),
        ]
      : []),
  ],
})
