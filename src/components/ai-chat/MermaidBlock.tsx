"use client";

import { useEffect, useState, useRef, memo, useCallback } from "react";
import { createPortal } from "react-dom";
import mermaid from "mermaid";
import { Check, Copy, ZoomIn, X as XIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── 类型定义 ──────────────────────────────────────────────────────────────────

type CopyStatus = "idle" | "copied";

interface Point {
	x: number;
	y: number;
}

interface MermaidToolbarProps {
	copyStatus: CopyStatus;
	onCopy: () => void;
	onZoomIn: () => void;
}

interface MermaidModalProps {
	svgContent: string;
	onClose: () => void;
}

// ─── Mermaid 全局初始化 ────────────────────────────────────────────────────────

let isMermaidInitialized = false;

// 全局离屏容器：让 mermaid.render 在屏外渲染，避免插入 body 造成滚动条闪烁
let offscreenContainer: HTMLDivElement | null = null;

function getOffscreenContainer(): HTMLDivElement {
	if (!offscreenContainer) {
		offscreenContainer = document.createElement("div");
		offscreenContainer.style.cssText =
			"position:fixed;inset:0;z-index:-9999;overflow:hidden;pointer-events:none;visibility:hidden;opacity:0";
		document.body.appendChild(offscreenContainer);
	}
	return offscreenContainer;
}

const MERMAID_CONFIG: Parameters<typeof mermaid.initialize>[0] = {
	startOnLoad: false,
	theme: "base",
	securityLevel: "loose",
	themeVariables: {
		fontFamily: "ui-sans-serif, system-ui, sans-serif",
		fontSize: "14px",
		// 主节点（蓝/靛色系）
		primaryColor: "#eef2ff",
		primaryTextColor: "#312e81",
		primaryBorderColor: "#6366f1",
		// 连线颜色
		lineColor: "#64748b",
		// 次要节点（紫/粉色系）
		secondaryColor: "#faf5ff",
		secondaryTextColor: "#581c87",
		secondaryBorderColor: "#a855f7",
		// 第三级节点（灰/Slate 系）
		tertiaryColor: "#f8fafc",
		tertiaryBorderColor: "#94a3b8",
		// 备注（Amber 系）
		noteBkgColor: "#fffbeb",
		noteTextColor: "#92400e",
		noteBorderColor: "#f59e0b",
	},
	flowchart: {
		curve: "basis",
		htmlLabels: true,
	},
};

// ─── 复制按钮（可复用）────────────────────────────────────────────────────────

function CopyButton({
	copyStatus,
	onClick,
	variant = "toolbar",
}: {
	copyStatus: CopyStatus;
	onClick: () => void;
	/** toolbar: 工具栏样式；source: 源码面板内悬浮样式 */
	variant?: "toolbar" | "source";
}) {
	const isCopied = copyStatus === "copied";
	const baseClass =
		"flex items-center gap-1 px-2 py-1 rounded text-xs transition-all";
	const variantClass =
		variant === "toolbar"
			? "text-gray-400 hover:text-gray-700 hover:bg-gray-200"
			: "bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700 hover:border-gray-500";

	return (
		<button
			type="button"
			onClick={onClick}
			aria-label={isCopied ? "已复制" : "复制代码"}
			className={`${baseClass} ${variantClass}`}
		>
			{isCopied ? (
				<>
					<Check className="w-3.5 h-3.5 text-green-500" />
					<span className="text-green-500">已复制</span>
				</>
			) : (
				<>
					<Copy className="w-3.5 h-3.5" />
					<span>复制</span>
				</>
			)}
		</button>
	);
}

// ─── 工具栏（Tab 标题栏右侧：复制 + 放大）────────────────────────────────────

function MermaidToolbar({ copyStatus, onCopy, onZoomIn }: MermaidToolbarProps) {
	return (
		<div className="flex items-center gap-1">
			<Tooltip>
				<TooltipTrigger asChild>
					<CopyButton copyStatus={copyStatus} onClick={onCopy} />
				</TooltipTrigger>
				<TooltipContent side="top" className="text-xs">
					复制 Mermaid 源码
				</TooltipContent>
			</Tooltip>

			<Tooltip>
				<TooltipTrigger asChild>
					<button
						type="button"
						onClick={onZoomIn}
						aria-label="放大查看"
						className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-all"
					>
						<ZoomIn className="w-3.5 h-3.5" />
						<span>放大</span>
					</button>
				</TooltipTrigger>
				<TooltipContent side="top" className="text-xs">
					全屏查看图表
				</TooltipContent>
			</Tooltip>
		</div>
	);
}

// ─── 全屏弹窗（支持滚轮缩放 + 拖拽平移 + 双击重置）──────────────────────────

function MermaidModal({ svgContent, onClose }: MermaidModalProps) {
	const [scale, setScale] = useState(1);
	const [translate, setTranslate] = useState<Point>({ x: 0, y: 0 });
	const [isDragging, setIsDragging] = useState(false);

	// 用 ref 存储拖拽中间状态，避免闭包捕获问题
	const isDraggingRef = useRef(false);
	const dragStartRef = useRef<Point>({ x: 0, y: 0 });
	const translateRef = useRef<Point>({ x: 0, y: 0 });
	const canvasRef = useRef<HTMLDivElement>(null);

	// Esc 关闭
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [onClose]);

	// 滚轮缩放（需 passive:false 才能 preventDefault）
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ZOOM_SPEED = 0.001;
		const MIN_SCALE = 0.2;
		const MAX_SCALE = 10;

		const handleWheel = (e: WheelEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setScale((prev) => {
				const factor = 1 + -e.deltaY * ZOOM_SPEED;
				return Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev * factor));
			});
		};

		canvas.addEventListener("wheel", handleWheel, { passive: false });
		return () => canvas.removeEventListener("wheel", handleWheel);
	}, []);

	const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
		if (e.button !== 0) return;
		isDraggingRef.current = true;
		setIsDragging(true);
		dragStartRef.current = {
			x: e.clientX - translateRef.current.x,
			y: e.clientY - translateRef.current.y,
		};
		e.currentTarget.style.cursor = "grabbing";
	}, []);

	const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
		if (!isDraggingRef.current) return;
		const next: Point = {
			x: e.clientX - dragStartRef.current.x,
			y: e.clientY - dragStartRef.current.y,
		};
		translateRef.current = next;
		setTranslate(next);
	}, []);

	const handleMouseUp = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
		isDraggingRef.current = false;
		setIsDragging(false);
		e.currentTarget.style.cursor = "grab";
	}, []);

	// 双击重置缩放与位置
	const handleDoubleClick = useCallback(() => {
		setScale(1);
		const origin: Point = { x: 0, y: 0 };
		setTranslate(origin);
		translateRef.current = origin;
	}, []);

	return createPortal(
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
			onClick={onClose}
		>
			<div
				className="relative bg-white rounded-xl shadow-2xl"
				style={{ width: "90vw", height: "90vh" }}
				onClick={(e) => e.stopPropagation()}
			>
				{/* 关闭按钮 */}
				<button
					type="button"
					onClick={onClose}
					title="关闭"
					className="absolute top-3 right-3 z-20 p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
				>
					<XIcon className="w-5 h-5" />
				</button>

				{/* 操作提示 */}
				<p className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 text-xs text-gray-400 select-none pointer-events-none">
					滚轮缩放 · 拖拽移动 · 双击空白区域重置
				</p>

				{/* 可交互画布 */}
				<div
					ref={canvasRef}
					className="w-full h-full overflow-hidden rounded-xl"
					style={{ cursor: "grab" }}
					onMouseDown={handleMouseDown}
					onMouseMove={handleMouseMove}
					onMouseUp={handleMouseUp}
					onMouseLeave={handleMouseUp}
					onDoubleClick={handleDoubleClick}
				>
					<div
						className="w-full h-full flex items-center justify-center"
						style={{
							transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
							transformOrigin: "center center",
							transition: isDragging ? "none" : "transform 0.05s ease-out",
							userSelect: "none",
						}}
						dangerouslySetInnerHTML={{ __html: svgContent }}
					/>
				</div>
			</div>
		</div>,
		document.body
	);
}

