import { defineField, defineType } from 'sanity'

/**
 * deal：一条福利。字段与旧站 Markdown frontmatter + dealRecord 一一对应，
 * 迁移时原样搬运（见 scripts/migrate-to-sanity.mjs）。
 * 发布规则（沿用旧站 deal-policy.mjs 的口径，见 README）：
 * 仅当 dealStatus === 'ready' 且 dealValidUntil 存在且未过期时，
 * 该 deal 才会出现在 /deals/、首页、RSS 与 sitemap 里。
 */
export default defineType({
  name: 'deal',
  title: '福利',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: '标题', type: 'string', validation: r => r.required() }),
    defineField({
      name: 'slug',
      title: 'Slug（决定 URL，须与旧站文件名一致）',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: r => r.required(),
    }),
    defineField({ name: 'description', title: '简介', type: 'text', validation: r => r.required() }),
    defineField({ name: 'audience', title: '适用人群', type: 'string', validation: r => r.required() }),
    defineField({ name: 'benefit', title: '能获得什么', type: 'text', validation: r => r.required() }),
    defineField({ name: 'cost', title: '实际费用', type: 'string', validation: r => r.required() }),
    defineField({ name: 'conditions', title: '领取条件', type: 'text' }),
    defineField({ name: 'expiresAt', title: '截止时间（官方口径）', type: 'datetime' }),
    defineField({ name: 'claimUrl', title: '官方领取入口', type: 'url' }),
    defineField({
      name: 'verification',
      title: '核实方式',
      type: 'string',
      options: { list: ['official-page', 'unverified'] },
    }),
    defineField({
      name: 'dealStatus',
      title: '状态',
      type: 'string',
      options: {
        list: [
          { title: '可发（ready）', value: 'ready' },
          { title: '被核实拦下（blocked）', value: 'blocked' },
          { title: '过期/待复核（stale）', value: 'stale' },
          { title: '已过期（expired）', value: 'expired' },
        ],
      },
      validation: r => r.required(),
    }),
    defineField({
      name: 'dealValidUntil',
      title: '有效期至（为空则不发布；沿用旧站 48 小时核对有效期规则）',
      type: 'datetime',
    }),
    defineField({
      name: 'dealRecord',
      title: '核实记录（原 dealRecord JSON 原样保存，不进正文）',
      type: 'object',
      fields: [
        defineField({ name: 'id', type: 'string' }),
        defineField({ name: 'checkedAt', type: 'datetime' }),
        defineField({ name: 'deadlineStatus', type: 'string' }),
        defineField({ name: 'expiryNote', type: 'text' }),
        defineField({ name: 'steps', type: 'array', of: [{ type: 'string' }] }),
        defineField({ name: 'evidence', type: 'array', of: [{ type: 'object', fields: [
          defineField({ name: 'field', type: 'string' }),
          defineField({ name: 'note', type: 'text' }),
          defineField({ name: 'sourceUrl', type: 'url' }),
        ] }] }),
        defineField({ name: 'sources', type: 'array', of: [{ type: 'object', fields: [
          defineField({ name: 'kind', type: 'string' }),
          defineField({ name: 'title', type: 'string' }),
          defineField({ name: 'url', type: 'url' }),
        ] }] }),
      ],
    }),
    defineField({
      name: 'unknowns',
      title: '尚未确认的事（不进正文，只存档）',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({ name: 'tags', title: '标签', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'pubDatetime', title: '发布时间', type: 'datetime', validation: r => r.required() }),
    defineField({ name: 'modDatetime', title: '更新时间', type: 'datetime' }),
    defineField({
      name: 'body',
      title: '正文（Portable Text）',
      type: 'array',
      of: [
        { type: 'block' },
        { type: 'image', options: { hotspot: true } },
        { type: 'tableBlock' },
        { type: 'codeBlock' },
      ],
    }),
    defineField({
      name: 'bodyMarkdown',
      title: '正文 Markdown 原文（迁移备份，渲染不用它）',
      type: 'text',
      hidden: true,
    }),
  ],
  preview: {
    select: { title: 'title', status: 'dealStatus', subtitle: 'benefit' },
  },
})
