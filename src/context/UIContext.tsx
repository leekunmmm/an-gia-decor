"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import type Lenis from "lenis";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface UIContextValue {
  megaOpen: boolean;
  setMegaOpen: React.Dispatch<React.SetStateAction<boolean>>;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  searchOpen: boolean;
  setSearchOpen: React.Dispatch<React.SetStateAction<boolean>>;
  authOpen: boolean;
  setAuthOpen: React.Dispatch<React.SetStateAction<boolean>>;
  authTab: "login" | "register";
  setAuthTab: (tab: "login" | "register") => void;
  user: AuthUser | null;
  signOut: () => Promise<void>;
  wishlist: string[];
  toggleWishlist: (slug: string) => void;
  isWishlisted: (slug: string) => boolean;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  lenisRef: React.MutableRefObject<Lenis | null>;
}

type OverlayKind = "mega" | "mobile" | "search" | "auth";

const UIContext = createContext<UIContextValue | null>(null);

function mapSupabaseUser(u: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
} | null): AuthUser | null {
  if (!u || !u.email) return null;
  const metaName =
    typeof u.user_metadata?.full_name === "string" &&
    u.user_metadata.full_name.trim()
      ? u.user_metadata.full_name.trim()
      : u.email.split("@")[0];
  return {
    id: u.id,
    email: u.email,
    name: metaName,
  };
}

export function UIProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [activeOverlay, setActiveOverlay] = useState<OverlayKind | null>(null);
  const megaOpen = activeOverlay === "mega";
  const mobileMenuOpen = activeOverlay === "mobile";
  const searchOpen = activeOverlay === "search";
  const authOpen = activeOverlay === "auth";
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setMegaOpen: React.Dispatch<React.SetStateAction<boolean>> = useCallback(
    (value) => {
      setActiveOverlay((prev) => {
        const current = prev === "mega";
        const next = typeof value === "function" ? value(current) : value;
        if (next) return "mega";
        return current ? null : prev;
      });
    },
    []
  );

  const setMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>> = useCallback(
    (value) => {
      setActiveOverlay((prev) => {
        const current = prev === "mobile";
        const next = typeof value === "function" ? value(current) : value;
        if (next) return "mobile";
        return current ? null : prev;
      });
    },
    []
  );

  const setSearchOpen: React.Dispatch<React.SetStateAction<boolean>> = useCallback(
    (value) => {
      setActiveOverlay((prev) => {
        const current = prev === "search";
        const next = typeof value === "function" ? value(current) : value;
        if (next) return "search";
        return current ? null : prev;
      });
    },
    []
  );

  const handleSetAuthOpen: React.Dispatch<React.SetStateAction<boolean>> = useCallback(
    (value) => {
      setActiveOverlay((prev) => {
        const current = prev === "auth";
        const next = typeof value === "function" ? value(current) : value;
        if (next) return "auth";
        return current ? null : prev;
      });
    },
    []
  );

  useEffect(() => {
    const wishTimer = setTimeout(() => {
      try {
        const savedWish = window.localStorage.getItem("ag_wishlist");
        if (savedWish) setWishlist(JSON.parse(savedWish) as string[]);
        window.localStorage.removeItem("ag_demo_user");
      } catch {
        // Ignore storage errors
      }
    }, 0);

    let unsubscribe: (() => void) | undefined;
    try {
      const supabase = createBrowserSupabaseClient();
      supabase.auth
        .getSession()
        .then(({ data: sessionData }) => {
          if (!sessionData.session) {
            setUser(null);
            return;
          }
          return supabase.auth.getUser().then(({ data, error }) => {
            if (error || !data.user) {
              void supabase.auth.signOut({ scope: "local" });
              setUser(null);
              return;
            }
            setUser(mapSupabaseUser(data.user));
          });
        })
        .catch(() => {});

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(mapSupabaseUser(session?.user ?? null));
      });
      unsubscribe = () => subscription.unsubscribe();
    } catch {
      // Ignore when env is missing
    }

    return () => {
      clearTimeout(wishTimer);
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setActiveOverlay(null);
    }, 0);
    return () => clearTimeout(t);
  }, [pathname]);

  useEffect(() => {
    if (!authOpen) {
      const t = setTimeout(() => setAuthTab("login"), 0);
      return () => clearTimeout(t);
    }
  }, [authOpen]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }, []);

  const signOut = useCallback(async () => {
    try {
      const supabase = createBrowserSupabaseClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore
    }
    setUser(null);
    setAuthTab("login");
    showToast("Đã đăng xuất tài khoản");
  }, [showToast]);

  const toggleWishlist = useCallback(
    (slug: string) => {
      setWishlist((prev) => {
        const exists = prev.includes(slug);
        const next = exists ? prev.filter((s) => s !== slug) : [...prev, slug];
        try {
          window.localStorage.setItem("ag_wishlist", JSON.stringify(next));
        } catch {
          // Ignore
        }
        showToast(
          exists
            ? "Đã bỏ khỏi danh sách yêu thích"
            : "Đã lưu vào danh sách yêu thích"
        );
        return next;
      });
    },
    [showToast]
  );

  const isWishlisted = useCallback(
    (slug: string) => wishlist.includes(slug),
    [wishlist]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1100px)");
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setActiveOverlay((prev) => (prev === "mobile" ? null : prev));
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const anyOverlay = megaOpen || mobileMenuOpen || searchOpen || authOpen;
    if (anyOverlay) {
      lenisRef.current?.stop();
      document.body.style.overflow = "hidden";
    } else {
      lenisRef.current?.start();
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [megaOpen, mobileMenuOpen, searchOpen, authOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveOverlay(null);
        setAuthTab("login");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <UIContext.Provider
      value={{
        megaOpen,
        setMegaOpen,
        mobileMenuOpen,
        setMobileMenuOpen,
        searchOpen,
        setSearchOpen,
        authOpen,
        setAuthOpen: handleSetAuthOpen,
        authTab,
        setAuthTab,
        user,
        signOut,
        wishlist,
        toggleWishlist,
        isWishlisted,
        toastMessage,
        showToast,
        lenisRef,
      }}
    >
      {children}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[2500] rounded-full bg-[#141619]/95 border border-[#e2ad21] px-5 py-2.5 text-sm font-medium text-white shadow-2xl backdrop-blur-md"
        >
          {toastMessage}
        </div>
      )}
    </UIContext.Provider>
  );
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used inside UIProvider");
  return ctx;
}
