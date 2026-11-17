/**
 * 内容数据源抽象：页面只调这里，不直接调 Sanity。
 *
 * 1. 有 Sanity 凭据（PUBLIC_SANITY_PROJECT_ID）时：构建时 GROQ 拉取。
 * 2. 无凭据时：读 src/data/*.json（迁移脚本生成的本地兜底数据），
 *    并 console.warn 提醒。无凭据也能 npm run build / npm run dev。
 *
 * 发布可见性（沿用旧站 postFilter + deal-policy 的口径）：
 * - guide：只要存在就可见（旧站 draft 字段在 Sanity 里由 Studio 的
 *   草稿/已发布状态代替，不再用 draft 布尔值）。
 * - deal：仅当 dealStatus === 'ready' 且 dealValidUntil 存在且未过期
 *   才可见。注意：ERNIE（dealValidUntil 为 null、unknowns 有 2 条）
 *   按此规则不可见，见 migration/validation-report.json。
 */
import { fetchSanity, DEALS_QUERY, DEAL_BY_SLUG_QUERY, GUIDES_QUERY, GUIDE_BY_SLUG_QUERY } from './sanity'
import localDealsRaw from '../data/deals.json'
import localGuidesRaw from '../data/guides.json'

// 迁移 JSON / Sanity 导入文件里 slug 是 Sanity 对象 {_type:'slug', current:'...'}，
// GROQ 查询返回的是拍平后的字符串；本地兜底也要拍平，保证两路形状一致。
function flatSlug(v: unknown): string {
  if (typeof v === 'string') return v
  if (v && typeof v === 'object' && 'current' in v) return String((v as { current: unknown }).current)
  return ''
}

function normalize<T extends { slug?: unknown }>(doc: T): T {
  return { ...doc, slug: flatSlug(doc.slug) }
}

const localDeals = (localDealsRaw as unknown as Deal[]).map(normalize)
const localGuides = (localGuidesRaw as unknown as Guide[]).map(normalize)

export interface Deal {
  _id: string
  title: string
  slug: string
  description: string
  audience: string
  benefit: string
  cost: string
  conditions?: string
  expiresAt?: string | null
  claimUrl?: string | null
  verification?: string
  dealStatus: string
  dealValidUntil?: string | null
  dealRecord?: Record<string, unknown>
  unknowns?: string[]
  tags?: string[]
  pubDatetime: string
  modDatetime?: string | null
  body?: unknown[]
}

export interface Guide {
  _id: string
  title: string
  slug: string
  description: string
  audience: string
  tags?: string[]
  keywords?: string[]
  featured?: boolean
  pubDatetime: string
  modDatetime?: string | null
  body?: unknown[]
}

export function isDealVisible(deal: Deal, now = new Date()): boolean {
  if (deal.dealStatus !== 'ready') return false
  if (!deal.dealValidUntil) return false
  return new Date(deal.dealValidUntil).getTime() > now.getTime()
}

async function getOrLocal<T>(query: string, local: T, params: Record<string, unknown> = {}): Promise<T> {
  try {
    return await fetchSanity<T>(query, params)
  } catch (err) {
    console.warn('[content] Sanity 不可用，走本地兜底数据：', (err as Error).message)
    return local
  }
}

export async function getDeals(): Promise<Deal[]> {
  const all = await getOrLocal<Deal[]>(DEALS_QUERY, localDeals)
  return all.filter(d => isDealVisible(d))
}

export async function getAllDeals(): Promise<Deal[]> {
  return getOrLocal<Deal[]>(DEALS_QUERY, localDeals)
}

export async function getDeal(slug: string): Promise<Deal | null> {
  try {
    const deal = await fetchSanity<Deal | null>(DEAL_BY_SLUG_QUERY, { slug })
    return deal && isDealVisible(deal) ? deal : null
  } catch (err) {
    console.warn('[content] Sanity 不可用，走本地兜底数据：', (err as Error).message)
    const found = localDeals.find(d => d.slug === slug)
    return found && isDealVisible(found) ? found : null
  }
}

export async function getGuides(): Promise<Guide[]> {
  return getOrLocal<Guide[]>(GUIDES_QUERY, localGuides)
}

