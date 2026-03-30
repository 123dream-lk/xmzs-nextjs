import { useCallback, useEffect, useState } from "react";
import { EmblaCarouselType } from "embla-carousel";

type UseSelectedSnapDisplayType = {
	selectedSnap: number;
	snapCount: number;
};

export const useSelectedSnapDisplay = (
	emblaApi: EmblaCarouselType | undefined
): UseSelectedSnapDisplayType => {
	const [selectedSnap, setSelectedSnap] = useState(0);
	const [snapCount, setSnapCount] = useState(0);

	const updateScrollSnapState = useCallback((emblaApi: EmblaCarouselType) => {
		setSnapCount(emblaApi.scrollSnapList().length);
		setSelectedSnap(emblaApi.selectedScrollSnap());
	}, []);

	useEffect(() => {
		if (!emblaApi) return;

		const onSelect = () => updateScrollSnapState(emblaApi);
		const onReInit = () => updateScrollSnapState(emblaApi);

		emblaApi.on("select", onSelect);
		emblaApi.on("reInit", onReInit);

		// 初始化时延迟一帧读取状态，避免同步 setState 触发级联渲染
		const rafId = window.requestAnimationFrame(() => {
			updateScrollSnapState(emblaApi);
		});

		return () => {
			cancelAnimationFrame(rafId);
			emblaApi.off("select", onSelect);
			emblaApi.off("reInit", onReInit);
		};
	}, [emblaApi]);

	return {
		selectedSnap,
		snapCount,
	};
};

type PropType = {
	selectedSnap: number;
	snapCount: number;
};

export const SelectedSnapDisplay = (props: PropType) => {
	const { selectedSnap, snapCount } = props;

	return (
		<div className="embla__selected-snap-display">
			{selectedSnap + 1} / {snapCount}
		</div>
	);
};
