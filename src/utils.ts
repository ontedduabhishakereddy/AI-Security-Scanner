/**
 * AI Security Scanner — Utility Functions
 * 
 * Debouncing, file filtering, pattern matching helpers,
 * and configuration accessors.
 */

import * as vscode from 'vscode';
import { Severity, ScannerConfiguration, CustomPattern } from './types';

/**
 * Creates a debounced version of a function.
 * The function will only execute after `delay` ms have passed
 * since the last invocation.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => void>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timer: ReturnType<typeof setTimeout> | undefined;
    return (...args: Parameters<T>) => {
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(() => {
            fn(...args);
            timer = undefined;
        }, delay);
    };
}

/** Supported language IDs for scanning */
export const SUPPORTED_LANGUAGES = new Set([
    'javascript',
    'typescript',
    'javascriptreact',
    'typescriptreact',
    'python',
    'json',
    'yaml',
    'markdown',
    'plaintext',
]);

/** File extensions mapped to language types for workspace scanning */
export const EXTENSION_TO_LANGUAGE: Record<string, string> = {
    '.js': 'javascript',
    '.jsx': 'javascriptreact',
    '.ts': 'typescript',
    '.tsx': 'typescriptreact',
    '.py': 'python',
    '.json': 'json',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.md': 'markdown',
    '.txt': 'plaintext',
    '.env': 'plaintext',
};

/**
 * Check whether a document should be scanned based on its language.
 */
export function isSupportedDocument(document: vscode.TextDocument): boolean {
    return SUPPORTED_LANGUAGES.has(document.languageId);
}

/**
 * Check whether a file path should be ignored based on configured ignore paths.
 */
export function isIgnoredPath(filePath: string, ignoredPaths: string[]): boolean {
    const normalizedPath = filePath.replace(/\\/g, '/');
    return ignoredPaths.some(ignoredSegment => {
        const normalized = ignoredSegment.replace(/\\/g, '/');
        return normalizedPath.includes(`/${normalized}/`) ||
               normalizedPath.endsWith(`/${normalized}`) ||
               normalizedPath.includes(`${normalized}/`);
    });
}

/**
 * Retrieve the scanner configuration from VS Code settings.
 */
export function getConfiguration(): ScannerConfiguration {
    const config = vscode.workspace.getConfiguration('aiSecurityScanner');
    return {
        enableOnSave: config.get<boolean>('enableOnSave', true),
        enableRealTime: config.get<boolean>('enableRealTime', true),
        scanWorkspaceOnStart: config.get<boolean>('scanWorkspaceOnStart', false),
        ignoredPaths: config.get<string[]>('ignoredPaths', ['node_modules', '.git', 'dist']),
        severityThreshold: config.get<'critical' | 'warning' | 'info'>('severityThreshold', 'info'),
        customPatterns: config.get<CustomPattern[]>('customPatterns', []),
    };
}

/**
 * Maps severity threshold to a numeric value for filtering.
 */
export function severityToNumber(severity: Severity | string): number {
    switch (severity) {
        case Severity.CRITICAL:
        case 'critical':
            return 3;
        case Severity.WARNING:
        case 'warning':
            return 2;
        case Severity.INFO:
        case 'info':
            return 1;
        default:
            return 0;
    }
}

/**
 * Filter findings based on the configured severity threshold.
 */
export function filterBySeverity(
    findings: { severity: Severity }[],
    threshold: string
): typeof findings {
    const thresholdNum = severityToNumber(threshold as Severity);
    return findings.filter(f => severityToNumber(f.severity) >= thresholdNum);
}

/**
 * Maps Severity enum to VS Code DiagnosticSeverity.
 */
export function severityToDiagnosticSeverity(severity: Severity): vscode.DiagnosticSeverity {
    switch (severity) {
        case Severity.CRITICAL:
            return vscode.DiagnosticSeverity.Error;
        case Severity.WARNING:
            return vscode.DiagnosticSeverity.Warning;
        case Severity.INFO:
            return vscode.DiagnosticSeverity.Information;
        default:
            return vscode.DiagnosticSeverity.Information;
    }
}

/**
 * Get the file extension from a path, including the dot.
 */
export function getFileExtension(filePath: string): string {
    const lastDot = filePath.lastIndexOf('.');
    if (lastDot === -1) {
        return '';
    }
    return filePath.substring(lastDot).toLowerCase();
}

/**
 * Get language ID from file extension.
 */
export function getLanguageFromExtension(filePath: string): string | undefined {
    const ext = getFileExtension(filePath);
    return EXTENSION_TO_LANGUAGE[ext];
}

/**
 * Format a count for display (e.g., "1 issue" vs "3 issues").
 */
export function pluralize(count: number, singular: string, plural?: string): string {
    return count === 1 ? `${count} ${singular}` : `${count} ${plural || singular + 's'}`;
}

/**
 * Truncate a string to a maximum length, adding ellipsis if truncated.
 */
export function truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) {
        return str;
    }
    return str.substring(0, maxLength - 3) + '...';
}

/**
 * Safely read file contents with error handling.
 */
export async function safeReadFile(uri: vscode.Uri): Promise<string | null> {
    try {
        const content = await vscode.workspace.fs.readFile(uri);
        return Buffer.from(content).toString('utf-8');
    } catch {
        return null;
    }
}

/**
 * Get all workspace files matching supported extensions, respecting ignore list.
 */
export async function getWorkspaceFiles(ignoredPaths: string[]): Promise<vscode.Uri[]> {
    const allFiles: vscode.Uri[] = [];
    const supportedExtensions = Object.keys(EXTENSION_TO_LANGUAGE);

    for (const ext of supportedExtensions) {
        const pattern = `**/*${ext}`;
        try {
            const files = await vscode.workspace.findFiles(pattern, '{' + ignoredPaths.map(p => `**/${p}/**`).join(',') + '}', 5000);
            allFiles.push(...files);
        } catch {
            // Graceful degradation if glob fails
        }
    }

    return allFiles.filter(uri => !isIgnoredPath(uri.fsPath, ignoredPaths));
}
