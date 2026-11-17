import type { PostEntry } from "@/lib/content";

/** 按“最后更新”倒序（modDatetime 优先，否则 pubDatetime）。过滤已在 content.ts 完成。 */
export function getSortedPosts(posts: PostEntry[]) {
  return [...posts].sort(
    (a, b) =>
      Math.floor(
        (b.data.modDatetime ?? b.data.pubDatetime).getTime() / 1000
      ) -
      Math.floor(
        (a.data.modDatetime ?? a.data.pubDatetime).getTime() / 1000
      )
  );
}
