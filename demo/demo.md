# 🧪 Local Testing Guide — AI Security Scanner

> Step-by-step instructions to demo the extension to your client.

---

## ⚡ Quick Start (2 minutes)

### Step 1: Open the Extension in VS Code

```bash
code /Users/abhijeetdey/Desktop/extensions/ai-security-scanner
```

### Step 2: Launch the Extension Development Host

1. Press **`F5`** in VS Code
2. This opens a **new VS Code window** (Extension Development Host) with your extension loaded
3. You'll see `🛡️ AI-SEC: ✅ Clean` in the bottom status bar — that means it's running

> [!TIP]
> If F5 doesn't work, go to **Run & Debug** sidebar (`Ctrl+Shift+D` / `Cmd+Shift+D`) → select **"Run Extension"** → click the green play button.

### Step 3: Open the Demo File

In the **new Extension Development Host window**:

1. Go to **File → Open Folder** → select the `ai-security-scanner` folder
2. Open the file: `demo/demo-vulnerable-app.ts`
3. **Instantly** you'll see:
   - 🔴 **Red squiggly underlines** on critical issues
   - 🟡 **Yellow squiggly underlines** on warnings
   - 🏷️ **CodeLens badges** above flagged lines
   - 📊 **Status bar** updating with counts

---

## 🎬 Demo Script (what to show the client)

### Demo 1: Real-Time Inline Diagnostics (30 sec)

1. Open `demo/demo-vulnerable-app.ts`
2. **Point out** the red and yellow underlines across the file
3. **Scroll through** to show all three categories are flagged
4. Show the **status bar** at the bottom: `🛡️ AI-SEC: X critical, Y warnings`

### Demo 2: Hover for Risk Details (30 sec)

1. **Hover your mouse** over any red-underlined text (e.g., line with `ignore previous instructions`)
2. A **rich popup** appears showing:
   - ⚠️ **What the risk is**
   - 💥 **Why it's dangerous** (with real-world examples)
   - ✅ **How to fix it** (with code)
3. Repeat on a different category — show it works for API keys, eval() risks, etc.

### Demo 3: Problems Panel (20 sec)

1. Open the **Problems Panel**: `Ctrl+Shift+M` / `Cmd+Shift+M`
2. Show the **full list** of all findings with:
   - `[AI-SEC] Prompt Injection | ...`
   - `[AI-SEC] Data Leakage | ...`
   - `[AI-SEC] API Misuse | ...`
3. **Click any finding** → it jumps to the exact line

### Demo 4: CodeLens Badges (20 sec)

1. Scroll through `demo-vulnerable-app.ts`
2. Point out the **severity badges** above each flagged line:
   - `🔴 CRITICAL — Prompt Override — Ignore Previous Instructions`
   - `🟡 WARNING — Unsanitized Input in Prompt Template`
3. **Click a CodeLens badge** → opens a detailed side panel

### Demo 5: Scan Entire Workspace (30 sec)

1. Open Command Palette: `Ctrl+Shift+P` / `Cmd+Shift+P`
2. Type: **"AI Security Scanner: Scan Entire Workspace"**
3. Watch the **progress notification** as it scans all files
4. See the **summary popup**: "Found X issues (Y critical, Z warnings) in N files"

### Demo 6: Security Report Dashboard (45 sec)

1. Open Command Palette: `Ctrl+Shift+P` / `Cmd+Shift+P`
2. Type: **"AI Security Scanner: Show Security Report"**
3. Show the **dashboard**:
   - Summary cards: Files Scanned, Critical, Warning, Info counts
   - Full findings list with severity badges
4. **Click filter buttons**: filter by Critical, Warning, or by category
5. **Click any finding** → jumps to the file and line
6. **Click "Export JSON"** or **"Export Markdown"** → saves a report file

### Demo 7: Real-Time Scanning (30 sec)

1. In the demo file, **type a new line**:
   ```typescript
   const secret = "sk-proj-test1234567890abcdef1234567890";
   ```
2. After ~500ms, a **new red underline** appears automatically
3. Show that deleting the line **removes the finding in real-time**

### Demo 8: Clean Code Validation (15 sec)

1. Scroll to the bottom section labeled "CLEAN CODE"
2. Point out: **no underlines, no badges** — clean code passes silently
3. This shows the scanner has **zero false positives on normal code**

### Demo 9: Command Palette Commands (20 sec)

Show all 5 commands available:

| Command | What It Does |
|---------|-------------|
| `AI Security Scanner: Scan Current File` | Scans just this file |
| `AI Security Scanner: Scan Entire Workspace` | Scans all files |
| `AI Security Scanner: Show Security Report` | Opens the dashboard |
| `AI Security Scanner: Clear All Findings` | Resets everything |
| `AI Security Scanner: Open Settings` | Opens configuration |

---

## 🎯 Key Talking Points for the Client

### What makes this different from existing tools?

1. **AI-specific patterns** — catches prompt injection, jailbreaks, and LLM API misuse that ESLint/SonarQube/Snyk don't detect
2. **Real-time** — findings appear as you type, not just in CI/CD
3. **Zero telemetry** — all analysis is 100% local, no data sent anywhere
4. **45 detection patterns** across 3 threat categories
5. **Zero dependencies** — no supply chain risk from the scanner itself

### Market urgency stats to cite:
- 4× growth in malicious VS Code extensions (2024→2025)
- 8.5% of VS Code extensions expose security risks (Cornell)
- ChatGPT clone extensions confirmed as spyware (1.34M installs)

---

## 🔧 Troubleshooting

| Issue | Fix |
|-------|-----|
| F5 doesn't launch | Make sure `out/` folder exists. Run `npm run compile` first |
| No squiggles appear | Check the file is a supported language (JS/TS/Python/JSON/YAML/MD) |
| Status bar missing | Look at the **left side** of the bottom status bar |
| Extension not loading | Check the Debug Console (`Ctrl+Shift+Y`) for errors |
| "Cannot find module" error | Run `npm install` then `npm run compile` |

### Verify the extension is compiled:

```bash
cd /Users/abhijeetdey/Desktop/extensions/ai-security-scanner
npm run compile
# Should complete with no errors
```

### Verify tests pass:

```bash
npm test
# Should show "ALL TESTS PASSED"
```

---

## 📁 Best Files to Demo

| File | What It Shows |
|------|--------------|
| `demo/demo-vulnerable-app.ts` | **All 3 categories** in one clean file (recommended for demo) |
| `test/fixtures/injection-sample.ts` | Deep dive: 14 prompt injection patterns |
| `test/fixtures/leakage-sample.py` | Deep dive: API keys, PII, credentials |
| `test/fixtures/misuse-sample.ts` | Deep dive: eval/exec, innerHTML, no rate limiting |

> [!IMPORTANT]
> Always demo from `demo/demo-vulnerable-app.ts` first — it's organized with clear section headers and comments that make sense to a non-technical client.
