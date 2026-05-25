# 🚀 Publishing Guide — AI Security Scanner

Complete step-by-step guide to publish your VS Code extension to the Marketplace and Open VSX Registry.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Create a Marketplace Publisher Account](#2-create-a-marketplace-publisher-account)
3. [Generate a Personal Access Token (PAT)](#3-generate-a-personal-access-token-pat)
4. [Update Extension Metadata](#4-update-extension-metadata)
5. [Package the Extension](#5-package-the-extension)
6. [Publish to VS Code Marketplace](#6-publish-to-vs-code-marketplace)
7. [Publish to Open VSX Registry](#7-publish-to-open-vsx-registry)
8. [Post-Publish Checklist](#8-post-publish-checklist)
9. [Updating Your Extension](#9-updating-your-extension)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Prerequisites

Make sure you have the following installed:

```bash
# Node.js (16+)
node --version

# npm (8+)
npm --version

# Install vsce globally (VS Code Extension CLI)
npm install -g @vscode/vsce

# Verify vsce
vsce --version
```

Also ensure your extension compiles and tests pass:

```bash
cd ai-security-scanner
npm install
npm run compile
npm test
```

---

## 2. Create a Marketplace Publisher Account

### Step 1: Create an Azure DevOps Organization

1. Go to **[https://dev.azure.com](https://dev.azure.com)**
2. Sign in with your Microsoft account (create one if needed)
3. Create a new organization (e.g., `your-username-org`)
4. You don't need to create any projects — just the organization

### Step 2: Create a Publisher

1. Go to **[https://marketplace.visualstudio.com/manage](https://marketplace.visualstudio.com/manage)**
2. Sign in with the same Microsoft account
3. Click **"Create Publisher"**
4. Fill in the form:
   - **Name**: Your display name (e.g., "Abhijeet Dey")
   - **ID**: A unique publisher ID (e.g., `abhijeetdey`) — this goes in `package.json`
   - **Description**: Brief bio
   - **Website**: Your website or GitHub profile
5. Click **Create**

> ⚠️ **Remember your Publisher ID** — you'll need to put it in `package.json`.

---

## 3. Generate a Personal Access Token (PAT)

### Step 1: Go to Azure DevOps Token Page

1. Go to **[https://dev.azure.com](https://dev.azure.com)**
2. Click your profile icon (top-right) → **Personal Access Tokens**
3. Click **"+ New Token"**

### Step 2: Configure the Token

| Setting | Value |
|---------|-------|
| **Name** | `vscode-marketplace-publish` |
| **Organization** | Select **"All accessible organizations"** |
| **Expiration** | Choose your preferred duration (max 1 year) |
| **Scopes** | Click **"Custom defined"** → **"Marketplace"** → Check ✅ **"Manage"** |

> ⚠️ **CRITICAL**: You MUST select "All accessible organizations" and the Marketplace → Manage scope. Without these, publishing will fail with a `401 Unauthorized` error.

### Step 3: Create and Save

1. Click **"Create"**
2. **COPY THE TOKEN IMMEDIATELY** — you won't see it again!
3. Store it securely (password manager recommended)

---

## 4. Update Extension Metadata

Before publishing, update `package.json` with your actual details:

```json
{
  "publisher": "YOUR_ACTUAL_PUBLISHER_ID",
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR_USERNAME/ai-security-scanner"
  }
}
```

### Replace these placeholders:

| Placeholder | Replace With |
|-------------|-------------|
| `YOUR_PUBLISHER_ID` | Your Marketplace publisher ID (from Step 2) |
| `YOUR_USERNAME` | Your GitHub username |

### Verify the icon

Make sure `icon.png` is at the root level and is **128×128 pixels**:

```bash
# Check icon exists
ls -la icon.png

# If on macOS, verify dimensions
sips -g pixelHeight -g pixelWidth icon.png
```

---

## 5. Package the Extension

### Build and package:

```bash
# Compile TypeScript
npm run compile

# Package into .vsix file
vsce package
```

This creates `ai-security-scanner-1.0.0.vsix` in your project directory.

### Test the packaged extension locally:

```bash
# Install the .vsix in your VS Code
code --install-extension ai-security-scanner-1.0.0.vsix
```

1. Open a test project with some JavaScript/Python files
2. Verify diagnostics appear for known patterns
3. Test all command palette commands
4. Check the status bar indicator
5. Open the Security Report webview

---

## 6. Publish to VS Code Marketplace

### Option A: Interactive login + publish

```bash
# Login with your PAT (you'll be prompted for the token)
vsce login YOUR_PUBLISHER_ID

# Publish
vsce publish
```

### Option B: Publish directly with PAT

```bash
# One-command publish (use your actual PAT)
vsce publish -p YOUR_PERSONAL_ACCESS_TOKEN
```

### Option C: Publish with version bump

```bash
# Publish with automatic version increment
vsce publish minor    # 1.0.0 → 1.1.0
vsce publish patch    # 1.0.0 → 1.0.1
vsce publish major    # 1.0.0 → 2.0.0
```

### Verify publication:

After publishing, your extension will be available at:
```
https://marketplace.visualstudio.com/items?itemName=YOUR_PUBLISHER_ID.ai-security-scanner
```

> ⏱️ **Note**: It may take **5-10 minutes** for the extension to appear in the Marketplace search results.

---

## 7. Publish to Open VSX Registry

The [Open VSX Registry](https://open-vsx.org/) is used by Gitpod, VSCodium, Theia, and other open-source VS Code alternatives.

### Step 1: Create an Open VSX Account

1. Go to **[https://open-vsx.org](https://open-vsx.org)**
2. Sign in with your **GitHub account**
3. Go to **Settings** → **Access Tokens**
4. Create a new access token with publish permissions

### Step 2: Install ovsx CLI

```bash
npm install -g ovsx
```

### Step 3: Publish

```bash
# Using the .vsix file you already created
ovsx publish ai-security-scanner-1.0.0.vsix -p YOUR_OPENVSX_TOKEN
```

Or publish directly from source:

```bash
ovsx publish -p YOUR_OPENVSX_TOKEN
```

### Verify:

Your extension will be at:
```
https://open-vsx.org/extension/YOUR_PUBLISHER_ID/ai-security-scanner
```

---

## 8. Post-Publish Checklist

After publishing, verify everything looks correct on the Marketplace page:

### ✅ Marketplace Page Checks

- [ ] **Icon** displays correctly (128×128, shield-with-AI-chip design)
- [ ] **Display name** shows "AI Security Scanner"
- [ ] **Description** is visible and compelling
- [ ] **Gallery banner** shows dark theme (`#0D1117`)
- [ ] **Categories** show "Linters" and "Other"
- [ ] **Keywords** are indexed (search for "prompt injection" and "AI security")
- [ ] **README** renders correctly with badges, tables, and architecture diagram
- [ ] **CHANGELOG** is visible in the "Changelog" tab
- [ ] **License** shows MIT in the sidebar
- [ ] **Repository** link points to correct GitHub URL

### ✅ Functional Checks

- [ ] Install the extension from Marketplace (not local .vsix)
- [ ] Open a JavaScript/TypeScript/Python project
- [ ] Verify real-time diagnostics appear for known patterns
- [ ] Test "Scan Current File" command
- [ ] Test "Scan Entire Workspace" command
- [ ] Test "Show Security Report" webview
- [ ] Test "Clear All Findings" command
- [ ] Verify status bar shows correct counts
- [ ] Test hover information on flagged code
- [ ] Test CodeLens badges above flagged lines

### ✅ SEO Checks

- [ ] Search "AI security scanner" on Marketplace — verify it appears
- [ ] Search individual keywords: "prompt injection", "data leakage", "API misuse"
- [ ] Check that the extension appears in the "Linters" category page

---

## 9. Updating Your Extension

### Publish a new version:

1. Update `CHANGELOG.md` with new changes
2. Bump version in `package.json` (or let vsce do it):

```bash
# Automatic version bump + publish
vsce publish patch   # 1.0.0 → 1.0.1

# Or manual:
# 1. Edit version in package.json
# 2. Run:
vsce publish
```

### Update on Open VSX too:

```bash
vsce package
ovsx publish ai-security-scanner-X.Y.Z.vsix -p YOUR_OPENVSX_TOKEN
```

---

## 10. Troubleshooting

### Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `401 Unauthorized` | PAT expired or wrong scopes | Regenerate PAT with "All organizations" + Marketplace Manage |
| `Publisher not found` | Publisher ID mismatch | Check `publisher` in package.json matches your Marketplace publisher |
| `Missing icon` | Icon not found at specified path | Ensure `icon.png` exists at project root |
| `Proposed API` | Using proposed VS Code APIs | Remove proposed API usage or add `enabledApiProposals` |
| `VSIX too large` | Package exceeds 200MB | Check `.vscodeignore` excludes `node_modules`, `.git`, test fixtures |
| `Cannot find module` | Missing dependency | Run `npm install` and `npm run compile` before packaging |

### Check package contents:

```bash
# See what files would be included in the .vsix
vsce ls
```

### Verify `.vscodeignore` is working:

The `.vsix` should NOT contain:
- `node_modules/`
- `src/` (only `out/` should be included)
- `.git/`
- Test files
- `.vscode/` settings

---

## Quick Reference Commands

```bash
# Full publish workflow:
npm install
npm run compile
npm test
vsce package
vsce publish -p YOUR_PAT

# Verify extension locally before publishing:
code --install-extension ai-security-scanner-1.0.0.vsix

# Check what's in the package:
vsce ls

# Unpublish (emergency only!):
vsce unpublish YOUR_PUBLISHER_ID.ai-security-scanner
```

---

## 🎉 Congratulations!

Your AI Security Scanner extension is now available for the entire VS Code community! Share it on:

- **Twitter/X**: "Just published AI Security Scanner for VS Code — catches prompt injection, data leakage, and API misuse in your AI code 🛡️"
- **Reddit**: Post to r/vscode, r/programming, r/artificialintelligence
- **Hacker News**: Submit a Show HN post
- **LinkedIn**: Professional announcement
- **Dev.to / Medium**: Write a blog post about why AI-specific security scanning matters

---

*Built with 🛡️ for the developer security community*
