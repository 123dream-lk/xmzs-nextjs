"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useChat } from "@ai-sdk/react";
import MessageItem from "@/components/ai-chat/MessageItem";

export default function HomePage() {
	const [input, setInput] = useState(""); //输入框的值
	const inputRef = useRef<HTMLTextAreaElement>(null); //输入框ref
	const messagesEndRef = useRef<HTMLDivElement>(null); //获取消息结束的ref
	const scrollContainerRef = useRef<HTMLDivElement>(null); //消息列表滚动容器ref
	const isUserScrollingRef = useRef(false); //用户是否正在手动滚动
	// 用于节流 scrollIntoView，避免流式输出时每个 chunk 都触发平滑滚动动画叠加
	const scrollRafRef = useRef<number | null>(null);

	//useChat 内部封装了流式响应 默认会向/api/chat 发送请求
	const { messages, sendMessage, status } = useChat({
		onFinish: () => {
			setInput("");
			// AI回复完成后重置滚动状态，确保下一轮对话自动滚动
			isUserScrollingRef.current = false;
		},
		// 请求发生错误时触发
		onError: (error) => {
			console.error("请求出错：", error);
		},
	});

	// 判断当前滚动位置是否接近底部（阈值100px）
	const isNearBottom = useCallback(() => {
		const container = scrollContainerRef.current;
		if (!container) return true;
		const { scrollTop, scrollHeight, clientHeight } = container;
		console.log("------判断当前滚动位置是否接近底部------");
		console.log(scrollHeight - (scrollTop + clientHeight));
		return Math.abs(scrollHeight - (scrollTop + clientHeight)) < 100;
	}, []);

	// 监听滚动容器的滚动事件，识别用户主动滚动行为
	useEffect(() => {
		const container = scrollContainerRef.current;
		if (!container) return;

		const handleScroll = () => {
			if (isNearBottom()) {
				// 滚动到底部附近，重新启用自动滚动
				isUserScrollingRef.current = false;
			} else {
				// 用户向上滚动，暂停自动滚动
				isUserScrollingRef.current = true;
			}
		};

		// wheel事件：PC端鼠标滚轮向上滚动时立即暂停
		const handleWheel = (e: WheelEvent) => {
			if (e.deltaY < 0) {
				isUserScrollingRef.current = true;
			}
		};

		// touchstart/touchmove：移动端手指触摸滑动识别
		let touchStartY = 0;
		const handleTouchStart = (e: TouchEvent) => {
			touchStartY = e.touches[0].clientY;
		};
		const handleTouchMove = (e: TouchEvent) => {
			const deltaY = e.touches[0].clientY - touchStartY;
			if (deltaY > 0) {
				// 手指向下滑动 = 页面内容向上滚动
				isUserScrollingRef.current = true;
			}
		};

		container.addEventListener("scroll", handleScroll, { passive: true });
		container.addEventListener("wheel", handleWheel, { passive: true });
		container.addEventListener("touchstart", handleTouchStart, {
			passive: true,
		});
		container.addEventListener("touchmove", handleTouchMove, { passive: true });

		return () => {
			container.removeEventListener("scroll", handleScroll);
			container.removeEventListener("wheel", handleWheel);
			container.removeEventListener("touchstart", handleTouchStart);
			container.removeEventListener("touchmove", handleTouchMove);
		};
	}, [isNearBottom]);

	// 消息更新时，仅在用户未手动滚动的情况下自动滚动到底部
	// 使用 requestAnimationFrame 节流：取消上一帧未执行的滚动，合并为单次操作，
	// 防止流式输出高频 chunk 导致多个平滑滚动动画叠加造成卡顿
	useEffect(() => {
		if (!isUserScrollingRef.current) {
			if (scrollRafRef.current !== null) {
				cancelAnimationFrame(scrollRafRef.current);
			}
			scrollRafRef.current = requestAnimationFrame(() => {
				messagesEndRef.current?.scrollIntoView({
					behavior: status === "streaming" ? "auto" : "smooth",
				});
				scrollRafRef.current = null;
			});
		}
		return () => {
			if (scrollRafRef.current !== null) {
				cancelAnimationFrame(scrollRafRef.current);
				scrollRafRef.current = null;
			}
		};
	}, [messages, status]);

	// status: 'awaiting-message' | 'submitted' | 'streaming' | 'error'
	// submitted = 请求已发出等待响应，streaming = 正在流式输出
	const isStreaming = status === "submitted" || status === "streaming";

	// 当流式响应结束（isStreaming 变为 false）时，自动聚焦输入框
	useEffect(() => {
		if (!isStreaming) {
			inputRef.current?.focus();
		}
	}, [isStreaming]);

	// 用 useCallback 稳定函数引用，避免每次渲染创建新函数导致子组件无效重渲染
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				if (input.trim() && !isStreaming) {
					sendMessage({ text: input });
				}
			}
		},
		[input, isStreaming, sendMessage]
	);

	const handleSend = useCallback(() => {
		if (input.trim() && !isStreaming) {
			sendMessage({ text: input });
		}
	}, [input, isStreaming, sendMessage]);

	return (
		<div className="flex flex-col h-screen bg-linear-to-br from-blue-50 via-white to-purple-50">
			{/* 头部标题 */}
			<div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200">
				<div className="flex gap-4 max-w-4xl mx-auto px-4 py-2">
					<h1 className="text-2xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
						AI 智能助手
					</h1>
					<p className="self-end text-sm text-gray-500 mt-1">随时为您解答问题</p>
				</div>
			</div>

			{/* 消息区域 */}
			<div
				ref={scrollContainerRef}
				className="flex-1 overflow-y-auto px-4 py-4"
			>
				<div className="max-w-4xl mx-auto space-y-4">
					{messages.length === 0 ? (
						<div className="flex flex-col items-center justify-center h-full text-center py-20">
							<div className="bg-linear-to-br from-blue-100 to-purple-100 rounded-full p-6 mb-4">
								<svg
									className="w-12 h-12 text-blue-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
									/>
								</svg>
							</div>
							<h2 className="text-xl font-semibold text-gray-700 mb-2">
								开始对话
							</h2>
							<p className="text-gray-500">输入您的问题，我会尽力帮助您</p>
						</div>
					) : (
						// 用 MessageItem（已 memo 包裹）渲染每条消息
						// 流式输出时只有最后一条消息的内容在变化，历史消息的 props 不变，
						// memo 会阻止其重渲染，大幅减少 SyntaxHighlighter 等重型组件的重建
						messages.map((message, index) => (
							<MessageItem 
								key={message.id} 
								message={message} 
								isStreaming={
									status === "streaming" && 
									index === messages.length - 1 && 
									message.role === "assistant"
								}
							/>
						))
					)}
					<div ref={messagesEndRef} />
				</div>
			</div>

			{/* 输入区域 */}
			<div className="bg-white/80 backdrop-blur-lg border-t border-gray-200 shadow-[0_-8px_24px_rgba(0,0,0,0.06)]">
				<div className="max-w-4xl mx-auto px-4 py-4">
					<div className="flex gap-3 items-end">
						<div className="flex-1 relative">
							<Textarea
								ref={inputRef}
								value={input}
								onChange={(e) => setInput(e.target.value)}
								onKeyDown={handleKeyDown}
								disabled={isStreaming}
								placeholder={
									isStreaming
										? "AI 正在回复中..."
										: "请输入你的问题... (按 Enter 发送，Shift + Enter 换行)"
								}
								className="min-h-[60px] max-h-[200px] resize-none rounded-xl border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
							/>
						</div>
						<Button
							onClick={handleSend}
							disabled={!input.trim() || isStreaming}
							className="h-[60px] px-6 rounded-xl bg-linear-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:cursor-not-allowed"
						>
							<svg
								className="w-5 h-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
								/>
							</svg>
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
