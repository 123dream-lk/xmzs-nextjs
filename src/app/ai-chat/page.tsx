"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useChat } from "@ai-sdk/react";
import MessageItem from "@/components/ai-chat/MessageItem";
import { useAutoScroll } from "@/components/ai-chat/useAutoScroll";

// ─── 空状态占位组件 ────────────────────────────────────────────────────────────

function EmptyState() {
	return (
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
			<h2 className="text-xl font-semibold text-gray-700 mb-2">开始对话</h2>
			<p className="text-gray-500">输入您的问题，我会尽力帮助您</p>
		</div>
	);
}

// ─── 页面主组件 ───────────────────────────────────────────────────────────────

export default function AiChatPage() {
	const [input, setInput] = useState("");
	const inputRef = useRef<HTMLTextAreaElement>(null);

	const {
		scrollContainerRef,
		messagesEndRef,
		isUserScrollingRef,
		scrollTimerRef,
		isProgrammaticScrollRef,
		scrollToBottomAfterRender,
	} = useAutoScroll();

	const { messages, sendMessage, stop, status } = useChat({
		onFinish: () => {
			setInput("");
			scrollToBottomAfterRender();
		},
		onError: (error) => {
			console.error("请求出错：", error);
		},
	});

	// submitted = 请求已发出等待首 token；streaming = 正在流式输出
	const isStreaming = status === "submitted" || status === "streaming";

	// 消息更新时，仅在用户未手动滚动的情况下自动跟底
	useEffect(() => {
		if (isUserScrollingRef.current) return;

		isProgrammaticScrollRef.current = true;
		messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
		scrollTimerRef.current = setTimeout(() => {
			isProgrammaticScrollRef.current = false;
		}, 0);

		return () => {
			if (scrollTimerRef.current) {
				clearTimeout(scrollTimerRef.current);
				scrollTimerRef.current = null;
			}
		};
	}, [messages, status]);

	// 流式响应结束后自动聚焦输入框
	useEffect(() => {
		if (!isStreaming) {
			inputRef.current?.focus();
		}
	}, [isStreaming]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				if (input.trim() && !isStreaming) {
					isUserScrollingRef.current = false;
					sendMessage({ text: input });
					setInput("");
				}
			}
		},
		[input, isStreaming, isUserScrollingRef, sendMessage]
	);

	const handleSend = useCallback(() => {
		if (input.trim() && !isStreaming) {
			isUserScrollingRef.current = false;
			sendMessage({ text: input });
			setInput("");
		}
	}, [input, isStreaming, isUserScrollingRef, sendMessage]);

	return (
		<div className="flex flex-col h-screen bg-linear-to-br from-blue-50 via-white to-purple-50">
			{/* 顶部标题栏 */}
			<div className="fixed top-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200">
				<div className="flex gap-4 max-w-4xl mx-auto px-4 py-2">
					<h1 className="text-2xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
						AI 智能助手
					</h1>
					<p className="self-end text-sm text-gray-500 mt-1">
						随时为您解答问题
					</p>
				</div>
			</div>

			{/* 消息列表区域 */}
			<div
				ref={scrollContainerRef}
				className="fixed top-[50px] bottom-[100px] left-0 right-0 z-10 overflow-y-auto px-4 py-4"
			>
				<div className="max-w-4xl mx-auto space-y-4">
					{messages.length === 0 ? (
						<EmptyState />
					) : (
						// memo 包裹的 MessageItem 确保流式输出时历史消息不重渲染，
						// 避免 SyntaxHighlighter 等重型组件不必要地销毁重建
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

			{/* 底部输入区域 */}
			<div className="fixed bottom-0 left-0 right-0 z-10 white/80 backdrop-blur-lg border-t border-gray-200 shadow-[0_-8px_24px_rgba(0,0,0,0.06)]">
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
						{isStreaming ? (
							<Button
								onClick={stop}
								className="h-[60px] px-6 rounded-xl bg-linear-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 transition-all shadow-md hover:shadow-lg"
							>
								<svg
									className="w-5 h-5"
									fill="currentColor"
									viewBox="0 0 24 24"
								>
									<rect x="6" y="6" width="15" height="15" rx="2" />
								</svg>
							</Button>
						) : (
							<Button
								onClick={handleSend}
								disabled={!input.trim() || isStreaming}
								className="h-[60px] px-6 rounded-xl bg-linear-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
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
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
