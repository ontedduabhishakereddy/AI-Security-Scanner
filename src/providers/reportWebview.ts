/**
 * AI Security Scanner — Report Webview Provider
 * 
 * Renders a security dashboard in a VS Code webview panel
 * with filtering, navigation, and export functionality.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { WorkspaceScanResult, Finding } from '../types';

let currentPanel: vscode.WebviewPanel | undefined;
let latestResults: WorkspaceScanResult | undefined;

/**
 * Show or update the Security Report webview panel.
 */
export function showReportPanel(
    context: vscode.ExtensionContext,
    results?: WorkspaceScanResult
): void {
    if (results) {
        latestResults = results;
    }

    if (currentPanel) {
        currentPanel.reveal(vscode.ViewColumn.One);
        if (latestResults) {
            currentPanel.webview.postMessage({
                type: 'scanResults',
                payload: latestResults,
            });
        }
        return;
    }

    currentPanel = vscode.window.createWebviewPanel(
        'aiSecurityReport',
        '🛡️ AI Security Report',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(context.extensionPath, 'webview')),
            ],
        }
    );

    currentPanel.webview.html = getReportHtml();

    // Handle messages from the webview
    currentPanel.webview.onDidReceiveMessage(
        async (message) => {
            switch (message.type) {
                case 'jumpToFinding': {
                    const finding = message.payload as Finding;
                    const uri = vscode.Uri.file(finding.filePath);
                    try {
                        const doc = await vscode.workspace.openTextDocument(uri);
                        const editor = await vscode.window.showTextDocument(doc, vscode.ViewColumn.One);
                        const position = new vscode.Position(finding.line, finding.column);
                        editor.selection = new vscode.Selection(position, position);
                        editor.revealRange(
                            new vscode.Range(position, position),
                            vscode.TextEditorRevealType.InCenter
                        );
                    } catch {
                        vscode.window.showErrorMessage(`Could not open file: ${finding.filePath}`);
                    }
                    break;
                }
                case 'exportReport': {
                    const format = message.payload?.format as string;
                    if (latestResults) {
                        await exportReport(latestResults, format);
                    }
                    break;
                }
                case 'requestData': {
                    if (latestResults) {
                        currentPanel?.webview.postMessage({
                            type: 'scanResults',
                            payload: latestResults,
                        });
                    }
                    break;
                }
            }
        },
        undefined,
        context.subscriptions
    );

    currentPanel.onDidDispose(() => {
        currentPanel = undefined;
    });

    // Send initial data
    if (latestResults) {
        setTimeout(() => {
            currentPanel?.webview.postMessage({
                type: 'scanResults',
                payload: latestResults,
            });
        }, 500);
    }
}

/**
 * Update the report panel with new results.
 */
export function updateReportData(results: WorkspaceScanResult): void {
    latestResults = results;
    if (currentPanel) {
        currentPanel.webview.postMessage({
            type: 'scanResults',
            payload: results,
        });
    }
}

/**
 * Export scan results to a file.
 */
async function exportReport(results: WorkspaceScanResult, format: string): Promise<void> {
    let content: string;
    let defaultFileName: string;

    if (format === 'json') {
        content = JSON.stringify(results, null, 2);
        defaultFileName = 'ai-security-report.json';
    } else {
        content = generateMarkdownReport(results);
        defaultFileName = 'ai-security-report.md';
    }

    const uri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(defaultFileName),
        filters: format === 'json'
            ? { 'JSON': ['json'] }
            : { 'Markdown': ['md'] },
    });

    if (uri) {
        await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf-8'));
        vscode.window.showInformationMessage(`Report exported to ${uri.fsPath}`);
    }
}

/**
 * Generate a Markdown report from scan results.
 */
