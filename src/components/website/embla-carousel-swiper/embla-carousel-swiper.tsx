// import useEmblaCarousel from "embla-carousel-react";
// import Autoplay from "embla-carousel-autoplay";
// import { useEffect } from "react";
// import "./embla.css";
// export default function EmblaCarousel() {
// 	const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false }, [Autoplay()]);

// 	useEffect(() => {
// 		if (!emblaApi) return;
// 		emblaApi.plugins().autoplay?.play();
// 	}, [emblaApi]);

// 	const goToPrev = () => emblaApi?.scrollPrev();
// 	const goToNext = () => emblaApi?.scrollNext();

// 	return (
// 		<div className="embla">
// 			<div className="embla__viewport overflow-hidden" ref={emblaRef}>
// 				<div className="embla__container flex touch-pan-y touch-pinch-zoom">
// 					<div className="embla__slide flex-[0_0_100%] min-w-0">Slide 1</div>
// 					<div className="embla__slide flex-[0_0_100%] min-w-0">Slide 2</div>
// 					<div className="embla__slide flex-[0_0_100%] min-w-0">Slide 3</div>
// 				</div>
// 			</div>

// 			<button className="embla__prev" onClick={goToPrev}>
// 				Scroll to prev
// 			</button>
// 			<button className="embla__next" onClick={goToNext}>
// 				Scroll to next
// 			</button>
// 		</div>
// 	);
// }

import { useRef } from "react";
import { EmblaOptionsType } from "embla-carousel";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useAutoplay } from "./EmblaCarouselAutoplay";
import { useAutoplayProgress } from "./EmblaCarouselAutoplayProgress";
import {
	SelectedSnapDisplay,
	useSelectedSnapDisplay,
} from "./EmblaCarouselSelectedSnapDisplay";
import { DotButton, useDotButton } from "./EmblaCarouselDotButton";
import {
	NextButton,
	PrevButton,
	usePrevNextButtons,
} from "./EmblaCarouselArrowButtons";
import "./embla.scss";
import Image from "next/image";
import type { StaticImageData } from "next/image";

type SlideItem = {
	img: StaticImageData | string;
};

type PropType = {
	slides: SlideItem[];
	options?: EmblaOptionsType;
};

const EmblaCarousel = (props: PropType) => {
	const { slides, options } = props;
	const progressNode = useRef<HTMLDivElement>(null);
	const [emblaRef, emblaApi] = useEmblaCarousel(options, [
		Autoplay({ delay: 6000, playOnInit: true, stopOnInteraction: false }),
	]);
	const { selectedSnap, snapCount } = useSelectedSnapDisplay(emblaApi);
	const {
		prevBtnDisabled,
		nextBtnDisabled,
		onPrevButtonClick,
		onNextButtonClick,
	} = usePrevNextButtons(emblaApi);

	const { selectedIndex, scrollSnaps, onDotButtonClick } =
		useDotButton(emblaApi);

	const { autoplayIsPlaying, toggleAutoplay, onAutoplayButtonClick } =
		useAutoplay(emblaApi);

	const { showAutoplayProgress } = useAutoplayProgress(emblaApi, progressNode);

	return (
		<div className="embla">
			<div className="embla__viewport" ref={emblaRef}>
				<div className="embla__container">
					{slides.map((slide, index) => (
						<div className="embla__slide" key={index}>
							<div className="embla__slide__number">
								{/* <span>{index + 1}</span> */}
								<Image
									src={slide.img}
									alt="六安市绿水云山大数据产业发展股份有限公司"
									loading="eager"
									style={{ width: "100%", height: "100%", objectFit: "cover" }}
								/>
							</div>
						</div>
					))}
				</div>
			</div>

			<div className="embla__controls">
				<div className="embla__buttons">
					<PrevButton
						onClick={() => onAutoplayButtonClick(onPrevButtonClick)}
						disabled={prevBtnDisabled}
					/>
					<NextButton
						onClick={() => onAutoplayButtonClick(onNextButtonClick)}
						disabled={nextBtnDisabled}
					/>
				</div>

				<div
					className={`embla__progress`.concat(
						showAutoplayProgress ? "" : " embla__progress--hidden"
					)}
				>
					<div className="embla__progress__bar" ref={progressNode} />
				</div>

				<button className="embla__play" onClick={toggleAutoplay} type="button">
					{autoplayIsPlaying ? "Stop" : "Start"}
				</button>
			</div>
			<div className="embla__controls2">
				<div className="self-center">
					<SelectedSnapDisplay
						selectedSnap={selectedSnap}
						snapCount={snapCount}
					/>
				</div>
				<div className="embla__dots">
					{scrollSnaps.map((_, index) => (
						<DotButton
							key={index}
							onClick={() =>
								onAutoplayButtonClick(() => onDotButtonClick(index))
							}
							className={"embla__dot".concat(
								index === selectedIndex ? " embla__dot--selected" : ""
							)}
						/>
					))}
				</div>
			</div>
		</div>
	);
};

export default EmblaCarousel;
