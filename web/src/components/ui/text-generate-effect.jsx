import React, { useEffect } from "react";
import { motion, stagger, useAnimation } from "framer-motion";
import { cn } from "utils/cn";

export const TextGenerateEffect = ({ words, className, noAnimate = false }) => {
  const controls = useAnimation();
  // Split by any whitespace character, including new lines
  let wordsArray = words.split(" ") || [];

  useEffect(() => {
    if (!noAnimate) {
      controls.start("visible");
    }
  }, [controls, noAnimate]);
  const renderWords = () => {
    return (
      <motion.div
        initial={!noAnimate && "hidden"}
        animate={!noAnimate && "visible"}
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.1 } },
        }}
      >
        {wordsArray.map((word, idx) => (
          <motion.span
            key={word + idx}
            className="dark:text-white text-black"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1 },
            }}
          >
            {/* Handle special characters */}
            {word.split("").map((char, charIdx) => (
              <React.Fragment key={charIdx}>
                {char === "\n" ? <br /> : char}
              </React.Fragment>
            ))}{" "}
          </motion.span>
        ))}
      </motion.div>
    );
  };

  return (
    <div className={cn("font-bold", className)}>
      <div className="">
        <div className="dark:text-white text-black text-sm leading-snug tracking-wide">
          {renderWords()}
        </div>
      </div>
    </div>
  );
};
