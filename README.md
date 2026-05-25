# AI Security Scanner

> **Catch prompt injection, data leakage, and AI API misuse in real time — right inside VS Code.**

<p align="center">
  <img src="https://img.shields.io/visual-studio-marketplace/v/ontedduabhishakereddy.ai-security-scanner?style=for-the-badge&label=VERSION&color=0078d7" alt="Version" />
  <img src="https://img.shields.io/badge/PATTERNS-45+-blueviolet?style=for-the-badge" alt="45+ Patterns" />
  <img src="https://img.shields.io/badge/TELEMETRY-ZERO-brightgreen?style=for-the-badge" alt="Zero Telemetry" />
  <img src="https://img.shields.io/badge/LICENSE-MIT-green?style=for-the-badge" alt="MIT License" />
</p>

---

## The Problem

AI-powered development is growing fast — and so are AI-specific vulnerabilities. Traditional SAST tools don't catch **prompt injection**, **hardcoded LLM API keys**, or **eval() of AI-generated output**. These risks slip into production silently.

**AI Security Scanner** is a zero-config, zero-telemetry VS Code extension that detects **45+ AI security anti-patterns** the moment you type them — no cloud, no API calls, no data leaving your machine.

---

## Key Features

### 💉 Prompt Injection Detection — 17 Patterns

Detects injection commands (`ignore previous instructions`, `act as DAN`), zero-width Unicode steganography, base64 obfuscation, unsanitized template interpolation in JavaScript and Python, and system prompts loaded from untrusted external sources.

### 🔓 Data Leakage Detection — 15 Patterns

Catches hardcoded API keys for **OpenAI**, **Anthropic**, **Google**, **AWS**, and **HuggingFace**. Detects private keys, generic secrets in variable assignments, database connection strings with credentials, PII patterns (emails, SSNs, phone numbers, credit cards), and data exfiltration risks.

### ⚙️ API Misuse Detection — 13 Patterns

Flags `eval()` / `exec()` / `new Function()` of AI responses (RCE risk), `innerHTML` from AI output (XSS), API keys in URL query parameters, client-side AI SDK instantiation, missing timeouts, SQL queries built from AI completions, retry without exponential backoff, unclosed streams, and missing rate limiting.

---

## How It Works

Once installed, the extension activates automatically for **JavaScript**, **TypeScript**, **Python**, **JSON**, **YAML**, **Markdown**, and **Plain Text** files. No setup required.

### ① Real-Time Diagnostics

Security issues appear as **red squiggly underlines** (critical) and **yellow underlines** (warnings) directly in your editor — just like syntax errors. All findings also show in the **Problems** panel.

> Scanning triggers on file open, on save, and as you type (500ms debounce).

### ② CodeLens Badges

Severity badges appear **above** every flagged line:

- 🔴 **CRITICAL** — Immediate security risk
- 🟡 **WARNING** — Potential vulnerability
- 🔵 **INFO** — Worth reviewing

Click any badge to open a detailed risk explanation with fix suggestions.

### ③ Hover Details

Hover over any flagged code to see a rich tooltip containing:

- **What** the risk is
- **Why** it's dangerous (with real-world examples)
- **How** to fix it (concrete code suggestions)

### ④ Security Report Dashboard

Open the interactive dashboard via the Command Palette:

```
AI Security Scanner: Show Security Report
```

The dashboard provides:

- Summary stats (critical / warning / info counts)
- Filter by severity or category
- Click any finding to jump to the exact file and line
- Export reports as **JSON** or **Markdown**

### ⑤ Status Bar Indicator

A persistent status bar item shows the current scan state:

- `🛡️ AI-SEC: ✅ Clean` — No issues detected
- `🛡️ AI-SEC: 3 critical, 5 warnings` — Click to open the report

---

## Quick Start

1. **Install** the extension from the Marketplace
2. **Open** any project containing AI/LLM code
3. **See** issues highlighted instantly — no configuration needed

That's it. Zero setup, zero config, zero telemetry.

---

## Commands

Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and type:

| Command | What it does |
|---------|-------------|
| **AI Security Scanner: Scan Current File** | Run a scan on the active file |
| **AI Security Scanner: Scan Entire Workspace** | Scan all supported files in the workspace |
| **AI Security Scanner: Show Security Report** | Open the interactive security dashboard |
| **AI Security Scanner: Clear All Findings** | Clear all diagnostics and findings |
| **AI Security Scanner: Open Settings** | Jump to extension settings |

---

## Configuration

