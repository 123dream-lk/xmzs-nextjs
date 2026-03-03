"use client";
import { memo } from "react";
import type { UIMessage } from "@ai-sdk/react";
import MarkdownRenderer from "./MarkdownRenderer";

// ─── 单条消息组件：用 memo 包裹，只有该消息自身内容变化时才重渲染 ──────────
// 优化目标：流式输出时只有最后一条 AI 消息在变化，历史消息不应该重渲染
const MessageItem = memo(function MessageItem({
	message,
	isStreaming,
}: {
	message: UIMessage;
	isStreaming?: boolean;
}) {
	return (
		<div
			className={`flex ${
				message.role === "user" ? "justify-end" : "justify-start"
			} animate-in fade-in slide-in-from-bottom-4 duration-500`}
		>
			<div
				className={`flex gap-3 max-w-[80%] ${
					message.role === "user" ? "flex-row-reverse" : "flex-row"
				}`}
			>
				{/* 头像 */}
				<div
					className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${
						message.role === "user"
							? "bg-linear-to-br from-blue-500 to-blue-600"
							: "bg-linear-to-br from-purple-500 to-purple-600"
					}`}
				>
					{message.role === "user" ? "你" : "AI"}
				</div>

				{/* 消息内容 */}
				<div
					className={`flex flex-col ${
						message.role === "user" ? "items-end" : "items-start"
					}`}
				>
					<div
						className={`rounded-2xl px-4 py-3 shadow-sm ${
							message.role === "user"
								? "bg-linear-to-br from-blue-500 to-blue-600 text-white"
								: "bg-white border border-gray-200 text-gray-800"
						}`}
					>
						{message.parts.map((part, index) => {
							switch (part.type) {
								case "text":
									return message.role === "user" ? (
										<div
											key={message.id + index}
											className="whitespace-pre-wrap wrap-break-word"
										>
											{part.text}
										</div>
									) : (
										<div key={message.id + index}>
											<MarkdownRenderer content={part.text} isStreaming={isStreaming} />
										</div>
									);
							}
						})}
					</div>
				</div>
			</div>
		</div>
	);
});

export default MessageItem;
