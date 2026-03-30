"use client";
import {
	useState,
	useRef,
	useEffect,
	useLayoutEffect,
	useCallback,
} from "react";
import Image from "next/image";
import Link from "next/link";
import logo from "@public/website/logo.png";
import bigLogo from "@public/website/big-logo.png";
import { Menu, X, Ellipsis } from "lucide-react";
import {
	Sheet,
	// SheetClose,
	SheetContent,
	// SheetDescription,
	// SheetFooter,
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

// ─── 常量 ────────────────────────────────────────────────────────────────────

/** 向下滚动超过该距离后隐藏导航栏 */
const SCROLL_HIDE_THRESHOLD = 50;

/** 向上累计滚动超过该距离后重新显示导航栏 */
const SCROLL_UP_TRIGGER_DISTANCE = 200;

/** 鼠标离开 Popover 后延迟关闭的时间（ms） */
const POPOVER_CLOSE_DELAY = 300;

/** 中等屏幕下导航栏可见的条目数量（810px ~ 1110px） */
const NAV_VISIBLE_COUNT = 3;

/** 公司全称，用于图片 alt 属性 */
const COMPANY_NAME = "六安市绿水云山大数据产业发展股份有限公司";

// ─── 类型 ────────────────────────────────────────────────────────────────────

interface NavItem {
	label: string;
	href: string;
}

// ─── 导航数据 ─────────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
	{ label: "首页", href: "/" },
	{ label: "公司概况", href: "/about" },
	{ label: "新闻中心", href: "/news" },
	{ label: "项目展示", href: "/projects" },
	{ label: "解决方案", href: "/solutions" },
	{ label: "党建工作", href: "/party" },
	{ label: "关于我们", href: "/contact" },
];

/** 中等宽度导航中直接可见的导航项（不折叠进 Popover） */
const VISIBLE_NAV_ITEMS = NAV_ITEMS.slice(0, NAV_VISIBLE_COUNT);

/** 中等宽度导航中折叠进 Popover 的导航项 */
const OVERFLOW_NAV_ITEMS = NAV_ITEMS.slice(NAV_VISIBLE_COUNT);

// ─── 样式常量 ─────────────────────────────────────────────────────────────────

/** 导航链接通用样式 */
const NAV_LINK_CLASS =
	"text-[15px] text-gray-700 hover:text-[#0066cc] transition-colors whitespace-wrap";

/** 登录链接样式 */
const LOGIN_LINK_CLASS =
	"ml-4 text-[15px] text-[#0066cc] hover:text-[#004fa3] transition-colors whitespace-wrap";

// ─── 自定义 Hook ──────────────────────────────────────────────────────────────

/**
 * 监听页面滚动，向下超过阈值时隐藏，向上累计足够距离时显示。
 * 使用 rAF 节流，避免滚动事件频繁触发重渲染。
 */
