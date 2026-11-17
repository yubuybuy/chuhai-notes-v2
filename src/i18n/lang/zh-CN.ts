import type { UIStrings } from "../types";
export default {
 nav:{home:"首页",posts:"文章",tags:"分类",about:"关于",archives:"归档",search:"搜索"},
 post:{publishedAt:"发布于",updatedAt:"最后更新",sharePostIntro:"分享文章",sharePostOn:"分享到 {{platform}}",sharePostViaEmail:"通过邮件分享",tagLabel:"标签",backToTop:"回到顶部",tableOfContents:"文章目录",goBack:"返回",editPage:"编辑文章",previousPost:"上一篇",nextPost:"下一篇"},
 pagination:{prev:"上一页",next:"下一页",page:"页"},
 home:{socialLinks:"社交链接",featured:"从这三篇开始",recentPosts:"最近更新",allPosts:"全部文章"},
 footer:{copyright:"版权所有",allRightsReserved:"出海手记"},
 pages:{tagTitle:"分类",tagDesc:"该分类下的全部文章",tagsTitle:"分类",tagsDesc:"按主题浏览文章",postsTitle:"文章",postsDesc:"选购指南与工具笔记，持续核实与更新。",archivesTitle:"归档",archivesDesc:"历史文章",searchTitle:"搜索",searchDesc:"搜索文章与工具名称"},
 a11y:{skipToContent:"跳到正文",skipTableOfContents:"跳过目录",openMenu:"打开菜单",closeMenu:"关闭菜单",toggleTheme:"切换明暗主题",searchPlaceholder:"搜索文章…",noResults:"没有找到相关内容",goToPreviousPage:"上一页",goToNextPage:"下一页"},
 notFound:{title:"404 页面不存在",message:"没有找到这个页面",goHome:"返回首页"}
} satisfies UIStrings;
