import { useEffect, useRef, useState } from "react";
import { EmblaCarouselType } from "embla-carousel";

type UseAutoplayProgressType = {
	showAutoplayProgress: boolean;
};

export const useAutoplayProgress = <ProgressElement extends HTMLElement | null>(
	emblaApi: EmblaCarouselType | undefined,
	progressNode: React.RefObject<ProgressElement | null>
): UseAutoplayProgressType => {
	const [showAutoplayProgress, setShowAutoplayProgress] = useState(false);
	const animationName = useRef("");
	const timeoutId = useRef(0);
	const rafId = useRef(0);
	// 用内部 ref 持有外部节点，避免直接操作 hook 参数触发 immutability 规则
	const nodeRef = useRef<ProgressElement | null>(null);

	// 挂载时同步节点引用，卸载时清理动画相关计时器
	useEffect(() => {
		nodeRef.current = progressNode.current;
		return () => {
			cancelAnimationFrame(rafId.current);
			clearTimeout(timeoutId.current);
		};
	}, []);

	useEffect(() => {
		const autoplay = emblaApi?.plugins()?.autoplay;
		if (!autoplay) return;

		const startProgress = (timeUntilNext: number | null) => {
			const node = nodeRef.current;
			if (!node || timeUntilNext === null) return;

			if (!animationName.current) {
				animationName.current = window.getComputedStyle(node).animationName;
			}

			node.style.animationName = "none";
			node.style.transform = "translate3d(0,0,0)";

			rafId.current = window.requestAnimationFrame(() => {
				timeoutId.current = window.setTimeout(() => {
					node.style.animationName = animationName.current;
					node.style.animationDuration = `${timeUntilNext}ms`;
				}, 0);
			});

			setShowAutoplayProgress(true);
		};

		const onTimerSet = () => startProgress(autoplay.timeUntilNext());
		const onTimerStopped = () => setShowAutoplayProgress(false);

		emblaApi
			.on("autoplay:timerset", onTimerSet)
			.on("autoplay:timerstopped", onTimerStopped);

		// 初始化时若自动播放已在运行，延迟一帧触发进度条（避免错过 playOnInit 的首次 timerset 事件）
		const initRafId = window.requestAnimationFrame(() => {
			if (autoplay.isPlaying()) startProgress(autoplay.timeUntilNext());
		});

		return () => {
			cancelAnimationFrame(initRafId);
			emblaApi
				.off("autoplay:timerset", onTimerSet)
				.off("autoplay:timerstopped", onTimerStopped);
		};
	}, [emblaApi]);



	return {
		showAutoplayProgress,
	};
};
