import { resolveSiteUrl } from "./scripts/resolve-site-url.mjs";
import { defineAstroPaperConfig } from "./src/types/config";
export default defineAstroPaperConfig({
  site: {
    url: resolveSiteUrl(),
    title: "出海手记",
    description:
      "把工具选明白，把优惠用起来。机场、VPS 与代理工具入门，免费额度与实用优惠整理。",
    author: "出海手记",
    ogImage: "default-og.png",
    lang: "zh-CN",
    timezone: "Asia/Shanghai",
    dir: "ltr",
  },
  posts: { perPage: 8, perIndex: 3 },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: false,
    showArchives: false,
    showBackButton: false,
    editPost: { enabled: false },
    search: "pagefind",
    toc: true,
  },
  socials: [],
  shareLinks: [],
});
