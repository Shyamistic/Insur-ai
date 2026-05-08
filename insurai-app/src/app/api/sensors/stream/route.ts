import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

type SensorReading = {
  ts: string;
  sensorId: string;
  routeId: string;
  metric: "temperature_c" | "voltage_v";
  value: number;
};

const DATA_FILE = path.join(process.cwd(), ".data", "sensor-stream.ndjson");

// Thresholds for autonomous claim triggering
const THRESHOLDS = {
  temperature_c: { max: 30 },
  voltage_v: { min: 210 },
};

function generateReading(i: number): SensorReading {
  const metric = i % 2 === 0 ? "temperature_c" : "voltage_v";
  const base = metric === "temperature_c" ? 27.5 : 228;
  const noise = (Math.random() - 0.5) * (metric === "temperature_c" ? 8 : 35);
  return {
    ts: new Date().toISOString(),
    sensorId: metric === "temperature_c" ? "cargo-temp-01" : "dc-volt-01",
    routeId: metric === "temperature_c" ? "Lagos-London" : "datacenter-zone-a",
    metric,
    value: Number((base + noise).toFixed(2)),
  };
}

function isBreach(reading: SensorReading): boolean {
  if (reading.metric === "temperature_c") {
    return reading.value > THRESHOLDS.temperature_c.max;
  }
  if (reading.metric === "voltage_v") {
    return reading.value < THRESHOLDS.voltage_v.min;
  }
  return false;
}

async function publishToDa(reading: SensorReading): Promise<string> {
  const ingestUrl = process.env.OG_DA_INGEST_URL;
  if (ingestUrl) {
    await fetch(ingestUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.OG_DA_API_KEY ? { authorization: `Bearer ${process.env.OG_DA_API_KEY}` } : {}),
      },
      body: JSON.stringify(reading),
    });
    return "0g_da_endpoint";
  }

  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.appendFile(DATA_FILE, `${JSON.stringify(reading)}\n`, "utf8");
  return "local_stub_file";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const count = Math.max(1, Math.min(Number(body.count || 100), 2000));
    const readings: SensorReading[] = [];
    const breaches: SensorReading[] = [];

    let mode = "local_stub_file";
    for (let i = 0; i < count; i++) {
      const reading = generateReading(i);
      mode = await publishToDa(reading);
      readings.push(reading);
      if (isBreach(reading)) {
        breaches.push(reading);
      }
    }

    return NextResponse.json({
      ok: true,
      mode,
      count,
      sample: readings.slice(0, 3),
      breachCount: breaches.length,
      breaches: breaches.slice(0, 3),
      thresholds: THRESHOLDS,
      estimatedCostPerDay: {
        eventsPerDayAt10rps: 864000,
        ethereumCalldataUsd: 13000,
        zeroGDaUsd: 6.5,
        note: "0G DA is ~2000x cheaper than Ethereum calldata for high-frequency IoT data.",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