function generateMarkdownReport(results: WorkspaceScanResult): string {
    const lines: string[] = [
        '# 🛡️ AI Security Scanner Report',
        '',
        `**Generated:** ${new Date().toISOString()}`,
        '',
        '## Summary',
        '',
        `| Metric | Value |`,
        `|--------|-------|`,
        `| Files Scanned | ${results.totalFiles} |`,
        `| Total Findings | ${results.totalFindings} |`,
        `| 🔴 Critical | ${results.criticalCount} |`,
        `| 🟡 Warning | ${results.warningCount} |`,
        `| 🔵 Info | ${results.infoCount} |`,
        `| Scan Time | ${results.totalScanTimeMs}ms |`,
        '',
        '## Findings',
        '',
    ];

    for (const fileResult of results.fileResults) {
        if (fileResult.findings.length === 0) {
            continue;
        }
        lines.push(`### 📁 ${fileResult.filePath}`);
        lines.push('');

        for (const finding of fileResult.findings) {
            const icon = finding.severity === 'critical' ? '🔴' : finding.severity === 'warning' ? '🟡' : '🔵';
            lines.push(`#### ${icon} ${finding.id} — ${finding.title}`);
            lines.push('');
            lines.push(`- **Severity:** ${finding.severity.toUpperCase()}`);
            lines.push(`- **Category:** ${finding.category}`);
            lines.push(`- **Line:** ${finding.line + 1}`);
            lines.push(`- **Message:** ${finding.message}`);
            lines.push(`- **Fix:** ${finding.fix}`);
            lines.push('');
        }
    }

    return lines.join('\n');
}

function getReportHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI Security Report</title>
<style>
:root {
    --bg-primary: #0d1117;
    --bg-secondary: #161b22;
    --bg-tertiary: #21262d;
    --text-primary: #e6edf3;
    --text-secondary: #8b949e;
    --border: #30363d;
    --accent-blue: #58a6ff;
    --accent-purple: #bc8cff;
    --critical: #ff4444;
    --warning: #f0ad4e;
    --info: #58a6ff;
    --success: #3fb950;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
    background: var(--bg-primary);
    color: var(--text-primary);
    line-height: 1.6;
    padding: 24px;
}
.header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border);
}
.header h1 {
    font-size: 24px;
    font-weight: 700;
    background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}
.export-buttons { display: flex; gap: 8px; }
.btn {
    padding: 8px 16px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--bg-secondary);
    color: var(--text-primary);
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s;
}
.btn:hover { background: var(--bg-tertiary); border-color: var(--accent-blue); }
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
}
.stat-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    transition: transform 0.2s, border-color 0.2s;
}
.stat-card:hover { transform: translateY(-2px); border-color: var(--accent-blue); }
.stat-value { font-size: 36px; font-weight: 700; margin-bottom: 4px; }
.stat-label { font-size: 13px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
.stat-critical .stat-value { color: var(--critical); }
.stat-warning .stat-value { color: var(--warning); }
.stat-info .stat-value { color: var(--info); }
.stat-files .stat-value { color: var(--accent-purple); }
.stat-clean .stat-value { color: var(--success); }
.filters {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    flex-wrap: wrap;
}
.filter-btn {
    padding: 6px 14px;
    border: 1px solid var(--border);
    border-radius: 20px;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s;
}
.filter-btn.active { background: var(--accent-blue); color: white; border-color: var(--accent-blue); }
.filter-btn:hover { border-color: var(--accent-blue); color: var(--text-primary); }
.findings-list { display: flex; flex-direction: column; gap: 8px; }
.finding-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.2s;
    border-left: 3px solid transparent;
}
.finding-card:hover { background: var(--bg-tertiary); transform: translateX(4px); }
.finding-card.critical { border-left-color: var(--critical); }
.finding-card.warning { border-left-color: var(--warning); }
.finding-card.info { border-left-color: var(--info); }
.finding-header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.finding-severity {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
}
.finding-severity.critical { background: rgba(255,68,68,0.15); color: var(--critical); }
.finding-severity.warning { background: rgba(240,173,78,0.15); color: var(--warning); }
.finding-severity.info { background: rgba(88,166,255,0.15); color: var(--info); }
.finding-id { color: var(--text-secondary); font-size: 12px; font-family: monospace; }
.finding-title { font-weight: 600; font-size: 14px; }
.finding-message { color: var(--text-secondary); font-size: 13px; margin-top: 4px; }
.finding-meta { display: flex; gap: 16px; margin-top: 8px; font-size: 12px; color: var(--text-secondary); }
.empty-state {
    text-align: center;
    padding: 60px 20px;
    color: var(--text-secondary);
}
.empty-state .icon { font-size: 64px; margin-bottom: 16px; }
.empty-state h2 { font-size: 20px; color: var(--text-primary); margin-bottom: 8px; }
.loading { text-align: center; padding: 40px; color: var(--text-secondary); }
</style>
</head>
<body>
<div class="header">
    <h1>🛡️ AI Security Report</h1>
    <div class="export-buttons">
        <button class="btn" onclick="exportReport('json')">📦 Export JSON</button>
        <button class="btn" onclick="exportReport('markdown')">📝 Export Markdown</button>
    </div>
