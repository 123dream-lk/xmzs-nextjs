import { Suspense } from "react";
// 使用了useSearchParams，需要使用client模式渲染，并且要Suspense包裹
export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Suspense fallback={<div>Loading...</div>}>
                {children}
            </Suspense>
        </>
    );
}
