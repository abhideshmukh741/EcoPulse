import { useRef } from "react";
import { motion, useInView } from "framer-motion";

/**
 * ScrollReveal — light fade/slide on enter (no CSS blur — that tanks FPS).
 */

const variants = {
  fadeUp: (y) => ({
    hidden:  { opacity: 0, y },
    visible: { opacity: 1, y: 0 },
  }),
  fadeDown: (y) => ({
    hidden:  { opacity: 0, y: -Math.abs(y) },
    visible: { opacity: 1, y: 0 },
  }),
  fadeLeft: (_, x) => ({
    hidden:  { opacity: 0, x: -Math.abs(x) },
    visible: { opacity: 1, x: 0 },
  }),
  fadeRight: (_, x) => ({
    hidden:  { opacity: 0, x: Math.abs(x) },
    visible: { opacity: 1, x: 0 },
  }),
  zoom: () => ({
    hidden:  { opacity: 0, scale: 0.96 },
    visible: { opacity: 1, scale: 1 },
  }),
  flip: () => ({
    hidden:  { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0 },
  }),
  none: () => ({
    hidden:  {},
    visible: {},
  }),
};

export default function ScrollReveal({
  children,
  variant = "fadeUp",
  delay = 0,
  duration = 0.5,
  y = 28,
  x = 32,
  className = "",
  once = false, // bidirectional: animate in on scroll down, reverse on scroll up
  threshold = 0.15,
}) {
  const ref = useRef(null);
  const inView = useInView(ref, {
    once,
    amount: threshold,
    margin: "0px 0px -60px 0px",
  });

  const getVariant = variants[variant] || variants.fadeUp;
  const animVariants = getVariant(y, x);

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={animVariants}
      transition={{
        duration: inView ? duration : Math.min(duration, 0.35),
        delay: inView ? Math.min(delay, 0.25) : 0,
        ease: [0.22, 1, 0.36, 1],
      }}
      style={{ willChange: "transform, opacity", width: className.includes("h-full") ? "100%" : undefined }}
    >
      {children}
    </motion.div>
  );
}

export function ScrollRevealGroup({
  children,
  staggerDelay = 0.06,
  variant = "fadeUp",
  y = 20,
  x = 24,
  duration = 0.4,
  className = "",
  childClassName = "",
  once = false,
}) {
  const ref = useRef(null);
  const inView = useInView(ref, {
    once,
    amount: 0.08,
    margin: "0px 0px -40px 0px",
  });

  const getVariant = variants[variant] || variants.fadeUp;
  const itemVariants = getVariant(y, x);

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0,
      },
    },
  };

  const itemWithTransition = {
    hidden: itemVariants.hidden,
    visible: {
      ...itemVariants.visible,
      transition: {
        duration,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={containerVariants}
    >
      {Array.isArray(children)
        ? children.map((child, i) => (
            <motion.div key={i} className={childClassName} variants={itemWithTransition}>
              {child}
            </motion.div>
          ))
        : (
            <motion.div className={childClassName} variants={itemWithTransition}>
              {children}
            </motion.div>
          )
      }
    </motion.div>
  );
}
