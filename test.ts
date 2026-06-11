import { searchProduct, detailProduct } from "./era.ts";
import fs from "fs";

const PRODUCTS = ["headset", "charger", "case"];

function timestamp() {
  const d = new Date();
  const date = d.toISOString().slice(0, 10);
  const time = d.toTimeString().slice(0, 8).replace(/:/g, ":");
  return `${date}-${time}`;
}

function formatDuration(ms: number) {
  return (ms / 1000).toFixed(2) + "s";
}

interface TestResult {
  id: string;
  name: string;
  status: "PASS" | "FAIL";
  duration: number;
  error?: string;
}

function logResult(result: TestResult) {
  const status = result.status === "PASS" ? "[PASS]" : "[FAIL]";
  console.log(`${status} ${result.id} | ${result.name} | ${formatDuration(result.duration)}`);
}

function writeSummary(results: TestResult[], outputDir: string) {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const ts = timestamp();
  const filePath = `${outputDir}/summary-${ts}.txt`;

  const lines: string[] = [];
  lines.push("Eraspace Product Search Test");
  lines.push(`Date    : ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB`);
  lines.push("");
  lines.push("Results:");

  let totalPass = 0;
  let totalFail = 0;

  for (const r of results) {
    const status = r.status === "PASS" ? "[PASS]" : "[FAIL]";
    const name = r.name.padEnd(40);
    lines.push(`  ${status} ${r.id} | ${name} | ${formatDuration(r.duration)}`);
    if (r.error) lines.push(`         Error: ${r.error}`);
    if (r.status === "PASS") totalPass++;
    else totalFail++;
  }

  const total = totalPass + totalFail;
  lines.push("");
  lines.push("─".repeat(55));
  lines.push("Summary:");
  lines.push(`  Total  : ${total}`);
  lines.push(`  Passed : ${totalPass}`);
  lines.push(`  Failed : ${totalFail}`);
  lines.push(`  Status : ${totalFail === 0 ? "ALL PASSED" : "SOME FAILED"}`);
  lines.push("─".repeat(55));

  fs.writeFileSync(filePath, lines.join("\n"), "utf8");
  console.log(`\n[+] Summary saved: ${filePath}`);
}

async function runTests() {
  const results: TestResult[] = [];
  let tcIndex = 1;

  for (const keyword of PRODUCTS) {
    const tcSearchId = `TC-${String(tcIndex).padStart(3, "0")}`;
    const tcDetailId = `TC-${String(tcIndex + 1).padStart(3, "0")}`;

    // Search test
    let start = Date.now();
    try {
      const products = await searchProduct(keyword);
      const duration = Date.now() - start;

      if (products.length === 0) {
        const r: TestResult = { id: tcSearchId, name: `Search "${keyword}"`, status: "FAIL", duration, error: "No products found" };
        results.push(r);
        logResult(r);
        tcIndex += 2;
        continue;
      }

      const r: TestResult = { id: tcSearchId, name: `Search "${keyword}"`, status: "PASS", duration };
      results.push(r);
      logResult(r);

      // Detail test
      start = Date.now();
      const detail = await detailProduct(products[0].sku);
      const detailDuration = Date.now() - start;

      if (!detail || !detail.special_price) {
        const r2: TestResult = { id: tcDetailId, name: `Get detail "${keyword}"`, status: "FAIL", duration: detailDuration, error: "Price data unavailable" };
        results.push(r2);
        logResult(r2);
      } else {
        const r2: TestResult = { id: tcDetailId, name: `Get detail "${keyword}"`, status: "PASS", duration: detailDuration };
        results.push(r2);
        logResult(r2);
      }

    } catch (error: any) {
      const duration = Date.now() - start;
      const r: TestResult = { id: tcSearchId, name: `Search "${keyword}"`, status: "FAIL", duration, error: error.message };
      results.push(r);
      logResult(r);
    }

    tcIndex += 2;
  }

  writeSummary(results, "./output");
}

runTests().catch((error) => {
  console.error("[!] Error:", error);
  process.exit(1);
});
