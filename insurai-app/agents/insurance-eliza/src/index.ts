import express from "express";
import cors from "cors";
import { getQuote } from "./actions/getQuote";
import { purchasePolicy } from "./actions/purchasePolicy";
import { fileClaim } from "./actions/fileClaim";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.ELIZA_PORT || 4300);
const API_BASE = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

app.post("/chat", async (req, res) => {
  const message = String(req.body?.message || "");
  const sessionId = String(req.body?.sessionId || "");
  const wallet = String(req.body?.wallet || "");

  if (!sessionId) {
    res.status(400).json({ reply: "Missing session. Sign once in chat first." });
    return;
  }

  try {
    if (/quote|insure|coverage|premium/i.test(message)) {
      const quote = await getQuote(message);
      res.json({
        reply: `Quote ready: $${quote.coverage} coverage for ~$${quote.premium} premium. Say "purchase" to mint policy iNFT.`,
        data: quote,
      });
      return;
    }

    if (/purchase|buy|mint/i.test(message)) {
      const result = await purchasePolicy(API_BASE, wallet, message);
      res.json({
        reply: `Policy purchase flow submitted. encryptedMetadataUri=${result.encryptedMetadataUri || "n/a"}`,
        data: result,
      });
      return;
    }

    if (/claim|payout|breach/i.test(message)) {
      const result = await fileClaim(API_BASE, wallet, message);
      res.json({
        reply: `Claim evaluation executed. Approved=${result?.decision?.approved ?? false}, score=${result?.decision?.score ?? "n/a"}.`,
        data: result,
      });
      return;
    }

    res.json({
      reply: "I can run: getQuote, purchasePolicy, fileClaim. Try 'quote cargo 5000' or 'purchase policy'.",
    });
  } catch (error) {
    res.status(500).json({
      reply: `Agent action failed: ${error instanceof Error ? error.message : "unknown"}`,
    });
  }
});

app.listen(PORT, () => {
  console.log(`[eliza] insurance agent listening on :${PORT}`);
});
