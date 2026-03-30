"use client";
import { useState, useCallback, memo } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

// 提升为常量，避免每次渲染创建新对象导致 SyntaxHighlighter 强制重渲染
const CODE_CUSTOM_STYLE = { margin: 0, borderRadius: "0 0 6px 6px" } as const;

const IconCheck = () => (
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
);

const IconCopy = () => (
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
);

const CodeBlock = memo(function CodeBlock({
	language,
	code,
}: {
	language: string;
	code: string;
}) {
	const [copied, setCopied] = useState(false);

	const handleCopy = useCallback(async () => {
		await navigator.clipboard.writeText(code);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [code]);

	return (
		<div className="relative group my-2">
			<div className="flex items-center justify-between px-4 py-1.5 bg-[#282c34] rounded-t-md border-b border-white/10">
				<span className="text-xs text-gray-400 select-none">{language}</span>
				<button
					onClick={handleCopy}
					className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors px-2 py-0.5 rounded hover:bg-white/10 cursor-pointer"
				>
					{copied ? <IconCheck /> : <IconCopy />}
					<span className={copied ? "text-green-400" : ""}>
						{copied ? "已复制" : "复制"}
					</span>
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
