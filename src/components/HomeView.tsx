"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMultichainWallet } from "@/context/MultichainWallet";
import { easeOut, fadeUp, staggerContainer } from "@/lib/motion";
import { ConnectButton } from "./ConnectButton";
import { HeroCta } from "./HeroCta";
import { PortfolioScanner } from "./PortfolioScanner";

const coverage = [
  { name: "EVM", detail: "2,000+ networks" },
  { name: "BOT Chain", detail: "Native BOT tips" },
  { name: "Solana", detail: "SPL tokens" },
  { name: "Bitcoin", detail: "Native BTC" },
] as const;

const steps = [
  {
    num: "01",
    title: "Connect a wallet",
    body: "MetaMask or Phantom. Read-only scan — tip separately in BOT to reveal.",
  },
  {
    num: "02",
    title: "Tip 0.3 BOT",
    body: "See your total value free — tip native BOT on BOT Chain to unlock tokens and chains.",
  },
  {
    num: "03",
    title: "Review by network",
    body: "See tokens across EVM, Solana, Bitcoin, Sui, and BOT Chain with USD when priced.",
  },
] as const;

export function HomeView() {
  const { isConnected } = useMultichainWallet();
  const reduceMotion = useReducedMotion();

  return (
    <div className={`page ${isConnected ? "page-connected" : ""}`}>
      <div className="atmosphere" aria-hidden>
        <div className="mesh" />
      </div>

      <div className="shell">
        <motion.header
          className="topbar"
          initial={reduceMotion ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={easeOut}
        >
          <a className="brand-mark" href="/">
            Find Hidden Money
          </a>
          <ConnectButton />
        </motion.header>

        <main>
          <AnimatePresence mode="wait">
            {!isConnected ? (
              <motion.div
                key="landing"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.28 }}
              >
                <motion.section
                  className="hero"
                  variants={reduceMotion ? undefined : staggerContainer}
                  initial="hidden"
                  animate="show"
                >
                  <div className="hero-copy">
                    <motion.p className="brand-hero" variants={fadeUp}>
                      Find Hidden Money
                    </motion.p>
                    <motion.h1 className="headline" variants={fadeUp}>
                      Forgotten tokens across every chain your wallet touches.
                    </motion.h1>
                    <motion.p className="lede" variants={fadeUp}>
                      Connect MetaMask or Phantom once. We only read public
                      addresses, then list every balance that still shows up.
                    </motion.p>
                    <motion.div variants={fadeUp}>
                      <HeroCta />
                    </motion.div>
                  </div>

                  <motion.aside
                    className="hero-aside"
                    variants={fadeUp}
                    aria-label="Coverage"
                  >
                    <p className="aside-label">Coverage</p>
                    <ul className="aside-list">
                      {coverage.map((item, i) => (
                        <motion.li
                          key={item.name}
                          initial={reduceMotion ? false : { opacity: 0, x: 8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ ...easeOut, delay: 0.15 + i * 0.06 }}
                        >
                          <span>{item.name}</span>
                          <em>{item.detail}</em>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.aside>
                </motion.section>

                <section className="how" id="how">
                  <div className="how-head">
                    <p className="section-kicker">How it works</p>
                    <h2 className="section-title">Three clear steps</h2>
                  </div>
                  <motion.ol
                    className="steps"
                    variants={reduceMotion ? undefined : staggerContainer}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-40px" }}
                  >
                    {steps.map((step) => (
                      <motion.li key={step.num} variants={fadeUp}>
                        <span className="step-num">{step.num}</span>
                        <strong>{step.title}</strong>
                        <span>{step.body}</span>
                      </motion.li>
                    ))}
                  </motion.ol>
                </section>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <PortfolioScanner />
        </main>

        <footer className="footer">
          <p>Read-only portfolio scan · Never asks to sign or spend</p>
        </footer>
      </div>
    </div>
  );
}
