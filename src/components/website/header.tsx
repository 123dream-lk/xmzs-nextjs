"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, Ellipsis, ChevronLeft, ChevronRight } from "lucide-react";
import logo from "@public/website/logo.png";
import bigLogo from "@public/website/big-logo.png";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import {
  MOBILE_BREAKPOINT,
  NAV_VISIBLE_COUNT,
  COMPANY_NAME,
  CLS,
} from "./header/constants";
import type { NavItem, ActiveNav, NavProps } from "./header/types";
import {
  useScrollHideHeader,
  useHoverPopover,
  useNavItems,
  useActiveNav,
  toHref,
} from "./header/hooks";

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

/** 类型守卫：导航项是否含有非空子项数组 */
function hasChildren(item: NavItem): item is NavItem & { children: NavItem[] } {
  return Array.isArray(item.children) && item.children.length > 0;
}

// ─── Logo ─────────────────────────────────────────────────────────────────────

/** 头部 Logo，nav440 断点以上展示小图，以下展示大图 */
function HeaderLogo() {
  return (
    <Link href="/" className="shrink-0">
      <Image
        src={logo}
        alt={COMPANY_NAME}
        loading="eager"
        className="w-auto h-[40px] hidden nav440:block"
      />
      <Image
        src={bigLogo}
        alt={COMPANY_NAME}
        loading="eager"
        className="w-auto h-[36px] block nav440:hidden"
      />
    </Link>
  );
}

// ─── 下拉子菜单链接列表 ────────────────────────────────────────────────────────

/**
 * 下拉菜单中的子链接列表，被 `NavItemWithPopover` 与 `OverflowNavItem` 共用。
 * 统一处理激活高亮与点击后关闭逻辑。
 */
function DropdownLinks({
  items,
  isChildActive,
  onSelect,
}: {
  items: NavItem[];
  isChildActive: ActiveNav["isChildActive"];
  onSelect: () => void;
}) {
  return (
    <div className="flex flex-col gap-y-1">
      {items.map((child) => (
        <Link
          key={child.cdId}
          href={toHref(child.cdPath)}
          onClick={onSelect}
          className={cn(
            CLS.dropdownItem,
            isChildActive(child) && CLS.dropdownItemActive
          )}
        >
          {child.cdName}
        </Link>
      ))}
    </div>
  );
}

// ─── PC 导航项（含悬浮下拉） ──────────────────────────────────────────────────

/**
 * PC 端单个导航项。
 * - 无子项：直接渲染链接
 * - 有子项：阻止 Link 跳转，悬浮时向下弹出子菜单 Popover
 */
