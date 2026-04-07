// ─── 滚动行为阈值 ─────────────────────────────────────────────────────────────

/** 向下滚动超过此距离后隐藏导航栏（px） */
export const SCROLL_HIDE_THRESHOLD = 50;

/** 向上累计滚动超过此距离才重新显示导航栏，防止轻微抖动触发（px） */
export const SCROLL_UP_TRIGGER_DISTANCE = 200;

// ─── Popover 行为 ─────────────────────────────────────────────────────────────

/** 鼠标离开后延迟关闭 Popover 的时间，防止鼠标从 Trigger 移入 Content 时闪烁（ms） */
export const POPOVER_CLOSE_DELAY = 300;

// ─── 导航布局 ─────────────────────────────────────────────────────────────────

/** 紧凑模式（810px~1110px）下直接展示的最大导航条目数，超出部分折叠进 ··· */
export const NAV_VISIBLE_COUNT = 3;

/** 移动端抽屉断点：窗口宽度超过此值时自动关闭抽屉（px） */
export const MOBILE_BREAKPOINT = 810;

// ─── 品牌信息 ─────────────────────────────────────────────────────────────────

export const COMPANY_NAME = "六安市绿水云山大数据产业发展股份有限公司";

// ─── 样式类名常量 ──────────────────────────────────────────────────────────────

/**
 * 统一管理复用率高的 Tailwind 类名组合，避免字符串散落各处。
 * 使用 `as const` 确保 TypeScript 推导出字面量类型。
 */
export const CLS = {
  /** 顶级导航链接基础样式 */
  navLink:
    "text-[15px] text-gray-700 hover:text-[#0066cc] transition-colors whitespace-wrap",
  /** 顶级导航链接激活样式（叠加在 navLink 上） */
  navLinkActive:
    "text-[#0066cc] font-medium border-b-2 border-[#0066cc] pb-0.5",
  /** 头部右侧登录链接 */
  loginLink:
    "ml-4 text-[15px] text-[#0066cc] hover:text-[#004fa3] transition-colors whitespace-wrap",
  /** 下拉子菜单链接基础样式 */
  dropdownItem:
    "px-3 py-2 text-[14px] text-gray-700 hover:text-[#0066cc] hover:bg-slate-50 rounded transition-colors whitespace-nowrap",
  /** 下拉子菜单链接激活样式（叠加在 dropdownItem 上） */
  dropdownItemActive: "text-[#0066cc] bg-slate-100 font-medium",
} as const;
