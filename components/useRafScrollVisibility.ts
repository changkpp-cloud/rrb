"use client";

import { useEffect, useRef, useState } from "react";

export default function useRafScrollVisibility() {
  const [hidden, setHidden] = useState(false);
  const hiddenRef = useRef(false);
  const tickingRef = useRef(false);

  useEffect(() => {
    function updateVisibility() {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const viewportHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const atTop = scrollTop <= 8;
      const atBottom = scrollTop + viewportHeight >= documentHeight - 8;
      const nextHidden = !(atTop || atBottom);

      if (hiddenRef.current !== nextHidden) {
        hiddenRef.current = nextHidden;
        setHidden(nextHidden);
      }

      tickingRef.current = false;
    }

    function onScrollOrResize() {
      if (tickingRef.current) return;
      tickingRef.current = true;
      window.requestAnimationFrame(updateVisibility);
    }

    updateVisibility();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, []);

  return hidden;
}
