"use client";
import { memo, useMemo } from "react";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
// import rehypeRaw from "rehype-raw";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css"; // `rehype-katex` does not import the CSS for you
import CodeBlock from "./CodeBlock";
import MermaidBlock from "./MermaidBlock";

// ─── 静态常量：提升到模块级别，避免每次渲染重新分配 ───────────────────────
// rehype/remark 插件数组引用不稳定会导致 react-markdown 重复初始化解析管道
const REHYPE_PLUGINS = [
	// rehypeRaw, 
	rehypeKatex
];

// [remarkGfm, options] 须显式断言为元组，否则 TS 将其推断为联合类型数组
// 导致与 react-markdown 的 Pluggable[] 类型不兼容
const REMARK_PLUGINS = [
	[remarkGfm, { singleTilde: true }] as [typeof remarkGfm, object],
	remarkMath,
];

export default memo(function MarkdownRenderer({
	content,
	isStreaming,
}: {
	content: string;
	isStreaming?: boolean;
}) {
	// ─── Markdown components 配置 ────────────────────────────────
	// 使用 useMemo 缓存 components 对象，仅当 isStreaming 变化时才重新创建
	// 避免每次渲染都重新创建对象导致 react-markdown 销毁所有子组件
	const components = useMemo<Components>(() => ({
		code(props) {
			const {
				children,
				className,
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				node,
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				ref,
				...rest
			} = props;
			const match = /language-(\w+)/.exec(className || "");
			const code = String(children).replace(/\n$/, "");

			if (match && match[1] === "mermaid") {
				// 将流式状态传递给 MermaidBlock
				return <MermaidBlock code={code} isStreaming={isStreaming} />;
			}

			return match ? (
				// 有语言标识 → 使用带复制按钮的代码块
				<CodeBlock language={match[1]} code={code} />
			) : (
				// 无语言标识 → 行内代码
				<code {...rest} className={className}>
					{children}
				</code>
			);
		},
	}), [isStreaming]);

	return (
		<div className="prose prose-stone prose-base max-w-none">
			<Markdown
				rehypePlugins={REHYPE_PLUGINS}
				remarkPlugins={REMARK_PLUGINS}
				components={components}
			>
				{content}
			</Markdown>
		</div>
	);
});
