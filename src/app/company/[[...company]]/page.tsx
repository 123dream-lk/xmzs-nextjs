"use client";
import { useParams, useSearchParams } from "next/navigation";
export default function Company1Page() {
	const params = useParams();
	console.log("动态路由参数：", params);
	// 拿到？后面的参数
	const searchParams = useSearchParams();
	console.log("?id后面的参数：", searchParams.getAll("id"));
	return (
		<div className="flex flex-col min-h-[calc(100vh-128px)]">
			<h1>动态路由参数：{params.company}</h1>
			<h1>?id后面的参数：{searchParams.getAll("id")}</h1>
		</div>
	);
}
