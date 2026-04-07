import { useState, useRef, useEffect, useCallback } from "react";
import {
  SCROLL_HIDE_THRESHOLD,
  SCROLL_UP_TRIGGER_DISTANCE,
} from "../constants";

/**
 * 监听页面滚动，返回导航栏是否应隐藏的布尔值。
 *
 * 规则：
 * - 向下滚动超过 `SCROLL_HIDE_THRESHOLD` → 隐藏
 * - 向上累计超过 `SCROLL_UP_TRIGGER_DISTANCE` → 显示
 * - 回到页面顶部 → 立即显示
 *
 * 使用 `requestAnimationFrame` 节流，避免高频滚动事件引发多余重渲染。
 * `hiddenRef` 与 `hidden` state 保持同步：
 *   - ref 供 rAF 回调读取最新值（无闭包陷阱）
 *   - state 驱动 React 重渲染
 */
export function useScrollHideHeader(): boolean {
  const [hidden, setHidden] = useState(false);

  // 与 state 保持同步的 ref，供 scroll 回调读取最新值
  const hiddenRef = useRef(false);
  const lastScrollY = useRef(0);
  // 本次向上滚动起始位置，null 表示当前正在向下滚动
  const upStartY = useRef<number | null>(null);

  /** 同步更新 ref 与 state */
  const setHiddenSync = useCallback((value: boolean) => {
    hiddenRef.current = value;
    setHidden(value);
  }, []);

  useEffect(() => {
    let rafId: ReturnType<typeof requestAnimationFrame> | null = null;

    const handleScroll = () => {
      // rAF 节流：上一帧未执行完则跳过本次
      if (rafId !== null) return;

      rafId = requestAnimationFrame(() => {
        rafId = null;
        const currentY = window.scrollY;
        const isScrollingDown = currentY > lastScrollY.current;

        if (isScrollingDown) {
          // 向下滚动：重置向上起始点，超过阈值后隐藏
          upStartY.current = null;
          if (currentY > SCROLL_HIDE_THRESHOLD && !hiddenRef.current) {
            setHiddenSync(true);
          }
        } else {
          // 回到顶部：立即显示，跳过累计逻辑
          if (currentY <= 0) {
            upStartY.current = null;
            setHiddenSync(false);
            lastScrollY.current = currentY;
            return;
          }

          // 向上滚动：记录起始位置，累计超过触发距离才显示
          if (upStartY.current === null) {
            upStartY.current = lastScrollY.current;
          }
          if (
            hiddenRef.current &&
            upStartY.current - currentY > SCROLL_UP_TRIGGER_DISTANCE
          ) {
            setHiddenSync(false);
          }
        }

        lastScrollY.current = currentY;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [setHiddenSync]);

  return hidden;
}
