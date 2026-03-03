"use client";

import { useEffect, useState, useRef, memo } from "react";
import mermaid from "mermaid";

// 确保仅初始化一次，避免重复调用
let isInitialized = false;

// 使用 memo 包装组件，避免不必要的重渲染
const MermaidBlock = memo(function MermaidBlock({
	code,
	isStreaming,
}: {
	code: string;
	isStreaming?: boolean;
}) {
	const [svgContent, setSvgContent] = useState<string>("");
	// 记录上一次成功渲染的代码，用于判断是否是“脏”状态（代码已更新但未渲染）
	const [lastRenderedCode, setLastRenderedCode] = useState<string>("");
	const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// 如果代码发生了变化，但还没有渲染成功，说明处于“脏”状态
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
				const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
				const { svg } = await mermaid.render(id, code);
				
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
		<div 
			className="mermaid-diagram flex justify-center py-4 overflow-x-auto bg-white rounded-lg border border-gray-100 shadow-sm my-4"
			dangerouslySetInnerHTML={{ __html: svgContent }}
		/>
	);
});

export default MermaidBlock;
