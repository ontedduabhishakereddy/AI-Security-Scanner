/**
 * AI Security Scanner — Diagnostic Provider
 * 
 * Creates VS Code diagnostics (squiggly underlines) from scan findings
 * and integrates with the Problems panel.
 */

import * as vscode from 'vscode';
import { Finding, ScanResult } from '../types';
import { severityToDiagnosticSeverity } from '../utils';

let diagnosticCollection: vscode.DiagnosticCollection;

/**
 * Initialize the diagnostic collection.
 */
export function initDiagnostics(context: vscode.ExtensionContext): vscode.DiagnosticCollection {
    diagnosticCollection = vscode.languages.createDiagnosticCollection('aiSecurityScanner');
    context.subscriptions.push(diagnosticCollection);
    return diagnosticCollection;
}

/**
 * Update diagnostics for a document based on scan results.
 */
export function updateDiagnostics(uri: vscode.Uri, result: ScanResult): void {
    if (!diagnosticCollection) {
        return;
    }

    const diagnostics: vscode.Diagnostic[] = result.findings.map(finding => {
        return createDiagnostic(finding);
    });

    diagnosticCollection.set(uri, diagnostics);
}

/**
 * Update diagnostics for multiple files (workspace scan).
 */
export function updateWorkspaceDiagnostics(results: ScanResult[]): void {
    if (!diagnosticCollection) {
        return;
    }

    // Clear existing diagnostics
    diagnosticCollection.clear();

    for (const result of results) {
        if (result.findings.length > 0) {
            const uri = vscode.Uri.file(result.filePath);
            const diagnostics = result.findings.map(finding => createDiagnostic(finding));
            diagnosticCollection.set(uri, diagnostics);
        }
    }
}

/**
 * Clear all diagnostics.
 */
export function clearDiagnostics(): void {
    if (diagnosticCollection) {
        diagnosticCollection.clear();
    }
}

/**
 * Clear diagnostics for a specific file.
 */
export function clearFileDiagnostics(uri: vscode.Uri): void {
    if (diagnosticCollection) {
        diagnosticCollection.delete(uri);
    }
}

/**
 * Create a VS Code Diagnostic from a Finding.
 */
function createDiagnostic(finding: Finding): vscode.Diagnostic {
    const range = new vscode.Range(
        new vscode.Position(finding.line, finding.column),
        new vscode.Position(finding.line, finding.column + finding.length)
    );

    const message = `[AI-SEC] ${finding.category} | ${finding.title}\n${finding.message}`;

    const diagnostic = new vscode.Diagnostic(
        range,
        message,
        severityToDiagnosticSeverity(finding.severity)
    );

    diagnostic.source = 'AI Security Scanner';
    diagnostic.code = finding.id;

    return diagnostic;
}

/**
 * Get the diagnostic collection (for external access).
 */
export function getDiagnosticCollection(): vscode.DiagnosticCollection {
    return diagnosticCollection;
}
