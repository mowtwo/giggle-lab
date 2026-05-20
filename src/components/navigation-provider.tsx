"use client";

import { Loading } from "animal-island-ui";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { usePathname, useRouter } from "@/i18n/navigation";

type NavigationContextValue = {
  navigate: (href: string) => void;
};

const NavigationContext = createContext<NavigationContextValue | null>(null);
const MIN_LOADING_MS = 700;
const CLOSE_ANIMATION_MS = 900;

export function NavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  const pushTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
    }

    closeTimerRef.current = window.setTimeout(() => {
      setActive(false);
      closeTimerRef.current = window.setTimeout(() => {
        setMounted(false);
      }, CLOSE_ANIMATION_MS);
    }, 0);

    return () => {
      if (pushTimerRef.current) {
        window.clearTimeout(pushTimerRef.current);
      }
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, [pathname]);

  const navigate = useCallback(
    (href: string) => {
      if (href === pathname) {
        return;
      }

      if (pushTimerRef.current) {
        window.clearTimeout(pushTimerRef.current);
      }
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }

      setMounted(true);
      setActive(true);

      pushTimerRef.current = window.setTimeout(() => {
        router.push(href);
      }, MIN_LOADING_MS);
    },
    [pathname, router],
  );

  const value = useMemo(() => ({ navigate }), [navigate]);

  return (
    <NavigationContext.Provider value={value}>
      {children}
      {mounted && (
        <div
          data-app-loading="true"
          data-app-loading-active={active ? "true" : "false"}
          className="fixed inset-0 z-50"
        >
          <Loading active={active} />
        </div>
      )}
    </NavigationContext.Provider>
  );
}

export function useAppNavigation() {
  const context = useContext(NavigationContext);

  if (!context) {
    throw new Error("useAppNavigation must be used within NavigationProvider");
  }

  return context;
}
