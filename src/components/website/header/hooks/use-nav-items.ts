import { useState, useEffect } from "react";
import { getMenuApi } from "@/lib/http/modules/portal-official-website";
import type { NavItem } from "../types";

/**
 * 将后端返回的子项 `cdPath` 统一重写为前端路由路径。
 *
 * 规则：`{父cdPath}/{父cdPath}-{序号}`（序号从 1 开始）。
 * 例：父级 `"about"` → 子项依次重写为 `"about/about-1"`、`"about/about-2"`。
 *
 * @param items 原始菜单树（仅处理第一级 children）
 */
function rewriteChildPaths(items: NavItem[]): NavItem[] {
  return items.map((item) => ({
    ...item,
    children: item.children?.map((child, index) => ({
      ...child,
      cdPath: `${item.cdPath}/${item.cdPath}-${index + 1}`,
    })),
  }));
}

/**
 * 请求菜单数据并完成子项路径重写。
 *
 * - 兼容后端返回 `{ data: [...] }` 或直接返回数组两种结构
 * - 接口异常时静默处理，保持空数组，不影响页面渲染
 */
export function useNavItems(): NavItem[] {
  const [navItems, setNavItems] = useState<NavItem[]>([]);

  useEffect(() => {
    getMenuApi()
      .then((res) => {
        // 兼容两种后端响应结构
        const raw = res as { data?: NavItem[] } | NavItem[];
        const data = Array.isArray(raw) ? raw : raw.data;

        if (Array.isArray(data) && data.length > 0) {
          setNavItems(rewriteChildPaths(data));
        }
      })
      .catch(() => {
        // 接口异常静默处理，导航降级为空
      });
  }, []);

  return navItems;
}
