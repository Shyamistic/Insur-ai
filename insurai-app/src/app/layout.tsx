import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InsurAI — Autonomous Insurance on 0G Blockchain",
  description:
    "InsurAI is the next-generation parametric insurance platform powered by 0G Chain, 0G Compute TEE, and 0G Storage. Instant AI-verified claims with onchain transparency.",
  keywords: "insurance, blockchain, AI, 0G, parametric insurance, TEE, decentralized",
};

import { Web3Provider } from "@/lib/Web3Provider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="hex-bg" />
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}