All settings are optional. The extension works out of the box with sensible defaults.

| Setting | Default | Description |
|---------|---------|-------------|
| `aiSecurityScanner.enableOnSave` | `true` | Scan files automatically on save |
| `aiSecurityScanner.enableRealTime` | `true` | Scan as you type (500ms debounce) |
| `aiSecurityScanner.scanWorkspaceOnStart` | `false` | Scan entire workspace on startup |
| `aiSecurityScanner.ignoredPaths` | `["node_modules", ".git", "dist"]` | Paths to exclude |
| `aiSecurityScanner.severityThreshold` | `"info"` | Minimum severity: `critical`, `warning`, or `info` |
| `aiSecurityScanner.customPatterns` | `[]` | User-defined detection patterns |

### Adding Custom Patterns

Define your own detection rules in `settings.json`:

```json
{
  "aiSecurityScanner.customPatterns": [
    {
      "name": "Internal API Key",
      "pattern": "myapp-key-[a-z0-9]{32}",
      "category": "data-leakage",
      "severity": "critical",
      "message": "Internal API key detected in source code",
      "fix": "Move this key to environment variables or a secrets manager"
    }
  ]
}
```

---

## Detection Pattern Reference

<details>
<summary><strong>💉 Prompt Injection — 17 Patterns (PI-001 → PI-017)</strong></summary>

| ID | What It Detects | Severity |
|----|----------------|----------|
| PI-001 | `ignore previous instructions` | 🔴 Critical |
| PI-002 | `disregard system prompt` | 🔴 Critical |
| PI-003 | Identity reassignment (`you are now a different...`) | 🔴 Critical |
| PI-004 | DAN / persona jailbreak (`act as DAN`) | 🔴 Critical |
| PI-005 | Instruction replacement (`your new instructions are`) | 🔴 Critical |
| PI-006 | Memory wipe (`forget everything you know`) | 🔴 Critical |
| PI-007 | Guideline bypass (`override your guidelines`) | 🔴 Critical |
| PI-008 | Persistent injection (`from now on you must`) | 🔴 Critical |
| PI-009 | Persona declaration (`new persona:`) | 🔴 Critical |
| PI-010 | Jailbreak keyword reference | 🟡 Warning |
| PI-011 | Restriction removal (`pretend you have no restrictions`) | 🔴 Critical |
| PI-012 | Hidden zero-width Unicode characters | 🔴 Critical |
| PI-013 | HTML comments with AI directives | 🟡 Warning |
| PI-014 | Unsanitized JS template literal in prompt | 🟡 Warning |
| PI-015 | Unsanitized Python f-string in prompt | 🟡 Warning |
| PI-016 | System prompt loaded from external file/URL | 🟡 Warning |
| PI-017 | System prompt from environment variable | 🟡 Warning |

</details>

<details>
<summary><strong>🔓 Data Leakage — 15 Patterns (DL-001 → DL-015)</strong></summary>

| ID | What It Detects | Severity |
|----|----------------|----------|
| DL-001 | Hardcoded OpenAI API key (`sk-...`) | 🔴 Critical |
| DL-002 | Hardcoded Anthropic API key (`sk-ant-...`) | 🔴 Critical |
| DL-003 | Hardcoded Google API key (`AIza...`) | 🔴 Critical |
| DL-004 | Hardcoded AWS Access Key (`AKIA...`) | 🔴 Critical |
| DL-005 | Hardcoded HuggingFace token (`hf_...`) | 🔴 Critical |
| DL-006 | Private key block in source code | 🔴 Critical |
| DL-007 | Secret value in credential-named variable | 🔴 Critical |
| DL-008 | Database connection string with credentials | 🔴 Critical |
| DL-009 | Email address (PII risk in AI context) | 🟡 Warning |
| DL-010 | Social Security Number pattern | 🟡 Warning |
| DL-011 | Phone number pattern | 🔵 Info |
| DL-012 | Credit card number pattern | 🔴 Critical |
| DL-013 | AI response sent to external endpoint | 🟡 Warning |
| DL-014 | AI response logged to console | 🔵 Info |
| DL-015 | User data object spread into AI messages | 🟡 Warning |

</details>

<details>
<summary><strong>⚙️ API Misuse — 13 Patterns (AM-001 → AM-013)</strong></summary>

