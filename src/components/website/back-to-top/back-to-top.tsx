"use client";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowUp } from "lucide-react";

export default function BackToTop() {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		let rafId: number;

		const handleScroll = () => {
			cancelAnimationFrame(rafId);
			rafId = requestAnimationFrame(() => {
				setVisible(window.scrollY > 300);
			});
		};

		// 挂载时同步一次，防止刷新后位置已超阈值却不显示
		handleScroll();

		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => {
			cancelAnimationFrame(rafId);
			window.removeEventListener("scroll", handleScroll);
		};
	}, []);

	const scrollToTop = useCallback(() => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	}, []);

	if (!visible) return null;

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					onClick={scrollToTop}
					size="icon-lg"
					className="fixed bottom-8 right-8 z-100 rounded-full shadow-lg"
					aria-label="回到顶部"
				>
					<ArrowUp className="size-5" />
				</Button>
			</TooltipTrigger>
			<TooltipContent side="left" align="center" alignOffset={0} sideOffset={0}>
				回到顶部
			</TooltipContent>
		</Tooltip>
	);
}
