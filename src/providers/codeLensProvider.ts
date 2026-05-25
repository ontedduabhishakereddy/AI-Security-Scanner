/**
 * AI Security Scanner — CodeLens Provider
 * 
 * Shows severity badges and summaries above flagged lines.
 */

import * as vscode from 'vscode';
import { Finding, Severity } from '../types';

/** Store of current findings indexed by file URI */
const findingsStore: Map<string, Finding[]> = new Map();

export class SecurityCodeLensProvider implements vscode.CodeLensProvider {
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

    /**
     * Update the findings for a file and refresh CodeLens.
     */
    public updateFindings(uri: vscode.Uri, findings: Finding[]): void {
        findingsStore.set(uri.toString(), findings);
        this._onDidChangeCodeLenses.fire();
    }

    /**
     * Clear findings for a specific file.
     */
    public clearFindings(uri?: vscode.Uri): void {
        if (uri) {
            findingsStore.delete(uri.toString());
        } else {
            findingsStore.clear();
        }
        this._onDidChangeCodeLenses.fire();
    }

    provideCodeLenses(
        document: vscode.TextDocument,
        _token: vscode.CancellationToken
    ): vscode.CodeLens[] {
        const findings = findingsStore.get(document.uri.toString());
        if (!findings || findings.length === 0) {
            return [];
        }

        // Group findings by line to avoid duplicate CodeLens on the same line
        const lineMap = new Map<number, Finding[]>();
        for (const finding of findings) {
            const existing = lineMap.get(finding.line) || [];
            existing.push(finding);
            lineMap.set(finding.line, existing);
        }

        const codeLenses: vscode.CodeLens[] = [];
        for (const [line, lineFindings] of lineMap) {
            const range = new vscode.Range(line, 0, line, 0);

            // Count severities on this line
            const criticalCount = lineFindings.filter(f => f.severity === Severity.CRITICAL).length;
            const warningCount = lineFindings.filter(f => f.severity === Severity.WARNING).length;

            let badge: string;
            if (criticalCount > 0) {
                badge = `🔴 CRITICAL`;
            } else if (warningCount > 0) {
                badge = `🟡 WARNING`;
            } else {
                badge = `🔵 INFO`;
            }

            const summary = lineFindings.map(f => f.title).join(' | ');
            const title = `${badge} — ${summary}`;

            const codeLens = new vscode.CodeLens(range, {
                title,
                command: 'aiSecurityScanner.showFindingDetail',
                arguments: [lineFindings[0]],
                tooltip: lineFindings.map(f => `${f.id}: ${f.message}`).join('\n\n'),
            });

            codeLenses.push(codeLens);
        }

        return codeLenses;
    }
}

/**
 * Register the internal command for showing finding detail on CodeLens click.
 */
export function registerCodeLensCommands(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.commands.registerCommand('aiSecurityScanner.showFindingDetail', (finding: Finding) => {
            const panel = vscode.window.createWebviewPanel(
                'aiSecFindingDetail',
                `AI-SEC: ${finding.id}`,
                vscode.ViewColumn.Beside,
                { enableScripts: false }
            );

            panel.webview.html = getFindingDetailHtml(finding);
        })
    );
}

function getFindingDetailHtml(finding: Finding): string {
    const severityColor = finding.severity === Severity.CRITICAL ? '#ff4444' :
                          finding.severity === Severity.WARNING ? '#ffaa00' : '#4488ff';
    const severityIcon = finding.severity === Severity.CRITICAL ? '🔴' :
                         finding.severity === Severity.WARNING ? '🟡' : '🔵';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            color: var(--vscode-foreground);
            background: var(--vscode-editor-background);
            line-height: 1.6;
        }
        .header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
        .severity-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-weight: 700;
            font-size: 12px;
            color: white;
            background: ${severityColor};
        }
        .finding-id { color: var(--vscode-descriptionForeground); font-size: 14px; }
        h1 { font-size: 20px; margin: 0 0 8px 0; }
        h2 { font-size: 16px; margin: 20px 0 8px 0; color: ${severityColor}; }
        .section { margin: 16px 0; padding: 12px 16px; background: var(--vscode-textBlockQuote-background); border-radius: 8px; border-left: 3px solid ${severityColor}; }
        code { background: var(--vscode-textCodeBlock-background); padding: 2px 6px; border-radius: 4px; font-size: 13px; }
        pre { background: var(--vscode-textCodeBlock-background); padding: 12px; border-radius: 8px; overflow-x: auto; font-size: 13px; }
        .location { color: var(--vscode-descriptionForeground); font-size: 13px; }
    </style>
</head>
<body>
    <div class="header">
        <span class="severity-badge">${severityIcon} ${finding.severity.toUpperCase()}</span>
        <span class="finding-id">${finding.id}</span>
    </div>
    <h1>${escapeHtml(finding.title)}</h1>
    <p class="location">📁 Line ${finding.line + 1}, Column ${finding.column + 1}</p>
    <p><strong>Category:</strong> ${escapeHtml(finding.category)}</p>

    <h2>⚠️ What's the Risk?</h2>
    <div class="section">${escapeHtml(finding.message)}</div>

    <h2>💥 Why It's Dangerous</h2>
    <div class="section">${escapeHtml(finding.explanation)}</div>

    <h2>✅ How to Fix</h2>
    <div class="section"><pre>${escapeHtml(finding.fix)}</pre></div>

    <h2>🔍 Matched Text</h2>
    <div class="section"><code>${escapeHtml(finding.matchedText)}</code></div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
