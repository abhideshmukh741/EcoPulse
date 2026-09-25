import { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";

/**
 * ScrollProgressBar — a thin glowing bar at the top of the page
 * that shows how far the user has scrolled.
 */
export default function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      style={{
        scaleX,
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "3px",
        background: "linear-gradient(90deg, #00ff88, #00c8ff, #7c3aed)",
        transformOrigin: "0%",
        zIndex: 9999,
        boxShadow: "0 0 8px rgba(0, 255, 136, 0.7)",
      }}
    />
  );
}

/**
 * ScrollToTopButton — a floating button that appears after scrolling
 * and scrolls back to top when clicked.
 */
export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{
        position: "fixed",
        bottom: "28px",
        right: "28px",
        width: "44px",
        height: "44px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #00ff88, #00c8ff)",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999,
        boxShadow: "0 4px 20px rgba(0,255,136,0.4)",
        color: "#06110c",
        fontSize: "20px",
        fontWeight: "bold",
      }}
      whileHover={{ scale: 1.15, boxShadow: "0 6px 28px rgba(0,255,136,0.6)" }}
      whileTap={{ scale: 0.9 }}
    >
      ↑
    </motion.button>
  );
}
