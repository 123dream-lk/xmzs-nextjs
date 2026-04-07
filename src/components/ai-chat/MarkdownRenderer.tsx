"use client";
import { memo, useMemo } from "react";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";
import CodeBlock from "./CodeBlock";
import MermaidBlock from "./MermaidBlock";

// ─── 解析器插件（模块级常量，避免重复初始化 remark/rehype 管道）─────────────

// [remarkGfm, options] 须显式断言为元组，否则 TS 推断为联合类型数组，与 Pluggable[] 不兼容
const REMARK_PLUGINS = [
	[remarkGfm, { singleTilde: true }] as [typeof remarkGfm, object],
	remarkMath,
];

/**
 * 在默认 sanitize schema 基础上，追加 KaTeX / MathML 所需的标签和属性白名单。
 *
 * rehype-katex 会生成包含 MathML 标签（math、semantics、mrow 等）及
 * aria-*、style 等属性的 HTML 结构，而 rehype-sanitize 默认 schema
 * （基于 GitHub 白名单）会将它们全部过滤，导致公式渲染失败。
 */
const SANITIZE_SCHEMA = {
	...defaultSchema,
	attributes: {
		...defaultSchema.attributes,
		// 允许所有元素携带 class / style / aria-* / data-* 属性
		"*": [
			...(defaultSchema.attributes?.["*"] ?? []),
			"className",
			"style",
			"aria-hidden",
			"aria-label",
			"aria-labelledby",
		],
	},
	// 追加 MathML 标签白名单
	tagNames: [
		...(defaultSchema.tagNames ?? []),
		"math",
		"annotation",
		"semantics",
		"mtext",
		"mn",
		"mo",
		"mi",
		"mspace",
		"mover",
		"munder",
		"munderover",
		"msup",
		"msub",
		"msubsup",
		"mfrac",
		"mroot",
		"msqrt",
		"mtable",
		"mtr",
		"mtd",
		"mlabeledtr",
		"mrow",
		"menclose",
		"mstyle",
		"mpadded",
		"mphantom",
		"mglyph",
	],
};

// 流结束后才启用 KaTeX 编译，避免流式期间残缺 LaTeX 触发 ParseError 崩溃
const REHYPE_PLUGINS_FULL = [
	rehypeKatex,
	rehypeRaw,
	[rehypeSanitize, SANITIZE_SCHEMA] as [typeof rehypeSanitize, object],
];
const REHYPE_PLUGINS_STREAMING: [] = [];

// ─── code 渲染器 ─────────────────────────────────────────────────────────────

/**
 * 流式输出期间的 Mermaid 源码占位符。
 */
function MermaidPlaceholder({ code }: { code: string }) {
	return (
		<div className="relative my-2">
			<div className="flex items-center px-4 py-1.5 bg-[#282c34] rounded-t-md border-b border-white/10">
				<span className="text-xs text-gray-400 select-none">mermaid</span>
			</div>
			<pre
				className="m-0 p-4 bg-[#282c34] rounded-b-md text-gray-300 text-sm font-mono overflow-x-auto whitespace-pre"
				style={{ margin: 0, borderRadius: "0 0 6px 6px" }}
			>
				<code>{code}</code>
			</pre>
		</div>
	);
}

/**
 * 流式输出期间的轻量代码占位符。
 * 不调用 SyntaxHighlighter（零 Prism 词法分析），仅用 <pre> 展示纯文本，
 * 保持与 CodeBlock 相同的视觉框架（标题栏 + 代码区）。
 */
function CodeBlockPlaceholder({
	language,
	code,
}: {
	language: string;
	code: string;
}) {
	return (
		<div className="relative my-2">
			<div className="flex items-center px-4 py-1.5 bg-[#282c34] rounded-t-md border-b border-white/10">
				<span className="text-xs text-gray-400 select-none">{language}</span>
			</div>
			<pre
				className="m-0 p-4 bg-[#282c34] rounded-b-md text-gray-300 text-sm font-mono overflow-x-auto whitespace-pre"
				style={{ margin: 0, borderRadius: "0 0 6px 6px" }}
			>
				<code>{code}</code>
			</pre>
		</div>
	);
}

/**
 * 根据围栏代码块语言标识，分发到对应渲染器：
 * - 流式输出中：用零开销的占位符，不触发 Prism / mermaid.render
 * - 流结束后：mermaid → MermaidBlock（图表），其他 → CodeBlock（语法高亮）
 * - 无语言标识 → 原生 <code> 行内代码
 */
function createCodeRenderer(isStreaming?: boolean): Components["code"] {
	return function CodeRenderer({
		children,
		className,
		node: _node,
		ref: _ref,
		...rest
	}) {
		const lang = /language-(\w+)/.exec(className ?? "")?.[1];
		const code = String(children).replace(/\n$/, "");

		if (lang === "mermaid") {
			if (isStreaming) return <MermaidPlaceholder code={code} />;
			return <MermaidBlock code={code} isStreaming={false} />;
		}

		if (lang === "math") {
			return (
				<code {...rest} className={`${className} text-pink-500`}>
					{children}
				</code>
			);
		}

		if (lang) {
			if (isStreaming)
				return <CodeBlockPlaceholder language={lang} code={code} />;
			return <CodeBlock language={lang} code={code} />;
		}

		return (
			<code {...rest} className={className}>
				{children}
			</code>
		);
	};
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────

export default memo(function MarkdownRenderer({
	content,
	isStreaming,
}: {
	content: string;
	isStreaming?: boolean;
}) {
	// isStreaming 变化时重建 components，确保 MermaidBlock 收到最新 prop
	const components = useMemo<Components>(
		() => ({ code: createCodeRenderer(isStreaming) }),
		[isStreaming]
	);

	// isStreaming=true 时跳过 rehype-katex，避免残缺公式触发 KaTeX ParseError 崩溃
	const rehypePlugins = isStreaming
		? REHYPE_PLUGINS_STREAMING
		: REHYPE_PLUGINS_FULL;

	return (
		<div className="prose prose-stone prose-base w-full">
			<Markdown
				remarkPlugins={REMARK_PLUGINS}
				rehypePlugins={rehypePlugins}
				components={components}
			>
				{content}
			</Markdown>
		</div>
	);
});
