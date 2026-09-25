import { useContext } from "react";
import { motion } from "framer-motion";
import { NavDirectionContext } from "../context/NavDirection";

const SLIDE_DISTANCE = 24;

/**
 * Optional light page fade/slide — keep in sync with App route transitions.
 */
export default function PageTransition({ children, className = "" }) {
  const ctx = useContext(NavDirectionContext);
  const dir = ctx?.directionRef?.current ?? 1;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: dir * SLIDE_DISTANCE }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: dir * -SLIDE_DISTANCE }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
}
