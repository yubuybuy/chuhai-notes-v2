import { defineField, defineType } from 'sanity'

/**
 * tableBlock：Markdown 表格的迁移目标。Portable Text 没有原生表格，
 * 旧站指南里的大量对照表（港卡六家银行、机场流量表等）转成此结构，
 * 渲染时在 PortableText 组件映射里输出 <table>。
 */
export default defineType({
  name: 'tableBlock',
  title: '表格',
  type: 'object',
  fields: [
    defineField({ name: 'header', title: '表头（每列一个）', type: 'array', of: [{ type: 'string' }] }),
    defineField({
      name: 'rows',
      title: '行',
      type: 'array',
      of: [{ type: 'object', fields: [
        defineField({ name: 'cells', title: '单元格（每列一个）', type: 'array', of: [{ type: 'string' }] }),
      ] }],
    }),
  ],
  preview: {
    select: { header: 'header' },
    prepare: ({ header }) => ({
      title: `表格：${(header || []).join(' / ').slice(0, 60)}`,
    }),
  },
})
