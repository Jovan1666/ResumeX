import { useState, useEffect } from 'react';

export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

export function useBreakpoint() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    // 使用 requestAnimationFrame 节流 resize 事件，避免高频 setState 导致卡顿
    let rafId: number;
    const handleResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setWidth(window.innerWidth);
      });
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const isMobile = width < breakpoints.md;
  const isTablet = width >= breakpoints.md && width < breakpoints.lg;
  const isDesktop = width >= breakpoints.lg;

  const currentBreakpoint: Breakpoint = 
    width >= breakpoints['2xl'] ? '2xl' :
    width >= breakpoints.xl ? 'xl' :
    width >= breakpoints.lg ? 'lg' :
    width >= breakpoints.md ? 'md' : 'sm';

  const isAbove = (bp: Breakpoint) => width >= breakpoints[bp];
  const isBelow = (bp: Breakpoint) => width < breakpoints[bp];

  return {
    width,
    isMobile,
    isTablet,
    isDesktop,
    currentBreakpoint,
    isAbove,
    isBelow
  };
}

// 用于检测触摸设备
export function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  return isTouch;
}

// 用于检测设备方向
export function useOrientation() {
  const [isLandscape, setIsLandscape] = useState(
    typeof window !== 'undefined' ? window.innerWidth > window.innerHeight : true
  );

  useEffect(() => {
    let rafId: number;
    const handleOrientationChange = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setIsLandscape(window.innerWidth > window.innerHeight);
      });
    };

    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return { isLandscape, isPortrait: !isLandscape };
}
