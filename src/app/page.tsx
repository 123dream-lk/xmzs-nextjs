"use client";
import { useContext, useState } from "react";
import { GlobalContext } from "./providers";
import { Button, Popconfirm, Space, Upload, Divider } from "antd";
import Image from "next/image";
import { getMenuApi } from "@/lib/http/modules/portal-official-website";
import { Item } from "@/lib/http/interface";
import { Button as UIButton } from "@/components/ui/button";
// import Header from "@/components/website/header";
// import Footer from "@/components/website/footer";
// import Loading from "./loading";
import MotionDiv from "@/components/website/motion-div";
import EmblaCarouselSwiper from "@/components/website/embla-carousel-swiper/embla-carousel-swiper";
import BackToTop from "@/components/website/back-to-top/back-to-top";
import { toast } from "sonner";
import "./index.scss";
import "./index.less";
import { EmblaOptionsType } from "embla-carousel";
import bg from "@public/website/login-bg.png";
import { UploadOutlined } from "@ant-design/icons";

const OPTIONS: EmblaOptionsType = {
	loop: false,
	align: "center",
	dragFree: false,
};
const SLIDES = [
	{ img: bg },
	{ img: bg },
];
export default function Home() {
	const context = useContext(GlobalContext);
	const [list, setList] = useState<Item[]>([]);

	async function handleBtn() {
		console.log(context);
		// context?.messageApi?.success("Hello World!");
		try {
			const { code, data, msg } = await getMenuApi();
			console.log("Home");
			console.log(code, data, msg);
			setList(data);
		} catch (error) {
			console.error(error);
		} finally {
			console.log("finally");
		}
	}

	function handleUIBtn() {
		toast.success("Hello World!");
	}

	return (
		<div className="flex flex-col min-h-[calc(100vh-128px)]">
			{/* <Header /> */}
			<div className="flex-1 h-0 p-6">
				<Space wrap separator={<Divider vertical />}>
					Space
					<Button type="primary">Button</Button>
					<Upload>
						<Button icon={<UploadOutlined />}>Click to Upload</Button>
					</Upload>
					<Popconfirm
						title="Are you sure delete this task?"
						okText="Yes"
						cancelText="No"
					>
						<Button>Confirm</Button>
					</Popconfirm>
				</Space>
				<div className="flex flex-wrap align-center gap-6 mb-6 mt-6">
					<div className="hover-3d">
						{/* content */}
						<figure className="rounded-2xl">
							<Image
								src="https://img.daisyui.com/images/stock/card-1.webp?x"
								alt="六安市绿水云山大数据产业发展股份有限公司"
								loading="eager"
								width={200}
								height={274}
							/>
						</figure>
						{/* 8 empty divs needed for the 3D effect */}
						<div></div>
						<div></div>
						<div></div>
						<div></div>
						<div></div>
						<div></div>
						<div></div>
						<div></div>
					</div>

					<div className="hover-3d">
						{/* content */}
						<figure className="rounded-2xl">
							<Image
								src="https://img.daisyui.com/images/stock/card-2.webp?x"
								alt="六安市绿水云山大数据产业发展股份有限公司"
								loading="eager"
								width={200}
								height={274}
							/>
						</figure>
						{/* 8 empty divs needed for the 3D effect */}
						<div></div>
						<div></div>
						<div></div>
						<div></div>
						<div></div>
						<div></div>
						<div></div>
						<div></div>
					</div>

					<div className="hover-3d">
						{/* content */}
						<figure className="rounded-2xl">
							<Image
								src="https://img.daisyui.com/images/stock/card-3.webp?x"
								alt="六安市绿水云山大数据产业发展股份有限公司"
								loading="eager"
								width={200}
								height={274}
							/>
						</figure>
						{/* 8 empty divs needed for the 3D effect */}
						<div></div>
						<div></div>
						<div></div>
						<div></div>
						<div></div>
						<div></div>
						<div></div>
						<div></div>
					</div>
				</div>
				<video
					poster={bg.src}
					src="/website/风景.mp4"
					controls
					preload="metadata"
					muted
					loop
					autoPlay
					className="w-full mx-auto h-[360px]"
				></video>
				<EmblaCarouselSwiper slides={SLIDES} options={OPTIONS} />
				<div className="custom-less-color">less</div>
				<div className="custom-color">自定义颜色</div>
				<UIButton onClick={handleUIBtn}>
					Click me
				</UIButton>
				<Button onClick={handleBtn} type="primary">
					按钮
				</Button>
				{list.map((item) => (
					<div key={item.cdId}>
						{item.cdName} - {item.cdPath}
					</div>
				))}
				<MotionDiv />
				<div className="h-[2000px]"></div>
			</div>
		{/* <Footer /> */}
		{/* <Loading /> */}
		<BackToTop />
	</div>
	);
}
