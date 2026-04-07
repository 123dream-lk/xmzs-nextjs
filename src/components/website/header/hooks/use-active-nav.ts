import { useCallback } from "react";
import { usePathname } from "next/navigation";
import type { ActiveNav, NavItem } from "../types";

/**
 * 将相对路径转换为以 `/` 开头的路由路径，自动去除双斜杠。
 * @example toHref("about") → "/about"
 * @example toHref("/about") → "/about"（不产生 "//about"）
 */
export function toHref(cdPath: string): string {
  return `/${cdPath}`.replace(/^\/\//, "/");
}

/**
 * 根据当前路由计算导航项激活状态。
 *
 * 在顶层 `Header` 统一实例化，所有子组件通过 prop 接收 `ActiveNav` 对象，
 * 避免各子组件分别调用 `usePathname` 产生多余路由订阅。
 *
 * 激活规则：
 * - `isItemActive`：首页精确匹配 `/`，其余菜单使用 `startsWith` 前缀匹配
 * - `isChildActive`：`pathname` 完全等于子项路径
 */
export function useActiveNav(): ActiveNav {
  const pathname = usePathname();

  const isItemActive = useCallback(
    (item: NavItem): boolean => {
      const href = toHref(item.cdPath);
      return href === "/" ? pathname === "/" : pathname.startsWith(href);
    },
    [pathname]
  );

  const isChildActive = useCallback(
    (child: NavItem): boolean => pathname === toHref(child.cdPath),
    [pathname]
  );

  return { isItemActive, isChildActive };
}