| ID | What It Detects | Severity |
|----|----------------|----------|
| AM-001 | API key read from URL query parameters | 🔴 Critical |
| AM-002 | AI SDK with client-side API key source | 🔴 Critical |
| AM-003 | AI API call without timeout/abort | 🟡 Warning |
| AM-004 | `eval()` of AI response (RCE) | 🔴 Critical |
| AM-005 | `exec()` of AI response (command injection) | 🔴 Critical |
| AM-006 | `new Function()` from AI response | 🔴 Critical |
| AM-007 | `innerHTML` from AI response (XSS) | 🔴 Critical |
| AM-008 | File write from AI response | 🔴 Critical |
| AM-009 | Shell command from AI response | 🔴 Critical |
| AM-010 | SQL query from AI response | 🔴 Critical |
| AM-011 | Retry without exponential backoff | 🟡 Warning |
| AM-012 | Streaming response not properly closed | 🟡 Warning |
| AM-013 | No rate limiting on AI API route | 🟡 Warning |

</details>

---

## Supported Languages

| Language | Extensions |
|----------|-----------|
| JavaScript | `.js`, `.jsx` |
| TypeScript | `.ts`, `.tsx` |
| Python | `.py` |
| JSON | `.json` |
| YAML | `.yaml`, `.yml` |
| Markdown | `.md` |
| Plain Text | `.txt`, `.env` |

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  VS Code Editor                  │
│                                                  │
│    On Type (500ms)  ·  On Save  ·  On Open       │
│              │            │           │          │
│              └────────────┼───────────┘          │
│                           ▼                      │
│               ┌───────────────────┐              │
│               │  Scanner Engine   │              │
│               │                   │              │
│               │  · Prompt Inj.    │              │
│               │  · Data Leakage   │              │
│               │  · API Misuse     │              │
│               │  · Custom Rules   │              │
│               └─────────┬─────────┘              │
│                         ▼                        │
│   ┌──────────────────────────────────────────┐   │
│   │             Findings[]                   │   │
│   └──┬──────┬───────┬───────┬──────┬────────┘   │
│      ▼      ▼       ▼       ▼      ▼            │
│   Problems CodeLens Hover  Status  Report        │
│    Panel   Badges   Tips    Bar   Dashboard      │
└─────────────────────────────────────────────────┘
```

All analysis runs **locally** using precompiled regex patterns. No network calls. No external APIs. No cloud processing.

---

## Privacy & Security

**This extension collects absolutely zero telemetry.**

| Guarantee | Detail |
|-----------|--------|
| 🏠 **100% Local** | All scanning runs entirely on your machine |
| 🚫 **No Network** | Zero HTTP requests, zero WebSocket connections |
| 📊 **No Analytics** | No usage tracking, no crash reports |
| 📦 **No Dependencies** | Zero runtime npm dependencies |
| 🔓 **Open Source** | Full source code available for audit |

This is an architectural guarantee, not a policy — the extension literally has no code to make network requests.

---

## Why AI Security Scanner?

| Concern | Traditional SAST | AI Security Scanner |
|---------|-----------------|-------------------|
| Prompt injection | ❌ Not detected | ✅ 17 patterns |
| AI API key leakage | ⚠️ Generic secret scanning | ✅ Provider-specific (OpenAI, Anthropic, Google, AWS, HF) |
| eval() of AI output | ❌ Not AI-context-aware | ✅ Detects AI response in eval/exec |
| PII in prompts | ❌ No AI context | ✅ Flags PII near prompt construction |
| Real-time feedback | ⚠️ CI/CD only | ✅ Instant, as-you-type |
| Privacy | ⚠️ Cloud-based | ✅ 100% offline |

---

## Release Notes

### 1.0.0

- 🔍 **45+ detection patterns** across three threat engines
- 🔴 Real-time inline diagnostics with Problems panel integration
- 🏷️ CodeLens severity badges with click-to-detail
- 💬 Rich hover tooltips with risk explanations and fix suggestions
- 📊 Interactive security report dashboard with filtering and export
- 📊 Live status bar indicator
- ⚙️ Full configurability: severity thresholds, ignored paths, custom patterns
- 🔒 Zero telemetry, zero dependencies, fully local analysis

---

## Feedback & Issues

Found a bug or have a feature request? [Open an issue on GitHub](https://github.com/ontedduabhishakereddy/AI-Security-Scanner/issues).

---

<p align="center">
  <strong>AI Security Scanner</strong><br/>
  <em>Because AI security starts in the IDE.</em><br/><br/>
  <img src="https://img.shields.io/badge/Made%20for-VS%20Code-007ACC?style=flat-square&logo=visual-studio-code" alt="Made for VS Code" />
</p>
