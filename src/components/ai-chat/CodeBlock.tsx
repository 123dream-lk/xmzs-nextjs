"use client";
import { useState, useCallback, memo } from "react";
import { Check, Copy } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

// 提升为模块级常量，避免每次渲染创建新对象导致 SyntaxHighlighter 强制重渲染
const CODE_CUSTOM_STYLE = { margin: 0, borderRadius: "0 0 6px 6px" } as const;

// 复制状态类型
type CopyStatus = "idle" | "copied";

const CodeBlock = memo(function CodeBlock({
	language,
	code,
}: {
	language: string;
	code: string;
}) {
	const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");

	const handleCopy = useCallback(async () => {
		await navigator.clipboard.writeText(code);
		setCopyStatus("copied");
		setTimeout(() => setCopyStatus("idle"), 2000);
	}, [code]);

	const isCopied = copyStatus === "copied";

	return (
		<div className="relative group my-2">
			{/* 标题栏：语言标识 + 复制按钮 */}
			<div className="flex items-center justify-between px-4 py-1.5 bg-[#282c34] rounded-t-md border-b border-white/10">
				<span className="text-xs text-gray-400 select-none">{language}</span>
				<button
					type="button"
					onClick={handleCopy}
					aria-label={isCopied ? "已复制" : "复制代码"}
					className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors px-2 py-0.5 rounded hover:bg-white/10 cursor-pointer"
				>
					{isCopied ? (
						<Check className="w-3.5 h-3.5 text-green-400" />
					) : (
						<Copy className="w-3.5 h-3.5" />
					)}
					<span className={isCopied ? "text-green-400" : ""}>
						{isCopied ? "已复制" : "复制"}
					</span>
				</button>
			</div>

			{/* 语法高亮代码区 */}
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
