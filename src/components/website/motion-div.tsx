"use client";
import { motion, type Variants } from "framer-motion";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

const cards = [
	{
		title: "数字基础设施",
		description: "构建新型数字基础设施底座",
		content:
			"围绕算力、网络、数据三大核心要素，打造安全可靠的数字底座，赋能城市数字化转型。",
		icon: "🏗️",
	},
	{
		title: "大数据平台",
		description: "一体化数据汇聚与治理",
		content:
			"整合多源异构数据，构建统一数据标准体系，实现数据资产的全生命周期管理与价值挖掘。",
		icon: "📊",
	},
	{
		title: "智慧城市应用",
		description: "场景化智慧应用落地",
		content:
			"聚焦政务、民生、产业三大领域，打造一批可复制、可推广的智慧城市标杆应用场景。",
		icon: "🏙️",
	},
	{
		title: "云计算服务",
		description: "弹性安全的云服务能力",
		content:
			"提供 IaaS / PaaS / SaaS 全栈云服务，支撑政企数字化业务稳定高效运行。",
		icon: "☁️",
	},
	{
		title: "网络安全保障",
		description: "全方位安全防护体系",
		content:
			"覆盖边界防护、数据加密、身份认证等全链路安全能力，护航数字业务安全运营。",
		icon: "🔐",
	},
	{
		title: "运营维护服务",
		description: "专业化运维支撑体系",
		content:
			"7×24 小时全天候运维保障，提供驻场服务、远程支持、应急响应等全周期运营服务。",
		icon: "🛠️",
	},
];

const containerVariants = {
	hidden: {},
	visible: {
		transition: {
            // framer-motion 将 visible 状态向下传播给子元素时，每个子元素依次延迟 120ms触发
			staggerChildren: 0.2,
		},
	},
};

const cardVariants: Variants = {
	hidden: { opacity: 0, y: 40 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.5, ease: "easeOut" },
	},
};

export default function MotionDiv() {
	return (
		<section className="w-full max-w-7xl mx-auto px-6 py-16">
			<motion.div
				initial={{ opacity: 0, y: 24 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true, amount: 0.3 }}
				transition={{ duration: 0.5, ease: "easeOut" }}
				className="text-center mb-12"
			>
				<h2 className="text-2xl font-bold text-gray-800 mb-3">核心业务能力</h2>
				<p className="text-gray-500 text-sm max-w-xl mx-auto">
					专注大数据产业发展，提供全方位数字化解决方案
				</p>
			</motion.div>

			<motion.div
				variants={containerVariants}
				initial="hidden"
				whileInView="visible"
				viewport={{ once: true, amount: 0.1 }}
				className="grid grid-cols-1 md:grid-cols-2 nav1110:grid-cols-3 gap-6"
			>
				{cards.map((card) => (
					<motion.div key={card.title} variants={cardVariants}>
						<Card className="h-full hover:shadow-lg transition-shadow duration-300 cursor-pointer">
							<CardHeader>
								<div className="text-3xl mb-1">{card.icon}</div>
								<CardTitle className="text-base text-gray-800">
									{card.title}
								</CardTitle>
								<CardDescription>{card.description}</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-gray-600 leading-relaxed">
									{card.content}
								</p>
							</CardContent>
						</Card>
					</motion.div>
				))}
			</motion.div>
		</section>
	);
}
