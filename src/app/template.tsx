"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/website/header";
import Footer from "@/components/website/footer";

export default function Template({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const isHome =
		pathname === "/" || /^\/(company|about)(\/.*)?$/.test(pathname);

	// 禁用浏览器自动滚动恢复，避免硬刷新时出现先跳到顶部再跳到底部的闪烁
	useEffect(() => {
		if ("scrollRestoration" in history) {
			history.scrollRestoration = "manual";
		}
	}, []);

	return (
		<>
			{isHome && <Header />}
			{children}
			{isHome && <Footer />}
		</>
	);
}
