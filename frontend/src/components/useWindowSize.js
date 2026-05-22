import { useState, useEffect } from "react";

export function useIsMobile() {
  // 768px is the industry standard breakpoint for mobile/tablets
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    // Listen for the screen changing size
    window.addEventListener("resize", handleResize);
    
    // Cleanup the listener
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
}

