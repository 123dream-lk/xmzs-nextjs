import { getDictionary, locales, defaultLocale } from "@dict/index";
import SwitchI18n from "./switchI18n";
export default async function Home({
	params,
}: {
	params: Promise<{ lang: string }>;
}) {
	//获取语言
	const { lang } = await params;
	// 校验语言是否在支持列表中，不支持则回退到默认语言
	// const locale = (locales as readonly string[]).includes(lang)
	// 	? (lang as (typeof locales)[number])
	// 	: defaultLocale;
	//获取字典 lang = zh/en/ja/ko等
	const dictionary = await getDictionary(lang as (typeof locales)[number]);
	//返回页面
	return (
		<div>
			<SwitchI18n lang={lang} /> {/* 语言切换组件并且传入当前语言 */}
			<h1>{dictionary.title}</h1>
			<p>{dictionary.description}</p>
			<p>{dictionary.keywords}</p>
		</div>
	);
}
