"use client";
import { memo, useMemo } from "react";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
// import rehypeRaw from "rehype-raw";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";
import CodeBlock from "./CodeBlock";
import MermaidBlock from "./MermaidBlock";

// 提升到模块级，避免引用不稳定导致 react-markdown 重复初始化解析管道
const REHYPE_PLUGINS = [
	// rehypeRaw,
	rehypeKatex,
];

// [remarkGfm, options] 须显式断言为元组，否则 TS 推断为联合类型数组，与 Pluggable[] 不兼容
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
	// useMemo 缓存 components，仅 isStreaming 变化时重建，避免 react-markdown 销毁子组件
	const components = useMemo<Components>(
		() => ({
			code({ children, className, node: _node, ref: _ref, ...rest }) {
				const lang = /language-(\w+)/.exec(className || "")?.[1];
				const code = String(children).replace(/\n$/, "");

				if (lang === "mermaid")
					return <MermaidBlock code={code} isStreaming={isStreaming} />;
				if (lang) return <CodeBlock language={lang} code={code} />;
				return (
					<code {...rest} className={className}>
						{children}
					</code>
				);
			},
		}),
		[isStreaming]
	);

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