function useScrollHideHeader() {
	// SSR 与客户端初始值统一为 false，避免 Hydration 不匹配
	const [hidden, setHidden] = useState(false);
	// 使用 ref 追踪 hidden，避免将其加入 useEffect 依赖导致频繁重绑定监听器
	const hiddenRef = useRef(false);
	const lastScrollY = useRef(0);
	const upStartY = useRef<number | null>(null);

	// 同步 ref 与 state
	const setHiddenSync = useCallback((value: boolean) => {
		hiddenRef.current = value;
		setHidden(value);
	}, []);

	// 在浏览器绘制前同步初始滚动状态，处理硬刷新后浏览器恢复滚动位置的场景
	// useLayoutEffect 在 SSR 阶段不执行，不会引起 Hydration 不匹配
	// useLayoutEffect(() => {
	// 	lastScrollY.current = window.scrollY;
	// 	if (window.scrollY > SCROLL_HIDE_THRESHOLD) {
	// 		setHiddenSync(true);
	// 	}
	// }, []);

	useEffect(() => {
		let rafId: ReturnType<typeof requestAnimationFrame> | null = null;

		const handleScroll = () => {
			// rAF 节流：上一帧未执行完则跳过
			if (rafId !== null) return;
			rafId = requestAnimationFrame(() => {
				rafId = null;
				const currentY = window.scrollY;
				const isScrollingDown = currentY > lastScrollY.current;

				if (isScrollingDown) {
					// 向下滚动：重置向上起点，超过阈值则隐藏
					upStartY.current = null;
					if (currentY > SCROLL_HIDE_THRESHOLD && !hiddenRef.current) {
						setHiddenSync(true);
					}
				} else {
					// 已回到顶部，直接显示
					if (currentY <= 0) {
						upStartY.current = null;
						setHiddenSync(false);
						lastScrollY.current = currentY;
						return;
					}
					// 向上滚动：记录起点，累计距离超过阈值才显示
					if (upStartY.current === null) {
						upStartY.current = lastScrollY.current;
					}
					if (
						hiddenRef.current &&
						upStartY.current - currentY > SCROLL_UP_TRIGGER_DISTANCE
					) {
						setHiddenSync(false);
					}
				}

				lastScrollY.current = currentY;
			});
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => {
			window.removeEventListener("scroll", handleScroll);
			if (rafId !== null) cancelAnimationFrame(rafId);
		};
	}, [setHiddenSync]); // setHiddenSync 由 useCallback 稳定，不会重新绑定

	return hidden;
}

/**
 * 鼠标悬停触发的 Popover 开关控制。
 * 鼠标离开后延迟关闭，防止移动到 PopoverContent 时意外关闭。
 */
function useHoverPopover() {
	const [open, setOpen] = useState(false);
	const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	// 组件卸载时清理定时器，防止内存泄漏
	useEffect(() => {
		return () => {
			if (closeTimer.current) clearTimeout(closeTimer.current);
		};
	}, []);

	const handleMouseEnter = useCallback(() => {
		if (closeTimer.current) clearTimeout(closeTimer.current);
		setOpen(true);
	}, []);

	const handleMouseLeave = useCallback(() => {
		closeTimer.current = setTimeout(() => setOpen(false), POPOVER_CLOSE_DELAY);
	}, []);

	return { open, setOpen, handleMouseEnter, handleMouseLeave };
}

// ─── 子组件 ───────────────────────────────────────────────────────────────────

/** 头部 Logo 区域，根据断点切换大小图 */
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

/** PC 全宽导航（≥ 1110px），显示所有导航项 */
function DesktopFullNav() {
	return (
		<nav className="hidden nav1110:flex items-center gap-x-8">
			{NAV_ITEMS.map((item) => (
				<Link key={item.href} href={item.href} className={NAV_LINK_CLASS}>
					{item.label}
				</Link>
			))}
			<Link href="/login" className={LOGIN_LINK_CLASS}>
				登录
			</Link>
		</nav>
	);
}

/** PC 中等宽度导航（810px ~ 1110px），部分导航折叠进 Popover */
function DesktopCompactNav() {
	const { open, setOpen, handleMouseEnter, handleMouseLeave } =
		useHoverPopover();

	return (
		<nav className="hidden nav810:flex nav1110:hidden items-center gap-x-8">
			{VISIBLE_NAV_ITEMS.map((item) => (
				<Link key={item.href} href={item.href} className={NAV_LINK_CLASS}>
					{item.label}
				</Link>
			))}

			{/* 超出部分折叠为 Popover 菜单 */}
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<button
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
					className="w-auto min-w-[120px] p-2"
				>
					<div className="flex flex-col gap-y-1">
						{OVERFLOW_NAV_ITEMS.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								onClick={() => setOpen(false)}
								className="px-3 py-2 text-[15px] text-gray-700 hover:text-[#0066cc] hover:bg-slate-50 rounded transition-colors"
							>
								{item.label}
							</Link>
						))}
					</div>
				</PopoverContent>
			</Popover>

			<Link href="/login" className={LOGIN_LINK_CLASS}>
				登录
			</Link>
		</nav>
	);
}

/** 移动端抽屉导航（< 810px），通过汉堡按钮触发全屏 Sheet */
function MobileNav() {
	const [open, setOpen] = useState(false);

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="nav810:hidden text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
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
				{/* 无障碍：对屏幕阅读器可见的标题 */}
				<SheetHeader className="sr-only">
					<SheetTitle>导航菜单</SheetTitle>
					{/* <SheetDescription>导航菜单描述</SheetDescription> */}
				</SheetHeader>

				{/* 菜单顶部：Logo + 关闭按钮 */}
				<div className="flex items-center justify-between px-4 h-[64px] border-b border-gray-200 shadow-sm">
					<Link href="/" onClick={() => setOpen(false)}>
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
						onClick={() => setOpen(false)}
						className="text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
						aria-label="关闭菜单"
					>
						<X className="size-[22px]" strokeWidth={1.5} />
					</Button>
				</div>

				{/* 菜单列表：首页高亮 */}
				<nav className="flex flex-col">
					{NAV_ITEMS.map((item, index) => (
						<Link
							key={item.href}
							href={item.href}
							onClick={() => setOpen(false)}
							className={`px-6 py-5 text-[16px] text-gray-800 hover:bg-slate-50 transition-colors border-b border-gray-100 ${
								index === 0 ? "bg-slate-100" : ""
							}`}
						>
							{item.label}
						</Link>
					))}
				</nav>
				{/* <SheetFooter className="sr-only"></SheetFooter> */}
			</SheetContent>
		</Sheet>
	);
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────

export default function Header() {
	const hidden = useScrollHideHeader();

	return (
		<>
			<header
				className={`fixed top-0 left-0 z-10 w-full h-[64px] bg-white border-b border-gray-200 shadow-md transition-transform duration-300 ${
					hidden ? "-translate-y-full" : "translate-y-0"
				}`}
			>
				<div className="w-full h-full flex items-center justify-between gap-x-4 px-4">
					<HeaderLogo />
					<DesktopFullNav />
					<DesktopCompactNav />
					<MobileNav />
				</div>
			</header>
			{/* 占位块，防止页面内容被固定导航栏遮挡 */}
			<div className="w-full h-[64px]" aria-hidden="true" />
		</>
	);
}
