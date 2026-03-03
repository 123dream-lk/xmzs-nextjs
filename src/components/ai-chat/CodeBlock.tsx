"use client";
import { useState, memo } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

// SyntaxHighlighter customStyle 提升为常量，避免每次渲染创建新对象引用
// 对象引用变化会导致 SyntaxHighlighter 跳过 shallowEqual 比较强制重渲染
const CODE_CUSTOM_STYLE = { margin: 0, borderRadius: "0 0 6px 6px" } as const;

// 带一键复制功能的代码块组件
const CodeBlock = memo(function CodeBlock({
	language,
	code,
}: {
	language: string;
	code: string;
}) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		await navigator.clipboard.writeText(code);
		setCopied(true);
		// 2秒后恢复"复制"状态
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="relative group my-2">
			{/* 语言标签 + 复制按钮 */}
			<div className="flex items-center justify-between px-4 py-1.5 bg-[#282c34] rounded-t-md border-b border-white/10">
				<span className="text-xs text-gray-400 select-none">{language}</span>
				<button
					onClick={handleCopy}
					className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors px-2 py-0.5 rounded hover:bg-white/10 cursor-pointer"
				>
					{copied ? (
						<>
							{/* 对勾图标 */}
							<svg
								className="w-3.5 h-3.5 text-green-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M5 13l4 4L19 7"
								/>
							</svg>
							<span className="text-green-400">已复制</span>
						</>
					) : (
						<>
							{/* 复制图标 */}
							<svg
								className="w-3.5 h-3.5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
								/>
							</svg>
							<span>复制</span>
						</>
					)}
				</button>
			</div>
			<SyntaxHighlighter
				PreTag="div"
				language={language}
				style={oneDark}
				customStyle={CODE_CUSTOM_STYLE}
			>
				{code}
			</SyntaxHighlighter>
		</div>
	);
});

export default CodeBlock;
