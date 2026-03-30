"use client";
import { memo } from "react";
import type { UIMessage } from "@ai-sdk/react";
import MarkdownRenderer from "./MarkdownRenderer";

// 流式输出时只有最后一条 AI 消息在变化，memo 确保历史消息不重渲染
const MessageItem = memo(function MessageItem({
	message,
	isStreaming,
}: {
	message: UIMessage;
	isStreaming?: boolean;
}) {
	const isUser = message.role === "user";

	return (
		<div
			className={`flex ${
				isUser ? "justify-end" : "justify-start"
			} animate-in fade-in slide-in-from-bottom-4 duration-500`}
		>
			<div
				className={`flex gap-3 max-w-[80%] ${
					isUser ? "flex-row-reverse" : "flex-row"
				}`}
			>
				{/* 头像 */}
				<div
					className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${
						isUser
							? "bg-linear-to-br from-blue-500 to-blue-600"
							: "bg-linear-to-br from-purple-500 to-purple-600"
					}`}
				>
					{isUser ? "你" : "AI"}
				</div>

				{/* 消息内容 */}
				<div
					className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
				>
					<div
						className={`rounded-2xl px-4 py-3 shadow-sm ${
							isUser
								? "bg-linear-to-br from-blue-500 to-blue-600 text-white"
								: "bg-white border border-gray-200 text-gray-800"
						}`}
					>
						{message.parts.map((part, index) => {
							if (part.type !== "text") return null;
							const key = message.id + index;
							return isUser ? (
								<div key={key} className="whitespace-pre-wrap wrap-break-word">
									{part.text}
								</div>
							) : (
								<div key={key}>
									<MarkdownRenderer
										content={part.text}
										isStreaming={isStreaming}
									/>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
});

export default MessageItem;
