#!/usr/bin/env node
/**
 * 迁移脚本：把旧站 Markdown（frontmatter + 正文）转成 Sanity 文档 JSON。
 *
 * 用法：
 *   node scripts/migrate-to-sanity.mjs [--source <dir>] [--check-only]
 * 默认源目录：./_source/src/content/blog（GitHub 只读拉取的副本）；
 * 若不存在，退到 /home/hatch/workspace/chuhai-notes/src/content/blog（本地快照）。
 *
 * 输出：
 *   migration/deal-<slug>.json / migration/guide-<slug>.json（每篇一个文件）
 *   migration/validation-report.json（校验结果：必填缺失、slug 重复、URL 规则、可见性）
 *   src/data/deals.json / src/data/guides.json（本地兜底数据，构建无凭据时用）
 *
 * 不连 Sanity、不写任何线上系统。导入 Sanity 的步骤见 README（sanity dataset import）。
 *
 * 注意（2026-11-14 实测）：
 * - 盘点报告里说的两处"乱码"（港卡"1 万���"、GMH"限免为��商限免"）经字节检查
 *   并不存在，原文分别是"1 万元"与"限免为厂商限免"，属读取端渲染问题，
 *   迁移不做任何替换。
 * - 正文里的 HTML 注释（<!-- 自动导入… -->、<!-- deal-import… -->）是导入元数据，
 *   不是正文内容，转换时直接去掉。
 * - ERNIE 的 dealValidUntil 为 null 且 unknowns 有 2 条：按旧站 deal-policy，
 *   它本应是 blocked 而不是 ready。脚本原样保留字段，但校验报告会标 WARNING，
 *   且 content.ts 的可见性规则会把它过滤掉（/deals/ 不会出现它），直到有人
 *   在 Studio 里补上有效期并重新核对。
 * - Knightica 的 dealValidUntil 是 2026-11-19T16:00:00Z（北京时间 11 月 20 日 00:00 截止），
 *   到期后自动下线，需重新核对。
 */
import { readdir, readFile, writeFile, mkdir, access } from 'node:fs/promises'
import { join, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import { markdownToPortableText } from '@portabletext/markdown'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const args = process.argv.slice(2)
const checkOnly = args.includes('--check-only')
const sourceArg = args[args.indexOf('--source') + 1]

async function exists(p) {
  try { await access(p); return true } catch { return false }
}

async function resolveSource() {
  const candidates = [
    sourceArg,
    join(root, '_source', 'src', 'content', 'blog'),
    '/home/hatch/workspace/chuhai-notes/src/content/blog',
  ].filter(Boolean)
  for (const c of candidates) if (await exists(c)) return c
  throw new Error('找不到源文章目录，候选：' + candidates.join(' | '))
}

/** 把 Markdown 表格抽出来，换成占位行，转换完再插回 tableBlock。 */
function extractTables(md) {
  const tables = []
  const lines = md.split('\n')
  const out = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const next = lines[i + 1] || ''
    if (line.trim().startsWith('|') && /^\|[\s:|-]+\|$/.test(next.trim())) {
      const header = line.split('|').slice(1, -1).map(s => s.trim())
      const rows = []
      i += 2
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push({ _type: 'tableRow', cells: lines[i].split('|').slice(1, -1).map(s => s.trim()) })
        i++
      }
      i--
      const idx = tables.length
      tables.push({ _type: 'tableBlock', header, rows })
      out.push(`\n::TABLE_${idx}::\n`)
    } else {
      out.push(line)
    }
  }
  return { md: out.join('\n'), tables }
}

function mdToPortableText(md, slug) {
  // 去掉 HTML 注释（导入元数据，不是正文）
  const cleaned = md.replace(/<!--[\s\S]*?-->/g, '').trim()
  const { md: noTables, tables } = extractTables(cleaned)
  let blocks = []
  try {
    blocks = markdownToPortableText(noTables)
  } catch (err) {
    throw new Error(`[${slug}] Markdown 转 Portable Text 失败：${err.message}`)
  }
  // 把占位段落替换回 tableBlock；丢弃残留的 html 块（应已无）
  const result = []
  for (const b of blocks) {
    if (b._type === 'html') continue
    const text = (b.children || []).map(c => c.text || '').join('')
    const m = text.match(/^::TABLE_(\d+)::$/)
    if (b._type === 'block' && m) {
      result.push(tables[Number(m[1])])
    } else {
      result.push(b)
    }
  }
  return { blocks: result, fixes: [] }
}

