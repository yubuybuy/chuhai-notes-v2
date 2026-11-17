import { createClient } from '@sanity/client'

/**
 * Sanity 读客户端。构建时拉取已发布内容，必须 useCdn: false，
 * 否则 CDN 缓存会让刚发布的文章进不了当次构建。
 * 没有凭据时不抛错——src/lib/content.ts 会走本地兜底数据。
 */
export const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID
export const dataset = import.meta.env.PUBLIC_SANITY_DATASET || 'production'
export const apiVersion = import.meta.env.SANITY_API_VERSION || '2026-03-01'
export const hasSanityConfig = Boolean(projectId)

export const sanityClient = hasSanityConfig
  ? createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: false,
      token: import.meta.env.SANITY_API_TOKEN || undefined,
    })
  : null

export async function fetchSanity<T>(query: string, params: Record<string, unknown> = {}): Promise<T> {
  if (!sanityClient) throw new Error('Sanity 未配置（缺少 PUBLIC_SANITY_PROJECT_ID）')
  return sanityClient.fetch<T>(query, params)
}

/** deals 列表（已发布、按发布时间倒序） */
export const DEALS_QUERY = `*[_type == "deal" && defined(slug.current)] | order(pubDatetime desc) {
  _id, title, "slug": slug.current, description, audience, benefit, cost,
  conditions, expiresAt, claimUrl, verification, dealStatus, dealValidUntil,
  dealRecord, unknowns, tags, pubDatetime, modDatetime, body
}`

/** 单篇 deal */
export const DEAL_BY_SLUG_QUERY = `*[_type == "deal" && slug.current == $slug][0] {
  _id, title, "slug": slug.current, description, audience, benefit, cost,
  conditions, expiresAt, claimUrl, verification, dealStatus, dealValidUntil,
  dealRecord, unknowns, tags, pubDatetime, modDatetime, body
}`

/** guides 列表 */
export const GUIDES_QUERY = `*[_type == "guide" && defined(slug.current)] | order(pubDatetime desc) {
  _id, title, "slug": slug.current, description, audience, tags, keywords,
  featured, pubDatetime, modDatetime, body
}`

/** 单篇 guide */
export const GUIDE_BY_SLUG_QUERY = `*[_type == "guide" && slug.current == $slug][0] {
  _id, title, "slug": slug.current, description, audience, tags, keywords,
  featured, pubDatetime, modDatetime, body
}`
