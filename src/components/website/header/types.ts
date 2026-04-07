import type { Item } from "@/lib/http/interface";

// ─── 导航数据类型 ──────────────────────────────────────────────────────────────

/**
 * 前端导航树节点。
 * 仅保留渲染所需字段，`children` 完成路径重写后由 `rewriteChildPaths` 填充。
 */
export type NavItem = Pick<Item, "cdId" | "cdName" | "cdPath"> & {
  children?: NavItem[] | null;
};

// ─── 激活态工具函数集合 ────────────────────────────────────────────────────────

/**
 * 由 `useActiveNav` 返回，贯穿所有导航子组件，
 * 集中到顶层实例化以避免多次调用 `usePathname`。
 */
export type ActiveNav = {
  /**
   * 判断顶级菜单项是否处于激活状态。
   * - 首页（`/`）：精确匹配
   * - 其余菜单：使用 `startsWith` 前缀匹配，子页面激活时父级同步高亮
   */
  isItemActive: (item: NavItem) => boolean;
  /** 判断子菜单项是否激活：`pathname` 完全匹配 `child.cdPath` */
  isChildActive: (child: NavItem) => boolean;
};

// ─── 通用 Props 类型 ───────────────────────────────────────────────────────────

/** 接收完整 `ActiveNav` 对象的组件 Props 基类 */
export type WithActiveNav = {
  activeNav: ActiveNav;
};

/** 接收导航数据 + 激活态的组件 Props 基类 */
export type NavProps = WithActiveNav & {
  navItems: NavItem[];
};
