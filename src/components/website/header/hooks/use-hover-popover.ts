import { useState, useRef, useEffect, useCallback } from "react";
import { POPOVER_CLOSE_DELAY } from "../constants";

/** `useHoverPopover` 返回值类型 */
export type HoverPopoverReturn = {
  open: boolean;
  setOpen: (open: boolean) => void;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
};

/**
 * 通过鼠标悬停控制 Popover 开关。
 *
 * 鼠标离开后延迟 `POPOVER_CLOSE_DELAY` ms 关闭，
 * 防止鼠标从 `PopoverTrigger` 移入 `PopoverContent` 期间出现闪烁。
 * 组件卸载时自动清除挂起的定时器，避免内存泄漏。
 */
export function useHoverPopover(): HoverPopoverReturn {
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setOpen(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    closeTimerRef.current = setTimeout(
      () => setOpen(false),
      POPOVER_CLOSE_DELAY
    );
  }, []);

  // 卸载时清除残留定时器
  useEffect(
    () => () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    },
    []
  );

  return { open, setOpen, handleMouseEnter, handleMouseLeave };
}