</div>

<div id="stats" class="stats-grid">
    <div class="stat-card stat-files"><div class="stat-value" id="totalFiles">-</div><div class="stat-label">Files Scanned</div></div>
    <div class="stat-card stat-critical"><div class="stat-value" id="criticalCount">-</div><div class="stat-label">Critical</div></div>
    <div class="stat-card stat-warning"><div class="stat-value" id="warningCount">-</div><div class="stat-label">Warnings</div></div>
    <div class="stat-card stat-info"><div class="stat-value" id="infoCount">-</div><div class="stat-label">Info</div></div>
</div>

<div class="filters">
    <button class="filter-btn active" data-filter="all" onclick="setFilter('all', this)">All</button>
    <button class="filter-btn" data-filter="critical" onclick="setFilter('critical', this)">🔴 Critical</button>
    <button class="filter-btn" data-filter="warning" onclick="setFilter('warning', this)">🟡 Warning</button>
    <button class="filter-btn" data-filter="info" onclick="setFilter('info', this)">🔵 Info</button>
    <button class="filter-btn" data-filter="Prompt Injection" onclick="setFilter('Prompt Injection', this)">💉 Prompt Injection</button>
    <button class="filter-btn" data-filter="Data Leakage" onclick="setFilter('Data Leakage', this)">🔓 Data Leakage</button>
    <button class="filter-btn" data-filter="API Misuse" onclick="setFilter('API Misuse', this)">⚙️ API Misuse</button>
</div>

<div id="findings" class="findings-list">
    <div class="empty-state">
        <div class="icon">🛡️</div>
        <h2>No scan results yet</h2>
        <p>Run "AI Security Scanner: Scan Entire Workspace" to get started.</p>
    </div>
</div>

<script>
const vscode = acquireVsCodeApi();
let allFindings = [];
let currentFilter = 'all';

window.addEventListener('message', event => {
    const message = event.data;
    if (message.type === 'scanResults') {
        renderResults(message.payload);
    }
});

// Request data on load
vscode.postMessage({ type: 'requestData' });

function renderResults(results) {
    document.getElementById('totalFiles').textContent = results.totalFiles;
    document.getElementById('criticalCount').textContent = results.criticalCount;
    document.getElementById('warningCount').textContent = results.warningCount;
    document.getElementById('infoCount').textContent = results.infoCount;

    allFindings = [];
    for (const fileResult of results.fileResults) {
        for (const finding of fileResult.findings) {
            allFindings.push(finding);
        }
    }

    renderFindings();
}

function renderFindings() {
    const container = document.getElementById('findings');
    let filtered = allFindings;

    if (currentFilter !== 'all') {
        filtered = allFindings.filter(f =>
            f.severity === currentFilter || f.category === currentFilter
        );
    }

    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="icon">✅</div><h2>No findings</h2><p>No issues match the current filter.</p></div>';
        return;
    }

    container.innerHTML = filtered.map(finding => {
        const fileName = finding.filePath.split('/').pop() || finding.filePath.split('\\\\').pop();
        return '<div class="finding-card ' + finding.severity + '" onclick=\\'jumpTo(' + JSON.stringify(JSON.stringify(finding)) + ')\\'>' +
            '<div class="finding-header">' +
                '<span class="finding-severity ' + finding.severity + '">' + finding.severity + '</span>' +
                '<span class="finding-id">' + finding.id + '</span>' +
                '<span class="finding-title">' + escapeHtml(finding.title) + '</span>' +
            '</div>' +
            '<div class="finding-message">' + escapeHtml(finding.message) + '</div>' +
            '<div class="finding-meta">' +
                '<span>📁 ' + escapeHtml(fileName) + '</span>' +
                '<span>📍 Line ' + (finding.line + 1) + '</span>' +
                '<span>📂 ' + escapeHtml(finding.category) + '</span>' +
            '</div>' +
        '</div>';
    }).join('');
}

function setFilter(filter, btn) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderFindings();
}

function jumpTo(findingJson) {
    const finding = JSON.parse(findingJson);
    vscode.postMessage({ type: 'jumpToFinding', payload: finding });
}

function exportReport(format) {
    vscode.postMessage({ type: 'exportReport', payload: { format } });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
</script>
</body>
</html>`;
}
