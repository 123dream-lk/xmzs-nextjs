"use client";
import { locales } from "@dict/index";
import { usePathname, useRouter } from "next/navigation";

export default function SwitchI18n({ lang }: { lang: string }) {
	const pathname = usePathname();
	const router = useRouter();
	const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const newLang = e.target.value;
		const newPath = pathname.replace(`/${lang}`, `/${newLang}`);
		router.replace(newPath);
	};
	return (
		<div>
			<label htmlFor="i18n-switch">🌐 语言:</label>
			<select id="i18n-switch" value={lang} onChange={handleChange}>
				{locales.map((locale) => (
					<option key={locale} value={locale}>
						{locale === "zh"
							? "中文"
							: locale === "en"
							? "English"
							: locale === "ja"
							? "日本語"
							: locale === "ko"
							? "한국어"
							: locale}
					</option>
				))}
			</select>
		</div>
	);
}
