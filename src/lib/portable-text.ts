/**
 * Portable Text 渲染映射（astro-portabletext）。
 * tableBlock / codeBlock 是迁移时从 Markdown 表格与代码块转出的自定义块类型。
 */
export const portableTextComponents = {
  types: {
    image: ({ value }) => {
      const ref = value?.asset?._ref || ''
      return `<figure><img src="${ref}" alt="${value?.alt || ''}" loading="lazy" /></figure>`
    },
    tableBlock: ({ value }) => {
      const th = (value.header || []).map(h => `<th>${h}</th>`).join('')
      const rows = (value.rows || [])
        .map(r => `<tr>${(r.cells || []).map(c => `<td>${c}</td>`).join('')}</tr>`)
        .join('')
      return `<div class="table-wrapper"><table><thead><tr>${th}</tr></thead><tbody>${rows}</tbody></table></div>`
    },
    codeBlock: ({ value }) => {
      const esc = String(value.code || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      return `<pre><code class="language-${value.language || 'text'}">${esc}</code></pre>`
    },
  },
}
