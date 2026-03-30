import { ComponentPropsWithRef, useCallback, useEffect, useState } from "react";
import { EmblaCarouselType } from "embla-carousel";

type UseDotButtonType = {
	selectedIndex: number;
	scrollSnaps: number[];
	onDotButtonClick: (index: number) => void;
};

export const useDotButton = (
	emblaApi: EmblaCarouselType | undefined
): UseDotButtonType => {
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

	const onDotButtonClick = useCallback(
		(index: number) => {
			if (!emblaApi) return;
			emblaApi.scrollTo(index);
		},
		[emblaApi]
	);

	const onInit = useCallback((emblaApi: EmblaCarouselType) => {
		setScrollSnaps(emblaApi.scrollSnapList());
	}, []);

	const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
		setSelectedIndex(emblaApi.selectedScrollSnap());
	}, []);

	useEffect(() => {
		if (!emblaApi) return;

		const handleReInit = () => {
			onInit(emblaApi);
			onSelect(emblaApi);
		};
		const handleSelect = () => onSelect(emblaApi);

		emblaApi.on("reInit", handleReInit).on("select", handleSelect);

		// 初始化时延迟一帧读取状态，避免同步 setState 触发级联渲染
		const rafId = window.requestAnimationFrame(() => {
			onInit(emblaApi);
			onSelect(emblaApi);
		});

		return () => {
			cancelAnimationFrame(rafId);
			emblaApi.off("reInit", handleReInit).off("select", handleSelect);
		};
	}, [emblaApi]);

	return {
		selectedIndex,
		scrollSnaps,
		onDotButtonClick,
	};
};

type PropType = ComponentPropsWithRef<"button">;

export const DotButton = (props: PropType) => {
	const { children, ...restProps } = props;

	return (
		<button type="button" {...restProps}>
			{children}
		</button>
	);
};
