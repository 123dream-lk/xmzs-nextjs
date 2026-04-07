"use client";
import { memo, useState, useCallback } from "react";
import type { UIMessage } from "@ai-sdk/react";
import { Copy, Check } from "lucide-react";
import MarkdownRenderer from "./MarkdownRenderer";

// ─── 类型定义 ──────────────────────────────────────────────────────────────────

interface MessageItemProps {
	message: UIMessage;
	/** 当前消息是否正在流式输出（仅最后一条 AI 消息为 true） */
	isStreaming?: boolean;
}

// ─── 头像 ─────────────────────────────────────────────────────────────────────

function MessageAvatar({ isUser }: { isUser: boolean }) {
	return (
		<div
			className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
				isUser
					? "bg-linear-to-br from-blue-500 to-blue-600"
					: "bg-linear-to-br from-purple-500 to-purple-600"
			}`}
		>
			{isUser ? "你" : "AI"}
		</div>
	);
}

// ─── 复制按钮 ─────────────────────────────────────────────────────────────────

function CopyButton({ text, isUser }: { text: string; isUser: boolean }) {
	const [copied, setCopied] = useState(false);

	const handleCopy = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// 兼容不支持 clipboard API 的环境
			const el = document.createElement("textarea");
			el.value = text;
			el.style.position = "fixed";
			el.style.opacity = "0";
			document.body.appendChild(el);
			el.select();
			document.execCommand("copy");
			document.body.removeChild(el);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	}, [text]);

	return (
		<button
			onClick={handleCopy}
			title={copied ? "已复制" : "复制内容"}
			className={`mt-1 p-1 rounded-md transition-all duration-200 cursor-pointer ${
				isUser
					? "text-blue-500 hover:text-white hover:bg-blue-500/60"
					: "text-gray-600 hover:text-white hover:bg-gray-600/60"
			}`}
		>
			{copied ? (
				<Check className="w-3.5 h-3.5" />
			) : (
				<Copy className="w-3.5 h-3.5" />
			)}
		</button>
	);
}

// ─── 消息气泡 ─────────────────────────────────────────────────────────────────

function MessageBubble({
	message,
	isUser,
	isStreaming,
}: {
	message: UIMessage;
	isUser: boolean;
	isStreaming?: boolean;
}) {
	return (
		<div
			className={`rounded-2xl px-4 py-3 shadow-sm ${
				isUser
					? "bg-linear-to-br from-blue-500 to-blue-600 text-white"
					: "bg-white border border-gray-200 text-gray-800"
			}`}
		>
			{message.parts.map((part, index) => {
				if (part.type !== "text") return null;
				const key = `${message.id}-${index}`;

				return isUser ? (
					// 用户消息：保留换行，不做 Markdown 解析
					<p key={key} className="whitespace-pre-wrap wrap-break-word m-0">
						{part.text}
					</p>
				) : (
					// AI 消息：渲染 Markdown（含代码高亮、Mermaid、LaTeX）
					<MarkdownRenderer
						key={key}
						content={part.text}
						isStreaming={isStreaming}
					/>
				);
			})}
		</div>
	);
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────

// 流式输出时只有最后一条 AI 消息在变化，memo 确保历史消息不触发重渲染，
// 避免 SyntaxHighlighter 等重型组件不必要地销毁重建
const MessageItem = memo(function MessageItem({
	message,
	isStreaming,
}: MessageItemProps) {
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
				<MessageAvatar isUser={isUser} />
				<div
					className={`flex flex-col min-w-0 w-full overflow-auto ${
						isUser ? "items-end" : "items-start"
					}`}
				>
					<MessageBubble
						message={message}
						isUser={isUser}
						isStreaming={isStreaming}
					/>
					{!isStreaming && (
						<CopyButton
							text={message.parts
								.filter((p) => p.type === "text")
								.map((p) => p.text)
								.join("\n")}
							isUser={isUser}
						/>
					)}
				</div>
			</div>
		</div>
	);
});

export default MessageItem;
