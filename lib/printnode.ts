const PRINTNODE_API = "https://api.printnode.com";

interface NameplateJob {
  printerId: string;
  donorTitle: string;
  donorName: string;
  amount: number;
  memorialName: string;
}

function buildNameplateHtml(job: NameplateJob): string {
  const displayName = [job.donorTitle, job.donorName].filter(Boolean).join(" ");
  return `<!DOCTYPE html>
<html lang="th"><head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Sarabun', sans-serif;
    width: 148mm; height: 105mm;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    background: #fff; padding: 12mm;
    text-align: center;
  }
  .label { font-size: 9pt; color: #888; letter-spacing: 0.05em; margin-bottom: 4mm; }
  .memorial { font-size: 10pt; color: #555; margin-bottom: 6mm; }
  .divider { width: 40mm; height: 0.5pt; background: #c9973a; margin: 0 auto 6mm; }
  .name { font-size: 18pt; font-weight: 700; color: #1a1a1a; line-height: 1.3; }
  .amount { font-size: 13pt; color: #c9973a; font-weight: 700; margin-top: 5mm; }
  .sub { font-size: 8pt; color: #aaa; margin-top: 3mm; }
</style>
</head><body>
  <p class="label">หรีดร่วมบุญ · ใบร่วมบุญ</p>
  <p class="memorial">${escHtml(job.memorialName)}</p>
  <div class="divider"></div>
  <p class="name">${escHtml(displayName)}</p>
  <p class="amount">ร่วมบุญ ${job.amount.toLocaleString()} บาท</p>
  <p class="sub">ขอบคุณจากเจ้าภาพ</p>
</body></html>`;
}

function escHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function sendPrintJob(job: NameplateJob): Promise<{ ok: boolean; jobId?: number; error?: string }> {
  const apiKey = process.env.PRINTNODE_API_KEY;
  if (!apiKey) return { ok: false, error: "PRINTNODE_API_KEY not set" };

  const html = buildNameplateHtml(job);
  const content = Buffer.from(html).toString("base64");

  const body = {
    printerId: Number(job.printerId),
    title: `ป้าย: ${job.donorName}`,
    contentType: "raw_html",
    content,
    source: "หรีดร่วมบุญ",
    options: { copies: 1, paper: "A6" },
  };

  try {
    const res = await fetch(`${PRINTNODE_API}/printjobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `PrintNode ${res.status}: ${text}` };
    }

    const jobId = await res.json();
    return { ok: true, jobId };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
