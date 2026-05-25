/**
 * AI Security Scanner — Hover Provider
 * 
 * Shows detailed risk information when hovering over flagged code.
 */

import * as vscode from 'vscode';
import { Finding, Severity } from '../types';

/** Store of current findings indexed by file URI */
const hoverFindingsStore: Map<string, Finding[]> = new Map();

export class SecurityHoverProvider implements vscode.HoverProvider {
    /**
     * Update the findings for a file.
     */
    public updateFindings(uri: vscode.Uri, findings: Finding[]): void {
        hoverFindingsStore.set(uri.toString(), findings);
    }

    /**
     * Clear findings.
     */
    public clearFindings(uri?: vscode.Uri): void {
        if (uri) {
            hoverFindingsStore.delete(uri.toString());
        } else {
            hoverFindingsStore.clear();
        }
    }

    provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken
    ): vscode.Hover | undefined {
        const findings = hoverFindingsStore.get(document.uri.toString());
        if (!findings || findings.length === 0) {
            return undefined;
        }

        // Find findings that overlap with the hover position
        const matchingFindings = findings.filter(finding => {
            if (finding.line !== position.line) {
                return false;
            }
            return position.character >= finding.column &&
                   position.character <= finding.column + finding.length;
        });

        if (matchingFindings.length === 0) {
            return undefined;
        }

        const contents = matchingFindings.map(finding => {
            return buildHoverContent(finding);
        });

        const range = new vscode.Range(
            new vscode.Position(matchingFindings[0].line, matchingFindings[0].column),
            new vscode.Position(
                matchingFindings[0].line,
                matchingFindings[0].column + matchingFindings[0].length
            )
        );

        return new vscode.Hover(contents, range);
    }
}

/**
 * Build rich Markdown content for hover display.
 */
function buildHoverContent(finding: Finding): vscode.MarkdownString {
    const severityIcon = finding.severity === Severity.CRITICAL ? '🔴' :
                         finding.severity === Severity.WARNING ? '🟡' : '🔵';

    const md = new vscode.MarkdownString();
    md.isTrusted = true;
    md.supportHtml = true;

    md.appendMarkdown(`### ${severityIcon} AI Security Scanner — ${finding.id}\n\n`);
    md.appendMarkdown(`**${finding.title}**\n\n`);
    md.appendMarkdown(`**Category:** ${finding.category} &nbsp;|&nbsp; `);
    md.appendMarkdown(`**Severity:** ${finding.severity.toUpperCase()}\n\n`);
    md.appendMarkdown(`---\n\n`);

    md.appendMarkdown(`#### ⚠️ Risk\n`);
    md.appendMarkdown(`${finding.message}\n\n`);

    md.appendMarkdown(`#### 💥 Why It's Dangerous\n`);
    md.appendMarkdown(`${finding.explanation}\n\n`);

    md.appendMarkdown(`#### ✅ How to Fix\n`);
    md.appendMarkdown(`\`\`\`\n${finding.fix}\n\`\`\`\n\n`);

    md.appendMarkdown(`---\n`);
    md.appendMarkdown(`*AI Security Scanner — Zero telemetry, fully local analysis*`);

    return md;
}
