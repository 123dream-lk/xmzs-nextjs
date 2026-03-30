"use client";

import { useEffect, useState, useRef, memo, useCallback } from "react";
import { createPortal } from "react-dom";
import mermaid from "mermaid";

// 确保仅初始化一次，避免重复调用
let isInitialized = false;

// 全局离屏渲染容器，避免 mermaid.render 把临时节点插入 body 导致滚动条闪烁
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

// 使用 memo 包装组件，避免不必要的重渲染
const MermaidBlock = memo(function MermaidBlock({
	code,
	isStreaming,
}: {
	code: string;
	isStreaming?: boolean;
}) {
	const [svgContent, setSvgContent] = useState<string>("");
	// 记录上一次成功渲染的代码，用于判断是否是"脏"状态（代码已更新但未渲染）
	const [lastRenderedCode, setLastRenderedCode] = useState<string>("");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const renderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// 缩放 & 平移状态
	const [scale, setScale] = useState(1);
	const [translate, setTranslate] = useState({ x: 0, y: 0 });
	const [isDragging, setIsDragging] = useState(false);
	const isDraggingRef = useRef(false);
	const dragStartRef = useRef({ x: 0, y: 0 });
	const translateRef = useRef({ x: 0, y: 0 });
	const canvasRef = useRef<HTMLDivElement>(null);

	const openModal = useCallback(() => {
		setScale(1);
		setTranslate({ x: 0, y: 0 });
		translateRef.current = { x: 0, y: 0 };
		setIsModalOpen(true);
	}, []);
	const closeModal = useCallback(() => setIsModalOpen(false), []);

	// 按 Esc 关闭弹窗
	useEffect(() => {
		if (!isModalOpen) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") closeModal();
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isModalOpen, closeModal]);

	// 滚轮缩放 —— 用原生事件绑定（passive: false）才能调用 preventDefault()
	// React 合成事件的 onWheel 在现代浏览器中默认是 passive 的，无法阻止默认行为
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas || !isModalOpen) return;
		const handleWheel = (e: WheelEvent) => {
			e.preventDefault();
			e.stopPropagation();
			const ZOOM_SPEED = 0.001;
			const MIN_SCALE = 0.2;
			const MAX_SCALE = 10;
			setScale((prev) => {
				const delta = -e.deltaY * ZOOM_SPEED;
				return Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev * (1 + delta)));
			});
		};
		canvas.addEventListener("wheel", handleWheel, { passive: false });
		return () => canvas.removeEventListener("wheel", handleWheel);
	}, [isModalOpen]);

	// 拖拽平移
	const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
		if (e.button !== 0) return;
		isDraggingRef.current = true;
		setIsDragging(true);
		dragStartRef.current = { x: e.clientX - translateRef.current.x, y: e.clientY - translateRef.current.y };
		e.currentTarget.style.cursor = "grabbing";
	}, []);

	const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
		if (!isDraggingRef.current) return;
		const newX = e.clientX - dragStartRef.current.x;
		const newY = e.clientY - dragStartRef.current.y;
		translateRef.current = { x: newX, y: newY };
		setTranslate({ x: newX, y: newY });
	}, []);

	const handleMouseUp = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
		isDraggingRef.current = false;
		setIsDragging(false);
		e.currentTarget.style.cursor = "grab";
	}, []);

	// 双击重置缩放和位置
	const handleDoubleClick = useCallback(() => {
		setScale(1);
		setTranslate({ x: 0, y: 0 });
		translateRef.current = { x: 0, y: 0 };
	}, []);

	// 如果代码发生了变化，但还没有渲染成功，说明处于"脏"状态
	// 在这种状态下，我们应该显示源码，而不是旧的 SVG
	const isDirty = code !== lastRenderedCode;

	useEffect(() => {
		if (!isInitialized) {
			mermaid.initialize({
				startOnLoad: false,
				theme: "base",
				securityLevel: "loose",
				themeVariables: {
					fontFamily: 'ui-sans-serif, system-ui, sans-serif',
					fontSize: '14px',
					
					// 主节点样式 (蓝/靛色系)
					primaryColor: '#eef2ff',      // indigo-50
					primaryTextColor: '#312e81',  // indigo-900
					primaryBorderColor: '#6366f1',// indigo-500
					
					// 线条颜色
					lineColor: '#64748b',         // slate-500
					
					// 次要节点 (紫/粉色系)
					secondaryColor: '#faf5ff',    // purple-50
					secondaryTextColor: '#581c87', // purple-900
					secondaryBorderColor: '#a855f7', // purple-500
					
					// 第三级节点 (灰/Slate系)
					tertiaryColor: '#f8fafc',     // slate-50
					tertiaryBorderColor: '#94a3b8', // slate-400
					
					// 备注颜色 (Amber系)
					noteBkgColor: '#fffbeb',      // amber-50
					noteTextColor: '#92400e',     // amber-800
					noteBorderColor: '#f59e0b',   // amber-500
				},
				flowchart: {
					curve: 'basis', // 更圆滑的连接线
					htmlLabels: true,
				}
			});
			isInitialized = true;
		}
	}, []);

	useEffect(() => {
		let isMounted = true;
		
		// 清除之前的定时器，防抖
		if (renderTimeoutRef.current) {
			clearTimeout(renderTimeoutRef.current);
		}

		// 延迟执行渲染
		// 如果正在流式输出，给更长的防抖时间，避免频繁尝试渲染导致性能问题
		// 如果不是流式输出（已经结束），可以立即或短延时渲染
		const debounceTime = isStreaming ? 300 : 50;

		renderTimeoutRef.current = setTimeout(async () => {
			if (!code || typeof code !== "string" || !code.trim()) {
				return;
			}

			// 如果代码没有变化（已经渲染过），则跳过
			if (code === lastRenderedCode) {
				return;
			}

			try {
				const id = `mermaid-${Math.random().toString(36).substring(2, 11)}`;
				const { svg } = await mermaid.render(id, code, getOffscreenContainer());
				
				if (isMounted) {
					setSvgContent(svg);
					setLastRenderedCode(code); // 标记当前 code 已成功渲染
				}
			} catch (err) {
				// 渲染失败通常是因为代码不完整（流式输出中）
				// 这种情况下不输出错误日志，避免控制台刷屏，只是保持显示源码
				if (isMounted) {
					// 渲染失败时，不更新 lastRenderedCode，保持 isDirty 为 true
					// 也不清空 svgContent，防止闪烁？不，应该清空，因为旧的 SVG 可能不匹配
					// 但如果是流式输出中，我们希望显示源码，所以 isDirty 为 true 已经足够控制显示源码了
				}
			}
		}, debounceTime); 

		return () => {
			isMounted = false;
			if (renderTimeoutRef.current) {
				clearTimeout(renderTimeoutRef.current);
			}
		};
	}, [code, isStreaming, lastRenderedCode]);

	// 显示逻辑：
	// 1. 如果正在流式输出且代码已变更（isDirty），显示源码（带 Generating...）
	// 2. 如果 SVG 内容为空（渲染失败或初始状态），显示源码
	// 3. 其他情况（渲染成功且代码未变更），显示 SVG
	if (isDirty || !svgContent) {
		return (
			<div className="my-4 bg-gray-50 rounded-md border border-gray-200 overflow-hidden">
				<div className="flex items-center justify-between px-3 py-1 bg-gray-100 border-b border-gray-200 text-xs text-gray-500">
					<span>Mermaid</span>
					{isStreaming ? <span>Generating...</span> : <span>Source</span>}
				</div>
				<pre className="p-3 text-sm font-mono overflow-auto whitespace-pre">
					{code}
				</pre>
			</div>
		);
	}

	return (
		<>
			{/* 图表预览区 */}
			<div className="relative group mermaid-diagram flex justify-center py-4 overflow-x-auto bg-white rounded-lg border border-gray-100 shadow-sm my-4">
				{/* 放大查看按钮 */}
				<button
					onClick={openModal}
					title="放大查看"
					className="absolute top-2 right-2 z-10 p-1.5 rounded-md bg-white/80 border border-gray-200 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-gray-700 hover:bg-white hover:border-gray-300 transition-all shadow-sm"
				>
					<svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
						<path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
					</svg>
				</button>
				<div dangerouslySetInnerHTML={{ __html: svgContent }} />
			</div>

			{/* 全屏弹窗 Modal */}
			{isModalOpen && typeof document !== "undefined" && createPortal(
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
					onClick={closeModal}
				>
					<div
						className="relative bg-white rounded-xl shadow-2xl"
						style={{ width: "90vw", height: "90vh" }}
						onClick={(e) => e.stopPropagation()}
					>
						{/* 关闭按钮 */}
						<button
							onClick={closeModal}
							title="关闭"
							className="absolute top-3 right-3 z-20 p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
						>
							<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
						{/* 提示文字 */}
						<div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 text-xs text-gray-400 select-none pointer-events-none">
							滚轮缩放 · 拖拽移动 · 双击空白区域重置
						</div>
						{/* 缩放/平移画布 */}
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
								className="mermaid-diagram-modal w-full h-full flex items-center justify-center"
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
			)}
		</>
	);
});

export default MermaidBlock;
