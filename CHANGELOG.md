# Changelog

All notable changes to the "AI Security Scanner" extension will be documented in this file.

## [1.0.0] - 2025-01-15

### Added
- 🔍 **Prompt Injection Detection** — 17 patterns covering injection commands, zero-width Unicode steganography, base64 obfuscation, and structural injection risks
- 🔓 **Data Leakage Detection** — 15 patterns for hardcoded API keys (OpenAI, Anthropic, Google, AWS, HuggingFace), PII in prompts, private keys, database credentials, and exfiltration risks
- ⚙️ **API Misuse Detection** — 13 patterns for eval/exec of AI output, client-exposed keys, missing timeouts, SQL injection from AI responses, and cost abuse risks
- 📊 **Security Report Dashboard** — Interactive webview panel with filtering, severity breakdown, and click-to-navigate
- 🔴 **Real-time Diagnostics** — Inline squiggly underlines (red=critical, yellow=warning) with Problems panel integration
- 🏷️ **CodeLens Annotations** — Severity badges above flagged lines with click-to-detail
- 💬 **Hover Provider** — Rich risk explanations with fix suggestions on hover
- 📊 **Status Bar Indicator** — Live critical/warning counts with one-click report access
- 📦 **Export Reports** — JSON and Markdown export from the security dashboard
- ⚙️ **Configurable** — Severity thresholds, ignored paths, real-time scanning toggle, custom patterns
- 🔒 **Zero Telemetry** — Fully local analysis, no data sent anywhere
