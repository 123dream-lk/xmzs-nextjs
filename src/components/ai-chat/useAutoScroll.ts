"use client";
import { useRef, useCallback, useEffect } from "react";

interface UseAutoScrollOptions {
    /** 距底部多少 px 以内算"接近底部" */
    threshold?: number;
    /** onFinish 时调用，用于流结束后等待异步内容渲染完再滚底 */
    onFinish?: () => void;
}

/**
 * 管理消息列表的自动滚动行为：
 * - 流式输出时实时跟底；
 * - 用户向上滚动后暂停自动跟底；
 * - 流结束后用 ResizeObserver 等待异步内容（Mermaid / 代码高亮）
 *   渲染完毕，再补一次滚底。
 */
export function useAutoScroll({ threshold = 60 }: UseAutoScrollOptions = {}) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 用户是否正在手动向上滚动
    const isUserScrollingRef = useRef(false);
    // 正在执行程序性滚动时置 true，屏蔽 scroll 事件对 isUserScrollingRef 的误修改
    const isProgrammaticScrollRef = useRef(false);

    // ResizeObserver：等待流结束后异步内容渲染完毕再滚底
    const postStreamObserverRef = useRef<ResizeObserver | null>(null);
    // 高度稳定计时器：连续 300ms 无高度变化则认为渲染完成
    const stableTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // 程序性滚动完成后的清除计时器
    const programmaticScrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // ResizeObserver 兜底超时计时器（最多等待 3s）
    const observerFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // 消息更新时的滚动清除计时器
    const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /** 判断滚动容器当前是否接近底部 */
    const isNearBottom = useCallback(() => {
        const container = scrollContainerRef.current;
        if (!container) return true;
        const { scrollTop, scrollHeight, clientHeight } = container;
        return Math.abs(scrollHeight - (scrollTop + clientHeight)) < threshold;
    }, [threshold]);

    /**
     * 立即滚到底部，同时设置程序性滚动标志防止 handleScroll 误判为用户行为。
     */
    const scrollToBottom = useCallback(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        if (programmaticScrollTimerRef.current) {
            clearTimeout(programmaticScrollTimerRef.current);
            programmaticScrollTimerRef.current = null;
        }
        isProgrammaticScrollRef.current = true;
        container.scrollTo({ top: container.scrollHeight, behavior: "auto" });
        programmaticScrollTimerRef.current = setTimeout(() => {
            isProgrammaticScrollRef.current = false;
        }, 0);
    }, []);

    /**
     * 流结束后调用：
     * 1. 立即滚底（纯文本回复无高度变化时也能及时到底）；
     * 2. 用 ResizeObserver 监听内容高度变化，每次稳定 300ms 后再补滚一次；
     * 3. 兜底：最多等待 3s 后断开观察。
     */
    const scrollToBottomAfterRender = useCallback(() => {
        const container = scrollContainerRef.current;
        const inner = container?.firstElementChild as HTMLElement | null;
        if (!container || !inner) return;

        // 清理上一次未完成的观察
        if (postStreamObserverRef.current) {
            postStreamObserverRef.current.disconnect();
            postStreamObserverRef.current = null;
        }
        if (stableTimerRef.current) {
            clearTimeout(stableTimerRef.current);
            stableTimerRef.current = null;
        }
        if (observerFallbackTimerRef.current) {
            clearTimeout(observerFallbackTimerRef.current);
            observerFallbackTimerRef.current = null;
        }

        // 立即滚一次
        scrollToBottom();

        let lastHeight = inner.scrollHeight;

        const observer = new ResizeObserver(() => {
            const currentHeight = inner.scrollHeight;
            if (currentHeight === lastHeight) return;
            lastHeight = currentHeight;

            if (stableTimerRef.current) {
                clearTimeout(stableTimerRef.current);
                stableTimerRef.current = null;
            }
            stableTimerRef.current = setTimeout(() => {
                // 高度稳定 300ms 后认为渲染完成，补滚一次
                scrollToBottom();
                observer.disconnect();
                postStreamObserverRef.current = null;
                isUserScrollingRef.current = false;
            }, 300);
        });

        observer.observe(inner);
        postStreamObserverRef.current = observer;

        // 兜底：3s 后强制断开（上方立即滚动已兜底，此处无需再 scrollToBottom）
        observerFallbackTimerRef.current = setTimeout(() => {
            observer.disconnect();
            postStreamObserverRef.current = null;
        }, 3000);
    }, [scrollToBottom]);

    /** 绑定滚动容器的用户交互事件，识别用户主动滚动行为 */
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            if (isProgrammaticScrollRef.current) return;
            isUserScrollingRef.current = !isNearBottom();
        };

        const handleWheel = (e: WheelEvent) => {
            if (e.deltaY < 0) {
                // 用户主动向上滚轮，立即取消程序性标志并标记为用户滚动
                isProgrammaticScrollRef.current = false;
                isUserScrollingRef.current = true;
            }
        };

        // 移动端：手指向下滑 = 内容向上滚动
        let touchStartY = 0;
        const handleTouchStart = (e: TouchEvent) => {
            touchStartY = e.touches[0].clientY;
        };
        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches[0].clientY - touchStartY > 0) {
                isUserScrollingRef.current = true;
            }
        };

        container.addEventListener("scroll", handleScroll, { passive: true });
        container.addEventListener("wheel", handleWheel, { passive: true });
        container.addEventListener("touchstart", handleTouchStart, { passive: true });
        container.addEventListener("touchmove", handleTouchMove, { passive: true });

        return () => {
            container.removeEventListener("scroll", handleScroll);
            container.removeEventListener("wheel", handleWheel);
            container.removeEventListener("touchstart", handleTouchStart);
            container.removeEventListener("touchmove", handleTouchMove);
        };
    }, [isNearBottom]);

    // 组件卸载时清理所有定时器和 ResizeObserver
    useEffect(
        () => () => {
            if (postStreamObserverRef.current) {
                postStreamObserverRef.current.disconnect();
                postStreamObserverRef.current = null;
            }
            if (stableTimerRef.current) {
                clearTimeout(stableTimerRef.current);
                stableTimerRef.current = null;
            }
            if (observerFallbackTimerRef.current) {
                clearTimeout(observerFallbackTimerRef.current);
                observerFallbackTimerRef.current = null;
            }
            if (programmaticScrollTimerRef.current) {
                clearTimeout(programmaticScrollTimerRef.current);
                programmaticScrollTimerRef.current = null;
            }
            if (scrollTimerRef.current) {
                clearTimeout(scrollTimerRef.current);
                scrollTimerRef.current = null;
            }
        },
        []
    );

    return {
        scrollContainerRef,
        messagesEndRef,
        isUserScrollingRef,
        scrollTimerRef,
        isProgrammaticScrollRef,
        scrollToBottomAfterRender,
    };
}