function toISO(v) {
  if (!v) return null
  const d = v instanceof Date ? v : new Date(v)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

function dealDoc(data, body, slug, fixes) {
  const rec = data.dealRecord || {}
  return {
    _type: 'deal',
    _id: `imported-${slug}`,
    title: data.title,
    slug: { _type: 'slug', current: slug },
    description: data.description,
    audience: data.audience,
    benefit: rec.benefit ?? data.title,
    cost: rec.cost ?? '',
    conditions: rec.conditions ?? '',
    expiresAt: toISO(rec.expiresAt),
    claimUrl: rec.claimUrl ?? null,
    verification: rec.verification ?? data.verification ?? null,
    dealStatus: data.dealStatus ?? 'blocked',
    dealValidUntil: toISO(data.dealValidUntil),
    dealRecord: {
      id: rec.id ?? slug,
      checkedAt: toISO(rec.checkedAt),
      deadlineStatus: rec.deadlineStatus ?? null,
      expiryNote: rec.expiryNote ?? null,
      steps: rec.steps ?? [],
      evidence: rec.evidence ?? [],
      sources: rec.sources ?? [],
    },
    unknowns: rec.unknowns ?? [],
    tags: data.tags ?? [],
    pubDatetime: toISO(data.pubDatetime),
    modDatetime: toISO(data.modDatetime),
    body,
    bodyMarkdown: data._bodyMarkdown,
    _migration: { source: `deals/${slug}.md`, fixes, url: `/blog/deals/${slug}/` },
  }
}

function guideDoc(data, body, slug, fixes) {
  return {
    _type: 'guide',
    _id: `imported-${slug}`,
    title: data.title,
    slug: { _type: 'slug', current: slug },
    description: data.description,
    audience: data.audience,
    tags: data.tags ?? [],
    keywords: data.keywords ?? [],
    featured: Boolean(data.featured),
    pubDatetime: toISO(data.pubDatetime),
    modDatetime: toISO(data.modDatetime),
    body,
    bodyMarkdown: data._bodyMarkdown,
    _migration: { source: `${slug}.md`, fixes, url: `/blog/${slug}/` },
  }
}

async function main() {
  const source = await resolveSource()
  console.log(`源目录：${source}`)
  const dealFiles = (await readdir(join(source, 'deals'))).filter(f => f.endsWith('.md')).sort()
  const guideFiles = (await readdir(source)).filter(f => f.endsWith('.md')).sort()

  const outDir = join(root, 'migration')
  const dataDir = join(root, 'src', 'data')
  await mkdir(outDir, { recursive: true })
  await mkdir(dataDir, { recursive: true })

  const deals = []
  const guides = []
  const warnings = []
  const errors = []
  const seenSlugs = new Set()

  async function convert(file, isDeal) {
    const slug = basename(file, '.md')
    const sub = isDeal ? 'deals' : ''
    const raw = await readFile(join(source, sub, file), 'utf-8')
    const { data, content } = matter(raw)
    const bodyMd = content.trim()
    if (seenSlugs.has(slug)) errors.push(`${slug}：slug 重复`)
    seenSlugs.add(slug)
    for (const f of ['title', 'description', 'audience', 'pubDatetime']) {
      if (!data[f]) errors.push(`${slug}：缺少必填字段 ${f}`)
    }
    const { blocks, fixes } = mdToPortableText(bodyMd, slug)
    if (blocks.length === 0) errors.push(`${slug}：正文转出 0 个块`)
    if (fixes.length) warnings.push(`${slug}：乱码修复 ${fixes.join('；')}`)
    data._bodyMarkdown = bodyMd
    const doc = isDeal ? dealDoc(data, blocks, slug, fixes) : guideDoc(data, blocks, slug, fixes)
    if (isDeal) {
      if (doc.dealStatus === 'ready' && !doc.dealValidUntil) {
        warnings.push(`${slug}：dealStatus=ready 但 dealValidUntil 为空，按可见性规则不会上线（ERNIE 同款问题）`)
      }
      if (doc.dealStatus === 'ready' && doc.dealValidUntil && new Date(doc.dealValidUntil) < new Date()) {
        warnings.push(`${slug}：dealValidUntil 已过期，上线后会被过滤`)
      }
      if ((doc.unknowns || []).length && doc.dealStatus === 'ready') {
        warnings.push(`${slug}：unknowns 有 ${doc.unknowns.length} 条但状态仍是 ready，按旧站 deal-policy 应为 blocked`)
      }
      deals.push(doc)
    } else {
      guides.push(doc)
    }
    return doc
  }

  for (const f of dealFiles) await convert(f, true)
  for (const f of guideFiles) await convert(f, false)

  const report = {
    generatedAt: new Date().toISOString(),
    source,
    counts: { deals: deals.length, guides: guides.length },
    slugs: [...seenSlugs].sort(),
    warnings,
    errors,
  }
  console.log(`deals: ${deals.length} 篇，guides: ${guides.length} 篇`)
  console.log(`warnings(${warnings.length}):`, warnings)
  console.log(`errors(${errors.length}):`, errors)

  if (checkOnly) {
    await writeFile(join(outDir, 'validation-report.json'), JSON.stringify(report, null, 2))
    console.log('仅校验，未写迁移文件。报告：migration/validation-report.json')
    process.exit(errors.length ? 1 : 0)
  }

  for (const d of [...deals, ...guides]) {
    const name = d._type === 'deal' ? `deal-${d.slug.current}.json` : `guide-${d.slug.current}.json`
    await writeFile(join(outDir, name), JSON.stringify(d, null, 2))
  }
  await writeFile(join(dataDir, 'deals.json'), JSON.stringify(deals, null, 2))
  await writeFile(join(dataDir, 'guides.json'), JSON.stringify(guides, null, 2))
  await writeFile(join(outDir, 'validation-report.json'), JSON.stringify(report, null, 2))
  console.log(`已写 migration/*.json（${deals.length + guides.length} 篇）与 src/data/*.json`)
  process.exit(errors.length ? 1 : 0)
}

main().catch(err => { console.error(err); process.exit(1) })
