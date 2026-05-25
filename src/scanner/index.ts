/**
 * AI Security Scanner — Scanner Orchestrator
 * 
 * Combines all three detection engines and manages custom patterns.
 */

import * as vscode from 'vscode';
import { Finding, ScanResult, WorkspaceScanResult, Severity, Category, CustomPattern } from '../types';
import { getConfiguration, filterBySeverity, getWorkspaceFiles, getLanguageFromExtension, safeReadFile } from '../utils';
import { scanForPromptInjection } from './promptInjection';
import { scanForDataLeakage } from './dataLeakage';
import { scanForApiMisuse } from './apiMisuse';

/**
 * Scan a single document for all AI security risks.
 */
export function scanDocument(document: vscode.TextDocument): ScanResult {
    const startTime = Date.now();
    const text = document.getText();
    const filePath = document.uri.fsPath;
    const languageId = document.languageId;

    try {
        const findings: Finding[] = [
            ...scanForPromptInjection(text, filePath, languageId),
            ...scanForDataLeakage(text, filePath, languageId),
            ...scanForApiMisuse(text, filePath, languageId),
            ...scanCustomPatterns(text, filePath),
        ];

        const config = getConfiguration();
        const filtered = filterBySeverity(findings, config.severityThreshold) as Finding[];

        return {
            filePath,
            findings: filtered,
            scanTimeMs: Date.now() - startTime,
            success: true,
        };
    } catch (error) {
        return {
            filePath,
            findings: [],
            scanTimeMs: Date.now() - startTime,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown scanning error',
        };
    }
}

/**
 * Scan raw text content (for workspace file scanning).
 */
export function scanText(text: string, filePath: string, languageId?: string): ScanResult {
    const startTime = Date.now();
    try {
        const findings: Finding[] = [
            ...scanForPromptInjection(text, filePath, languageId),
            ...scanForDataLeakage(text, filePath, languageId),
            ...scanForApiMisuse(text, filePath, languageId),
            ...scanCustomPatterns(text, filePath),
        ];

        const config = getConfiguration();
        const filtered = filterBySeverity(findings, config.severityThreshold) as Finding[];

        return {
            filePath,
            findings: filtered,
            scanTimeMs: Date.now() - startTime,
            success: true,
        };
    } catch (error) {
        return {
            filePath,
            findings: [],
            scanTimeMs: Date.now() - startTime,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown scanning error',
        };
    }
}

/**
 * Scan the entire workspace for AI security risks.
 */
export async function scanWorkspace(
    progress?: vscode.Progress<{ message?: string; increment?: number }>
): Promise<WorkspaceScanResult> {
    const startTime = Date.now();
    const config = getConfiguration();
    const files = await getWorkspaceFiles(config.ignoredPaths);

    const fileResults: ScanResult[] = [];
    let criticalCount = 0;
    let warningCount = 0;
    let infoCount = 0;

    const totalFiles = files.length;
    for (let i = 0; i < files.length; i++) {
        const uri = files[i];
        if (progress) {
            progress.report({
                message: `Scanning file ${i + 1}/${totalFiles}...`,
                increment: (1 / totalFiles) * 100,
            });
        }

        const content = await safeReadFile(uri);
        if (content === null) {
            continue;
        }

        const languageId = getLanguageFromExtension(uri.fsPath);
        const result = scanText(content, uri.fsPath, languageId);
        fileResults.push(result);

        for (const finding of result.findings) {
            switch (finding.severity) {
                case Severity.CRITICAL:
                    criticalCount++;
                    break;
                case Severity.WARNING:
                    warningCount++;
                    break;
                case Severity.INFO:
                    infoCount++;
                    break;
            }
        }
    }

    return {
        fileResults,
        totalFiles: totalFiles,
        totalFindings: criticalCount + warningCount + infoCount,
        criticalCount,
        warningCount,
        infoCount,
        totalScanTimeMs: Date.now() - startTime,
    };
}

/**
 * Scan text against user-defined custom patterns from settings.
 */
function scanCustomPatterns(text: string, filePath: string): Finding[] {
    const config = getConfiguration();
    const findings: Finding[] = [];
    const lines = text.split('\n');

    for (const custom of config.customPatterns) {
        try {
            const regex = new RegExp(custom.pattern, 'gi');
            let match: RegExpExecArray | null;
            while ((match = regex.exec(text)) !== null) {
                const { line, column } = getLineAndColumn(lines, match.index);
                findings.push({
                    id: `CUSTOM-${custom.name}`,
                    category: mapCustomCategory(custom.category),
                    severity: mapCustomSeverity(custom.severity),
                    title: custom.name,
                    message: custom.message,
                    explanation: `Custom pattern: ${custom.pattern}`,
                    fix: custom.fix || 'Review and address this custom finding.',
                    filePath,
                    line,
                    column,
                    length: match[0].length,
                    matchedText: match[0],
                });
                if (match[0].length === 0) {
                    regex.lastIndex++;
                }
            }
        } catch {
            // Invalid regex in user config — skip silently
        }
    }

    return findings;
}

function mapCustomCategory(cat: CustomPattern['category']): Category {
    switch (cat) {
        case 'prompt-injection': return Category.PROMPT_INJECTION;
        case 'data-leakage': return Category.DATA_LEAKAGE;
        case 'api-misuse': return Category.API_MISUSE;
        default: return Category.API_MISUSE;
    }
}

function mapCustomSeverity(sev: CustomPattern['severity']): Severity {
    switch (sev) {
        case 'critical': return Severity.CRITICAL;
        case 'warning': return Severity.WARNING;
        case 'info': return Severity.INFO;
        default: return Severity.INFO;
    }
}

function getLineAndColumn(lines: string[], offset: number): { line: number; column: number } {
    let remaining = offset;
    for (let i = 0; i < lines.length; i++) {
        const lineLength = lines[i].length + 1;
        if (remaining < lineLength) {
            return { line: i, column: remaining };
        }
        remaining -= lineLength;
    }
    return { line: lines.length - 1, column: 0 };
}
