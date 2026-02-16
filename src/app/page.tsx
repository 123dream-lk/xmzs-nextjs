"use client";
import { useContext, useState } from "react";
import { GlobalContext } from "./providers";
import { Button } from "antd";
import { loginApi } from "@/app/lib/http/modules/login";
import { Item } from "@/app/lib/http/interface";
import { Button as UIButton } from "@/components/ui/button"

export default function Home() {
	const context = useContext(GlobalContext);
	const [list, setList] = useState<Item[]>([]);

	async function handleBtn() {
		console.log(context);
		// context?.messageApi?.success("Hello World!");
		try {
			const { code, data, message } = await loginApi({
				pageNum: 1,
				pageSize: 20,
				keyword: "",
			});
			console.log("Home");
			console.log(code, data, message);
			setList(data.list);
		} catch (error) {
			console.error(error);
		} finally {
			console.log("finally");
		}
		// loginApi({name:"xmzs"})
		// loginApi({name:"xmzs"})
	}

	return (
		<div>
			<UIButton>Click me</UIButton>
			<Button onClick={handleBtn} type="primary">
				按钮
			</Button>
			{list.map((item) => (
				<div key={item.id}>{item.title}</div>
			))}
		</div>
	);
}
