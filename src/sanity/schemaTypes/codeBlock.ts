import { defineField, defineType } from 'sanity'

/** codeBlock：Markdown 代码块的迁移目标。 */
export default defineType({
  name: 'codeBlock',
  title: '代码块',
  type: 'object',
  fields: [
    defineField({ name: 'language', title: '语言', type: 'string' }),
    defineField({ name: 'code', title: '代码', type: 'text', validation: r => r.required() }),
  ],
  preview: {
    select: { language: 'language', code: 'code' },
    prepare: ({ language, code }) => ({
      title: `代码（${language || 'text'}）`,
      subtitle: String(code || '').slice(0, 60),
    }),
  },
})