// ─── 加载中占位（流式输出 / 渲染失败时显示源码）──────────────────────────────

function MermaidSourceFallback({
	code,
	isStreaming,
}: {
	code: string;
	isStreaming?: boolean;
}) {
	return (
		<div className="my-4 bg-gray-50 rounded-md border border-gray-200 overflow-hidden">
			<div className="flex items-center justify-between px-3 py-1 bg-gray-100 border-b border-gray-200 text-xs text-gray-500">
				<span>Mermaid</span>
				<span>{isStreaming ? "Generating..." : "Source"}</span>
			</div>
			<pre className="p-3 text-sm font-mono overflow-auto whitespace-pre">
				{code}
			</pre>
		</div>
	);
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────

const MermaidBlock = memo(function MermaidBlock({
	code,
	isStreaming,
}: {
	code: string;
	isStreaming?: boolean;
}) {
	const [svgContent, setSvgContent] = useState("");
	// 记录上一次成功渲染的代码，用于判断当前是否为"脏"状态（代码已更新但尚未渲染）
	const [lastRenderedCode, setLastRenderedCode] = useState("");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");

	const renderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// ── 初始化 mermaid（全局只执行一次）
	useEffect(() => {
		if (isMermaidInitialized) return;
		mermaid.initialize(MERMAID_CONFIG);
		isMermaidInitialized = true;
	}, []);

	// ── 防抖渲染：流式输出时 300ms，渲染完成后 50ms
	useEffect(() => {
		let isMounted = true;
		const debounceTime = isStreaming ? 300 : 50;

		if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current);

		renderTimeoutRef.current = setTimeout(async () => {
			if (!code?.trim() || code === lastRenderedCode) return;

			try {
				const id = `mermaid-${Math.random().toString(36).substring(2, 11)}`;
				const { svg } = await mermaid.render(id, code, getOffscreenContainer());
				if (isMounted) {
					setSvgContent(svg);
					setLastRenderedCode(code);
				}
			} catch {
				// 渲染失败通常是流式输出代码不完整，静默处理，显示源码 fallback
			}
		}, debounceTime);

		return () => {
			isMounted = false;
			if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current);
		};
	}, [code, isStreaming, lastRenderedCode]);

	// ── 清理复制定时器
	useEffect(
		() => () => {
			if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
		},
		[]
	);

	const handleCopy = useCallback(() => {
		navigator.clipboard.writeText(code).then(() => {
			setCopyStatus("copied");
			if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
			copyTimerRef.current = setTimeout(() => setCopyStatus("idle"), 2000);
		});
	}, [code]);

	const openModal = useCallback(() => setIsModalOpen(true), []);
	const closeModal = useCallback(() => setIsModalOpen(false), []);

	// 代码已变更但尚未完成渲染时，视为"脏"状态，显示源码占位
	const isDirty = code !== lastRenderedCode;

	if (isDirty || !svgContent) {
		return <MermaidSourceFallback code={code} isStreaming={isStreaming} />;
	}

	return (
		<>
			<TooltipProvider delayDuration={300}>
				<Tabs
					defaultValue="preview"
					className="gap-y-0 my-4 rounded-lg border border-gray-200 shadow-sm overflow-hidden"
				>
					{/* Tab 标题栏 */}
					<div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border-b border-gray-200">
						<TabsList className="h-7 bg-gray-100 p-0.5 gap-0.5">
							<TabsTrigger
								value="preview"
								className="h-6 px-3 text-xs data-[state=active]:bg-white data-[state=active]:text-gray-800 data-[state=active]:shadow-sm text-gray-500"
							>
								预览
							</TabsTrigger>
							<TabsTrigger
								value="source"
								className="h-6 px-3 text-xs data-[state=active]:bg-white data-[state=active]:text-gray-800 data-[state=active]:shadow-sm text-gray-500"
							>
								源码
							</TabsTrigger>
						</TabsList>

						<MermaidToolbar
							copyStatus={copyStatus}
							onCopy={handleCopy}
							onZoomIn={openModal}
						/>
					</div>

					{/* 图表预览 Tab */}
					<TabsContent
						value="preview"
						className="mt-0 focus-visible:ring-0 focus-visible:outline-none"
					>
						<div className="flex justify-center py-4 overflow-x-auto bg-white">
							<div dangerouslySetInnerHTML={{ __html: svgContent }} />
						</div>
					</TabsContent>

					{/* 源码 Tab */}
					<TabsContent
						value="source"
						className="mt-0 focus-visible:ring-0 focus-visible:outline-none"
					>
						<div className="relative bg-gray-950 rounded-b-lg">
							{/* 悬浮复制按钮 */}
							<div className="absolute top-2 right-2 z-10">
								<CopyButton
									copyStatus={copyStatus}
									onClick={handleCopy}
									variant="source"
								/>
							</div>
							<pre className="my-0! p-4 pt-8 text-sm font-mono text-gray-200 overflow-x-auto whitespace-pre leading-relaxed">
								<code>{code}</code>
							</pre>
						</div>
					</TabsContent>
				</Tabs>
			</TooltipProvider>

			{/* 全屏弹窗 */}
			{isModalOpen && typeof document !== "undefined" && (
				<MermaidModal svgContent={svgContent} onClose={closeModal} />
			)}
		</>
	);
});

export default MermaidBlock;
