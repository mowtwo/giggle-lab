"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

/**
 * 统一手势层:把三种输入合成同一条手势流。
 *
 *   1. 指针拖拽(鼠标按住拖 / 手指触摸 / 触控笔)—— pointer events;
 *   2. 触控板双指滑动 —— wheel events。macOS 触控板的双指滑动只会产生 wheel,
 *      没有 pointerdown,所以必须单独接;wheel 也没有"结束"事件,用空闲计时器补;
 *   3. 触屏 —— 同样走 pointer events。
 *
 * 方向约定:dx/dy 是"手指移动的方向",向右为 +dx,向下为 +dy。
 * wheel 的 deltaY 为正表示内容上移(等价于手指上滑),所以取反。
 */

export type SwipeDelta = { dx: number; dy: number };

export type SwipeHandlers = {
  onSwipeStart?: (origin: { x: number; y: number }, source: "pointer" | "wheel") => void;
  onSwipeMove?: (delta: SwipeDelta, origin: { x: number; y: number }) => void;
  onSwipeEnd?: (
    delta: SwipeDelta,
    velocity: SwipeDelta,
    origin: { x: number; y: number },
  ) => void;
  /** 位移没超过阈值时按点击处理。 */
  onTap?: (point: { x: number; y: number }) => void;
};

export type SwipeOptions = {
  /** 超过多少像素才算手势(以内算点击)。 */
  threshold?: number;
  /** 触控板滑动停止多久算手势结束(ms)。 */
  wheelIdle?: number;
  /** 关掉某一路输入。 */
  pointer?: boolean;
  wheel?: boolean;
  disabled?: boolean;
};

const DEFAULTS = { threshold: 8, wheelIdle: 110 };

export function useSwipe(handlers: SwipeHandlers, options: SwipeOptions = {}) {
  const {
    threshold = DEFAULTS.threshold,
    wheelIdle = DEFAULTS.wheelIdle,
    pointer = true,
    wheel = true,
    disabled = false,
  } = options;

  // 回调每帧都可能换新的,但手势流是异步事件驱动的,提交后再同步就够。
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  const stateRef = useRef<{
    active: boolean;
    source: "pointer" | "wheel" | null;
    pointerId: number | null;
    origin: { x: number; y: number };
    delta: SwipeDelta;
    lastAt: number;
    velocity: SwipeDelta;
    moved: boolean;
  }>({
    active: false,
    source: null,
    pointerId: null,
    origin: { x: 0, y: 0 },
    delta: { dx: 0, dy: 0 },
    lastAt: 0,
    velocity: { dx: 0, dy: 0 },
    moved: false,
  });

  const wheelTimerRef = useRef<number | null>(null);

  const finish = useCallback(() => {
    const state = stateRef.current;
    if (!state.active) {
      return;
    }
    const { delta, velocity, origin, moved } = state;
    state.active = false;
    state.source = null;
    state.pointerId = null;
    if (moved) {
      handlersRef.current.onSwipeEnd?.({ ...delta }, { ...velocity }, { ...origin });
    } else {
      handlersRef.current.onTap?.({ ...origin });
    }
    state.delta = { dx: 0, dy: 0 };
    state.velocity = { dx: 0, dy: 0 };
    state.moved = false;
  }, []);

  const begin = useCallback(
    (origin: { x: number; y: number }, source: "pointer" | "wheel") => {
      const state = stateRef.current;
      state.active = true;
      state.source = source;
      state.origin = origin;
      state.delta = { dx: 0, dy: 0 };
      state.velocity = { dx: 0, dy: 0 };
      state.lastAt = performance.now();
      state.moved = false;
      handlersRef.current.onSwipeStart?.(origin, source);
    },
    [],
  );

  const advance = useCallback(
    (dx: number, dy: number) => {
      const state = stateRef.current;
      if (!state.active) {
        return;
      }
      const now = performance.now();
      const dt = Math.max(1, now - state.lastAt);
      state.velocity = {
        dx: ((dx - state.delta.dx) / dt) * 1000,
        dy: ((dy - state.delta.dy) / dt) * 1000,
      };
      state.lastAt = now;
      state.delta = { dx, dy };
      if (!state.moved && Math.hypot(dx, dy) > threshold) {
        state.moved = true;
      }
      if (state.moved) {
        handlersRef.current.onSwipeMove?.({ dx, dy }, { ...state.origin });
      }
    },
    [threshold],
  );

  /**
   * 指针阶段全程挂在 window 上,不用 setPointerCapture。
   *
   * 两个坑都在这儿:
   *   - 一按下就抢 capture,后续的 click 会被重定向到本元素,内部按钮全点不动;
   *   - 只在元素上监听 pointerup,手指/鼠标在元素外松开就收不到,手势永远结束不了,
   *     active 卡住之后这块区域就彻底失灵了。
   * 挂 window 两个问题一起没有。
   */
  const detachRef = useRef<(() => void) | null>(null);

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (disabled || !pointer || stateRef.current.active) {
        return;
      }
      // 只接主键/触摸,右键和中键不参与。
      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }
      const pointerId = event.pointerId;
      stateRef.current.pointerId = pointerId;
      begin({ x: event.clientX, y: event.clientY }, "pointer");

      const onMove = (native: PointerEvent) => {
        const state = stateRef.current;
        if (!state.active || state.source !== "pointer" || state.pointerId !== native.pointerId) {
          return;
        }
        advance(native.clientX - state.origin.x, native.clientY - state.origin.y);
      };
      const onUp = (native: PointerEvent) => {
        if (stateRef.current.pointerId !== native.pointerId) {
          return;
        }
        detachRef.current?.();
        finish();
      };

      detachRef.current = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        detachRef.current = null;
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [advance, begin, disabled, finish, pointer],
  );

  const onWheel = useCallback(
    (event: React.WheelEvent) => {
      if (disabled || !wheel) {
        return;
      }
      const state = stateRef.current;
      if (state.active && state.source === "pointer") {
        return;
      }
      if (!state.active) {
        begin({ x: event.clientX, y: event.clientY }, "wheel");
      }
      // deltaMode 1 是按行滚(部分鼠标),换算成像素量级。
      const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 100 : 1;
      advance(
        state.delta.dx - event.deltaX * scale,
        state.delta.dy - event.deltaY * scale,
      );
      if (wheelTimerRef.current) {
        window.clearTimeout(wheelTimerRef.current);
      }
      wheelTimerRef.current = window.setTimeout(() => {
        wheelTimerRef.current = null;
        // 触控板滑动本身不该被当成点击。
        stateRef.current.moved = true;
        finish();
      }, wheelIdle);
    },
    [advance, begin, disabled, finish, wheel, wheelIdle],
  );

  useEffect(
    () => () => {
      if (wheelTimerRef.current) {
        window.clearTimeout(wheelTimerRef.current);
      }
      detachRef.current?.();
    },
    [],
  );

  return useMemo(
    () => ({
      onPointerDown,
      onWheel,
      style: { touchAction: "none" as const },
    }),
    [onPointerDown, onWheel],
  );
}

/** 判断一次手势是不是某个方向的"甩动"。 */
export function isFlick(
  delta: SwipeDelta,
  velocity: SwipeDelta,
  axis: "x" | "y",
  distance = 60,
  speed = 380,
) {
  const d = axis === "x" ? delta.dx : delta.dy;
  const v = axis === "x" ? velocity.dx : velocity.dy;
  return Math.abs(d) > distance || Math.abs(v) > speed ? Math.sign(d || v) : 0;
}