export async function getGuide(slug: string): Promise<Guide | null> {
  try {
    return await fetchSanity<Guide | null>(GUIDE_BY_SLUG_QUERY, { slug })
  } catch (err) {
    console.warn('[content] Sanity 不可用，走本地兜底数据：', (err as Error).message)
    return localGuides.find(g => g.slug === slug) ?? null
  }
}

export async function getFeaturedGuides(): Promise<Guide[]> {
  const guides = await getGuides()
  return guides.filter(g => g.featured)
}

// ---------------------------------------------------------------------------
// 与旧站 astro:content 形状兼容的 PostEntry：主题组件（Card / DealCard /
// DealOverview / 文章页）按旧字段名取数，改动最小。
// id 用 Sanity 文档 _id；filePath 沿用旧站路径写法，供 getPostPaths 生成
// /blog/<slug>/ 与 /blog/deals/<slug>/ 之用。
// ---------------------------------------------------------------------------

export interface PostData {
  title: string
  description: string
  audience: string
  tags: string[]
  keywords?: string[]
  featured?: boolean
  draft: false
  dealManaged?: 2
  dealStatus?: string
  dealValidUntil?: Date | null
  dealRecord?: Record<string, unknown>
  pubDatetime: Date
  modDatetime?: Date | null
  hideEditPost?: boolean
  hideToc?: boolean
  timezone?: string
}

export interface PostEntry {
  id: string
  filePath: string
  data: PostData
}

function toPostData(common: {
  title: string
  description: string
  audience: string
  tags?: string[]
  keywords?: string[]
  featured?: boolean
  pubDatetime: string
  modDatetime?: string | null
}): PostData {
  return {
    title: common.title,
    description: common.description,
    audience: common.audience,
    tags: common.tags ?? ['others'],
    keywords: common.keywords ?? [],
    featured: common.featured,
    draft: false,
    pubDatetime: new Date(common.pubDatetime),
    modDatetime: common.modDatetime ? new Date(common.modDatetime) : null,
    hideEditPost: true,
  }
}

export function dealToPost(deal: Deal): PostEntry {
  const rec = (deal.dealRecord ?? {}) as Record<string, unknown>
  return {
    id: `deals/${deal.slug}`,
    filePath: `src/content/blog/deals/${deal.slug}.md`,
    data: {
      ...toPostData(deal),
      dealManaged: 2,
      dealStatus: deal.dealStatus,
      dealValidUntil: deal.dealValidUntil ? new Date(deal.dealValidUntil) : null,
      dealRecord: {
        benefit: deal.benefit,
        cost: deal.cost,
        claimUrl: deal.claimUrl ?? undefined,
        ...rec,
      },
    },
  }
}

export function guideToPost(guide: Guide): PostEntry {
  return {
    id: guide.slug,
    filePath: `src/content/blog/${guide.slug}.md`,
    data: toPostData(guide),
  }
}

/** 全部可见文章（可见 deals + 全部 guides），按更新时间倒序。 */
export async function getAllPosts(): Promise<PostEntry[]> {
  const [deals, guides] = await Promise.all([getDeals(), getGuides()])
  return [...deals.map(dealToPost), ...guides.map(guideToPost)].sort(
    (a, b) =>
      Math.floor((b.data.modDatetime ?? b.data.pubDatetime).getTime() / 1000) -
      Math.floor((a.data.modDatetime ?? a.data.pubDatetime).getTime() / 1000)
  )
}

/** Portable Text 正文里抽 h2/h3，生成与 PostToc 兼容的 headings。 */
export function headingsFromBody(body: unknown[]): { depth: number; slug: string; text: string }[] {
  const seen = new Map<string, number>()
  const out: { depth: number; slug: string; text: string }[] = []
  for (const b of body || []) {
    const block = b as { _type?: string; style?: string; children?: { text?: string }[] }
    if (block._type !== 'block' || (block.style !== 'h2' && block.style !== 'h3')) continue
    const text = (block.children || []).map(c => c.text || '').join('')
    if (!text) continue
    const base = text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .trim()
      .replace(/\s+/g, '-')
    const n = (seen.get(base) ?? 0) + 1
    seen.set(base, n)
    out.push({ depth: block.style === 'h2' ? 2 : 3, slug: n > 1 ? `${base}-${n - 1}` : base, text })
  }
  return out
}
