import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './src/sanity/schemaTypes'

/**
 * Sanity Studio 配置。推荐用 Sanity 托管 Studio：
 *   npx sanity deploy   →  https://<project-name>.sanity.studio
 * 本地开发：npx sanity dev（http://localhost:3333）
 * 需要环境变量：SANITY_STUDIO_PROJECT_ID、SANITY_STUDIO_DATASET（见 .env.example）。
 * 不把 Studio 嵌进 Astro 站内（/studio），避免拖慢开发与构建。
 */
export default defineConfig({
  name: 'chuhai-notes',
  title: '出海手记',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'PLACEHOLDER_PROJECT_ID',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  plugins: [structureTool(), visionTool()],
  schema: { types: schemaTypes },
})
