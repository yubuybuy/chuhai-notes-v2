import { defineCliConfig } from 'sanity/cli'

/**
 * Sanity CLI 配置（dataset import / deploy 用）。
 * 项目 ID 与 dataset 均从环境变量取，不写死、不入库明文：
 *   SANITY_STUDIO_PROJECT_ID、SANITY_STUDIO_DATASET
 */
export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || '',
    dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  },
})
