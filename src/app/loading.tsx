export default function Loading() {
	return (
		<div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-white">
			<div className="flex items-end gap-2 h-10">
				<span
					className="size-3 rounded-full bg-[#0066cc] animate-dot-bounce"
					style={{ animationDelay: "0ms" }}
				/>
				<span
					className="size-3 rounded-full bg-[#0066cc] animate-dot-bounce"
					style={{ animationDelay: "160ms" }}
				/>
				<span
					className="size-3 rounded-full bg-[#0066cc] animate-dot-bounce"
					style={{ animationDelay: "320ms" }}
				/>
			</div>
			<p className="text-sm text-gray-400 tracking-widest">加载中...</p>
		</div>
	);
}
