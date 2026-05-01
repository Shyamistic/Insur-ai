import fs from "node:fs/promises";
import path from "node:path";

const STREAM_FILE = path.join(process.cwd(), ".data", "sensor-stream.ndjson");
const API_BASE = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

type SensorReading = {
  ts: string;
  sensorId: string;
  routeId: string;
  metric: "temperature_c" | "voltage_v";
  value: number;
};

let processedLines = 0;

function isBreach(reading: SensorReading) {
  if (reading.metric === "temperature_c") return reading.value > 30;
  if (reading.metric === "voltage_v") return reading.value < 210;
  return false;
}

async function loadReadings(): Promise<SensorReading[]> {
  try {
    const content = await fs.readFile(STREAM_FILE, "utf8");
    return content
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as SensorReading);
  } catch {
    return [];
  }
}

async function evaluateBreach(reading: SensorReading, idx: number) {
  const claimId = BigInt(idx + 1);
  const policyId = BigInt(1);
  const holder = "0x0000000000000000000000000000000000000001";

  const response = await fetch(`${API_BASE}/api/claims/evaluate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      claimId: claimId.toString(),
      policyId: policyId.toString(),
      holder,
      coverageAmount: "10000000000000000",
      evidenceCid: `sensor-${reading.sensorId}-${reading.ts}`,
      triggerValue: reading.value,
      settleOnChain: false,
    }),
  });

  const data = await response.json();
  console.log(
    `[consumer] breach=${reading.metric}:${reading.value} decision=${data?.decision?.approved} score=${data?.decision?.score}`,
  );
}

async function tick() {
  const readings = await loadReadings();
  const next = readings.slice(processedLines);
  processedLines = readings.length;

  for (let i = 0; i < next.length; i++) {
    const reading = next[i];
    if (isBreach(reading)) {
      await evaluateBreach(reading, processedLines + i);
    }
  }
}

async function main() {
  console.log("[consumer] started, polling sensor stream...");
  setInterval(() => {
    tick().catch((error) => {
      console.error("[consumer] tick failed", error);
    });
  }, 1500);
}

main().catch((error) => {
  console.error("[consumer] fatal", error);
  process.exit(1);
});