function NavItemWithPopover({
  item,
  activeNav,
  onLinkClick,
}: {
  item: NavItem;
  activeNav: ActiveNav;
  onLinkClick?: () => void;
}) {
  const { open, setOpen, handleMouseEnter, handleMouseLeave } =
    useHoverPopover();
  const { isItemActive, isChildActive } = activeNav;
  const isActive = isItemActive(item);
  const navLinkCls = cn(CLS.navLink, isActive && CLS.navLinkActive);

  if (!hasChildren(item)) {
    return (
      <Link
        href={toHref(item.cdPath)}
        className={navLinkCls}
        onClick={onLinkClick}
      >
        {item.cdName}
      </Link>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Link
          href={toHref(item.cdPath)}
          className={navLinkCls}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={(e) => {
            // 有子项时阻止跳转与冒泡，由悬浮展开子菜单代替点击跳转
            e.preventDefault();
            e.stopPropagation();
            onLinkClick?.();
          }}
        >
          {item.cdName}
        </Link>
      </PopoverTrigger>
      <PopoverContent
        align="center"
        sideOffset={15}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="w-auto min-w-[140px] p-2"
      >
        <DropdownLinks
          items={item.children}
          isChildActive={isChildActive}
          onSelect={() => {
            setOpen(false);
            onLinkClick?.();
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

// ─── 折叠菜单项（··· Popover 内） ─────────────────────────────────────────────

/**
 * 折叠菜单（`···`）中的单个导航项。
 * - 无子项：直接渲染链接
 * - 有子项：悬浮时向左弹出二级菜单 Popover
 */
function OverflowNavItem({
  item,
  activeNav,
  onClose,
}: {
  item: NavItem;
  activeNav: ActiveNav;
  onClose: () => void;
}) {
  const { open, setOpen, handleMouseEnter, handleMouseLeave } =
    useHoverPopover();
  const { isItemActive, isChildActive } = activeNav;
  const isActive = isItemActive(item);

  if (!hasChildren(item)) {
    return (
      <Link
        href={toHref(item.cdPath)}
        onClick={onClose}
        className={cn(CLS.dropdownItem, isActive && CLS.dropdownItemActive)}
      >
        {item.cdName}
      </Link>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={cn(
            "flex items-center justify-between gap-x-2 px-3 py-2 text-[15px] text-gray-700",
            "hover:text-[#0066cc] hover:bg-slate-50 rounded transition-colors cursor-pointer whitespace-nowrap",
            isActive && CLS.dropdownItemActive
          )}
        >
          {/* 阻止 Link 默认跳转，由悬浮展开的子菜单代替 */}
          <Link
            href={toHref(item.cdPath)}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            {item.cdName}
          </Link>
          <span className="text-gray-400 text-xs">
            <ChevronLeft className="size-2.5" strokeWidth={2.5} />
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent
        side="left"
        align="start"
        sideOffset={8}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="w-auto min-w-[140px] p-2"
      >
        <DropdownLinks
          items={item.children}
          isChildActive={isChildActive}
          onSelect={() => {
            setOpen(false);
            onClose();
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

// ─── PC 全宽导航（≥ 1110px） ──────────────────────────────────────────────────

/** PC 全宽模式，展示所有导航条目 */
function DesktopFullNav({ navItems, activeNav }: NavProps) {
  return (
    <nav className="hidden nav1110:flex items-center gap-x-8">
      {navItems.map((item) => (
        <NavItemWithPopover key={item.cdId} item={item} activeNav={activeNav} />
      ))}
      <Link href="/login" className={CLS.loginLink}>
        登录
      </Link>
    </nav>
  );
}

// ─── PC 紧凑导航（810px ~ 1110px） ───────────────────────────────────────────

/**
 * PC 紧凑模式，仅展示前 `NAV_VISIBLE_COUNT` 个导航条目，
 * 超出部分折叠进 `···` Popover。
 */
function DesktopCompactNav({ navItems, activeNav }: NavProps) {
  const { open, setOpen, handleMouseEnter, handleMouseLeave } =
    useHoverPopover();

  const visibleItems = navItems.slice(0, NAV_VISIBLE_COUNT);
  const overflowItems = navItems.slice(NAV_VISIBLE_COUNT);

  return (
    <nav className="hidden nav810:flex nav1110:hidden items-center gap-x-8">
      {visibleItems.map((item) => (
        <NavItemWithPopover key={item.cdId} item={item} activeNav={activeNav} />
      ))}

      {overflowItems.length > 0 && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              className="text-gray-700 hover:text-[#0066cc] transition-colors cursor-pointer"
              aria-label="更多导航"
            >
              <Ellipsis className="size-5" strokeWidth={1.8} />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="center"
            sideOffset={15}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="w-auto min-w-[120px] p-2 flex flex-col gap-y-1"
          >
            {overflowItems.map((item) => (
              <OverflowNavItem
                key={item.cdId}
                item={item}
                activeNav={activeNav}
                onClose={() => setOpen(false)}
              />
            ))}
          </PopoverContent>
        </Popover>
      )}

      <Link href="/login" className={CLS.loginLink}>
        登录
      </Link>
    </nav>
  );
}

// ─── 移动端单个导航项 ──────────────────────────────────────────────────────────

/**
 * 移动端抽屉内的单个导航项，支持子菜单展开/收起。
 *
 * 初始展开状态由子项激活情况决定：
 * 若当前路由匹配某子项，则打开抽屉后父级默认展开，方便用户定位当前位置。
 */
function MobileNavItem({
  item,
  activeNav,
  onClose,
}: {
  item: NavItem;
  activeNav: ActiveNav;
  onClose: () => void;
}) {
  const { isItemActive, isChildActive } = activeNav;
  const itemHasChildren = hasChildren(item);
  const isActive = isItemActive(item);

  const [expanded, setExpanded] = useState(
    () => itemHasChildren && item.children.some(isChildActive)
  );

  const toggleExpanded = useCallback(() => setExpanded((prev) => !prev), []);

  return (
    <div className="border-b border-gray-100">
      {/* 父级行：有子项时切换展开/收起，无子项时直接关闭抽屉 */}
      <div
        className={cn(
          "flex items-center justify-between gap-5 px-6 py-5 text-[16px] text-gray-800",
          "hover:bg-slate-50 transition-colors cursor-pointer",
          isActive && "bg-slate-100 text-[#0066cc]"
        )}
        onClick={itemHasChildren ? toggleExpanded : onClose}
      >
        <Link
          href={toHref(item.cdPath)}
          className={cn("flex-1", isActive && "text-[#0066cc] font-medium")}
          onClick={(e) => {
            // 有子项时阻止 Link 跳转，由外层 div 的 onClick 处理展开逻辑
            if (itemHasChildren) e.preventDefault();
          }}
        >
          {item.cdName}
        </Link>

        {itemHasChildren && (
          <span
            className={cn(
              "text-gray-400 transition-transform duration-200 origin-center",
              expanded && "rotate-90"
            )}
          >
            <ChevronRight className="size-3" strokeWidth={2.5} />
          </span>
        )}
      </div>

      {/* 子项列表：展开时渲染，激活子项高亮 */}
      {itemHasChildren && expanded && (
        <div className="bg-slate-50 flex flex-col">
          {item.children.map((child) => (
            <Link
              key={child.cdId}
              href={toHref(child.cdPath)}
              onClick={onClose}
              className={cn(
                "pl-10 pr-6 py-4 text-[15px] text-gray-600",
                "hover:text-[#0066cc] hover:bg-slate-100 transition-colors border-t border-gray-100",
                isChildActive(child) && CLS.dropdownItemActive
              )}
            >
              {child.cdName}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 移动端抽屉导航（< 810px） ────────────────────────────────────────────────

/**
 * 移动端汉堡菜单 + 右滑抽屉导航。
 *
 * 窗口尺寸变化处理：
 * - 宽屏时自动关闭抽屉，并记录关闭前的开启状态
 * - 窗口恢复窄屏后，若之前是手动打开的，则自动重新打开
 *
 * 使用 `ref` 追踪抽屉状态，让 resize 回调无需重新注册即可读取最新值。
 */
function MobileNav({ navItems, activeNav }: NavProps) {
  const [open, setOpen] = useState(false);
  // ref 追踪当前开启状态，让 resize 回调无需重新绑定即可获取最新值
  const openRef = useRef(false);
  // 记录"因宽屏自动关闭"的状态，窗口恢复窄屏后自动重新打开
  const wasAutoClosedRef = useRef(false);

  const handleClose = useCallback(() => setOpen(false), []);

  // 保持 ref 与 state 同步
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // 监听窗口宽度变化，在宽屏时自动关闭抽屉
  useEffect(() => {
    let throttleTimer: ReturnType<typeof setTimeout> | null = null;

    const handleResize = () => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        throttleTimer = null;

        if (window.innerWidth > MOBILE_BREAKPOINT) {
          if (openRef.current) {
            wasAutoClosedRef.current = true;
            setOpen(false);
          }
        } else if (wasAutoClosedRef.current) {
          wasAutoClosedRef.current = false;
          setOpen(true);
        }
      }, 150);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="nav810:hidden text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="打开菜单"
        >
          <Menu strokeWidth={1.8} className="size-[22px]" />
        </Button>
      </SheetTrigger>

      <SheetContent
        showCloseButton={false}
        side="right"
        aria-describedby={undefined}
        className="w-full p-0 border-none [&>button]:hidden"
      >
        {/* 无障碍标题：屏幕阅读器可读，视觉上隐藏 */}
        <SheetHeader className="sr-only">
          <SheetTitle>导航菜单</SheetTitle>
        </SheetHeader>

        {/* 抽屉顶部栏：Logo + 关闭按钮 */}
        <div className="flex items-center justify-between px-4 h-[64px] border-b border-gray-200 shadow-sm">
          <Link href="/" onClick={handleClose}>
            <Image
              src={logo}
              alt={COMPANY_NAME}
              loading="eager"
              className="w-auto h-[32px]"
            />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-800 transition-colors"
            aria-label="关闭菜单"
          >
            <X className="size-[22px]" strokeWidth={1.5} />
          </Button>
        </div>

        <nav className="flex flex-col overflow-y-auto">
          {navItems.map((item) => (
            <MobileNavItem
              key={item.cdId}
              item={item}
              activeNav={activeNav}
              onClose={handleClose}
            />
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────

/**
 * 网站顶部导航栏。
 *
 * 职责：
 * 1. 统一实例化 `useActiveNav`，避免子组件各自订阅路由变化
 * 2. 统一请求菜单数据（`useNavItems`）
 * 3. 根据滚动方向控制导航栏显隐（`useScrollHideHeader`）
 * 4. 按断点分发至 `DesktopFullNav` / `DesktopCompactNav` / `MobileNav`
 */
export default function Header() {
  const isHeaderHidden = useScrollHideHeader();
  const navItems = useNavItems();
  const activeNav = useActiveNav();

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 z-10 w-full h-[64px]",
          "bg-white border-b border-gray-200 shadow-md",
          "transition-transform duration-300",
          isHeaderHidden ? "-translate-y-full" : "translate-y-0"
        )}
      >
        <div className="w-full h-full flex items-center justify-between gap-x-4 px-4">
          <HeaderLogo />
          <DesktopFullNav navItems={navItems} activeNav={activeNav} />
          <DesktopCompactNav navItems={navItems} activeNav={activeNav} />
          <MobileNav navItems={navItems} activeNav={activeNav} />
        </div>
      </header>

      {/* 占位块，防止固定导航栏遮挡页面内容 */}
      <div className="w-full h-[64px]" aria-hidden="true" />
    </>
  );
}
