import type { HTMLMotionProps } from "framer-motion";
import { motion } from "framer-motion";

const fadePreset: HTMLMotionProps<"div"> = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.18, ease: "easeOut" },
};

export const FadeIn = (props: HTMLMotionProps<"div">) => (
  <motion.div {...fadePreset} {...props} />
);
