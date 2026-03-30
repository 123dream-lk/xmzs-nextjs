import { useCallback, useEffect, useState } from "react";
import { EmblaCarouselType } from "embla-carousel";

type UseAutoplayType = {
	autoplayIsPlaying: boolean;
	toggleAutoplay: () => void;
	onAutoplayButtonClick: (callback: () => void) => void;
};

export const useAutoplay = (
	emblaApi: EmblaCarouselType | undefined
): UseAutoplayType => {
	const [autoplayIsPlaying, setAutoplayIsPlaying] = useState(false);

	const onAutoplayButtonClick = useCallback(
		(callback: () => void) => {
			const autoplay = emblaApi?.plugins()?.autoplay;
			if (!autoplay) return;

			autoplay.stop();
			callback();
			// 编程式操作后手动重启，确保 timerset 事件触发以重置进度条
			autoplay.play();
		},
		[emblaApi]
	);

	const toggleAutoplay = useCallback(() => {
		const autoplay = emblaApi?.plugins()?.autoplay;
		if (!autoplay) return;

		// 直接调用避免 this 上下文丢失
		if (autoplay.isPlaying()) {
			autoplay.stop();
		} else {
			autoplay.play();
		}
	}, [emblaApi]);

	useEffect(() => {
		const autoplay = emblaApi?.plugins()?.autoplay;
		if (!autoplay) return;

		const onPlay = () => setAutoplayIsPlaying(true);
		const onStop = () => setAutoplayIsPlaying(false);
		const onReInit = () => setAutoplayIsPlaying(autoplay.isPlaying());

		emblaApi
			.on("autoplay:play", onPlay)
			.on("autoplay:stop", onStop)
			.on("reInit", onReInit);

		// 通过触发内部状态读取初始化，避免同步 setState
		onReInit();

		return () => {
			emblaApi
				.off("autoplay:play", onPlay)
				.off("autoplay:stop", onStop)
				.off("reInit", onReInit);
		};
	}, [emblaApi]);

	return {
		autoplayIsPlaying,
		toggleAutoplay,
		onAutoplayButtonClick,
	};
};
