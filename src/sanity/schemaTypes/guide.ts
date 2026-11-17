import { defineField, defineType } from 'sanity'

/** guide：入门指南类长文（美区 Apple ID、港卡、机场、VPS、代理工具）。 */
export default defineType({
  name: 'guide',
  title: '指南',
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
    defineField({ name: 'tags', title: '标签', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'keywords', title: '关键词', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'featured', title: '首页推荐', type: 'boolean', initialValue: false }),
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
    select: { title: 'title', subtitle: 'description' },
  },
})
