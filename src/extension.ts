/**
 * AI Security Scanner — Extension Entry Point
 * 
 * Activates the extension, registers all providers, commands,
 * and event handlers.
 */

import * as vscode from 'vscode';
import { scanDocument, scanWorkspace } from './scanner';
import { ScanResult, WorkspaceScanResult, Severity } from './types';
import { debounce, isSupportedDocument, getConfiguration } from './utils';
import {
    initDiagnostics,
    updateDiagnostics,
    updateWorkspaceDiagnostics,
    clearDiagnostics,
} from './providers/diagnosticProvider';
import {
    SecurityCodeLensProvider,
    registerCodeLensCommands,
} from './providers/codeLensProvider';
import { SecurityHoverProvider } from './providers/hoverProvider';
import { showReportPanel, updateReportData } from './providers/reportWebview';

let statusBarItem: vscode.StatusBarItem;
let codeLensProvider: SecurityCodeLensProvider;
let hoverProvider: SecurityHoverProvider;
let latestWorkspaceResult: WorkspaceScanResult | undefined;

// State management
let totalCritical = 0;
let totalWarnings = 0;
let totalInfo = 0;
const scanCache: Map<string, ScanResult> = new Map();

export function activate(context: vscode.ExtensionContext): void {
    console.log('AI Security Scanner is now active');

    // ── Initialize diagnostics ──
    initDiagnostics(context);

    // ── Initialize CodeLens provider ──
    codeLensProvider = new SecurityCodeLensProvider();
    context.subscriptions.push(
        vscode.languages.registerCodeLensProvider(
            { scheme: 'file' },
            codeLensProvider
        )
    );
    registerCodeLensCommands(context);

    // ── Initialize Hover provider ──
    hoverProvider = new SecurityHoverProvider();
    context.subscriptions.push(
        vscode.languages.registerHoverProvider(
            { scheme: 'file' },
            hoverProvider
        )
    );

    // ── Status Bar ──
    statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left,
        100
    );
    statusBarItem.command = 'aiSecurityScanner.showReport';
    updateStatusBar(0, 0);
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // ── Register Commands ──
    context.subscriptions.push(
        vscode.commands.registerCommand('aiSecurityScanner.scanCurrentFile', () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('No active editor to scan.');
                return;
            }
            scanAndUpdate(editor.document);
            vscode.window.showInformationMessage('AI Security Scanner: File scan complete.');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('aiSecurityScanner.scanWorkspace', async () => {
            await vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: 'AI Security Scanner',
                    cancellable: false,
                },
                async (progress) => {
                    progress.report({ message: 'Scanning workspace...' });
                    const results = await scanWorkspace(progress);
                    latestWorkspaceResult = results;

                    // Update diagnostics for all files
                    updateWorkspaceDiagnostics(results.fileResults);

                    // Update CodeLens and Hover for all files
                    for (const fileResult of results.fileResults) {
                        const uri = vscode.Uri.file(fileResult.filePath);
                        codeLensProvider.updateFindings(uri, fileResult.findings);
                        hoverProvider.updateFindings(uri, fileResult.findings);
                    }

                    // Update status bar
                    totalCritical = results.criticalCount;
                    totalWarnings = results.warningCount;
                    updateStatusBar(totalCritical, totalWarnings);

                    // Update report if open
                    updateReportData(results);

                    vscode.window.showInformationMessage(
                        `AI Security Scanner: Found ${results.totalFindings} issues ` +
                        `(${results.criticalCount} critical, ${results.warningCount} warnings) ` +
                        `in ${results.totalFiles} files.`
                    );
                }
            );
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('aiSecurityScanner.showReport', () => {
            showReportPanel(context, latestWorkspaceResult);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('aiSecurityScanner.clearFindings', () => {
            clearDiagnostics();
            codeLensProvider.clearFindings();
            hoverProvider.clearFindings();
            totalCritical = 0;
            totalWarnings = 0;
            updateStatusBar(0, 0);
            latestWorkspaceResult = undefined;
            vscode.window.showInformationMessage('AI Security Scanner: All findings cleared.');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('aiSecurityScanner.openSettings', () => {
            vscode.commands.executeCommand(
                'workbench.action.openSettings',
                'aiSecurityScanner'
            );
        })
    );

    // ── Event Handlers ──
    const config = getConfiguration();

    // Real-time scanning (debounced)
    if (config.enableRealTime) {
        const debouncedScan = debounce((document: vscode.TextDocument) => {
            if (isSupportedDocument(document)) {
                scanAndUpdate(document);
            }
        }, 500);

        context.subscriptions.push(
            vscode.workspace.onDidChangeTextDocument((event) => {
                const currentConfig = getConfiguration();
                if (currentConfig.enableRealTime) {
                    debouncedScan(event.document);
                }
            })
        );
    }

    // Scan on save
    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument((document) => {
            const currentConfig = getConfiguration();
            if (currentConfig.enableOnSave && isSupportedDocument(document)) {
                scanAndUpdate(document);
            }
        })
    );

    // Scan on document open
    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument((document) => {
            if (isSupportedDocument(document)) {
                scanAndUpdate(document);
            }
        })
    );

    // Scan workspace on start if configured
    if (config.scanWorkspaceOnStart) {
        vscode.commands.executeCommand('aiSecurityScanner.scanWorkspace');
    }

    // Scan any already-open documents
    for (const editor of vscode.window.visibleTextEditors) {
        if (isSupportedDocument(editor.document)) {
            scanAndUpdate(editor.document);
        }
    }
}

/**
 * Scan a document and update all providers.
 */
function scanAndUpdate(document: vscode.TextDocument): void {
    try {
        const result = scanDocument(document);
        const uri = document.uri;

        // Update diagnostics
        updateDiagnostics(uri, result);

        // Update cache
        scanCache.set(uri.fsPath, result);

        // Update CodeLens
        codeLensProvider.updateFindings(uri, result.findings);

        // Update Hover
        hoverProvider.updateFindings(uri, result.findings);

        // Recalculate status bar and report
        recalculateAndRefresh();
    } catch (error) {
        console.error('AI Security Scanner: Error scanning document', error);
    }
}

/**
 * Re-calculate totals from cache and update status bar + report.
 */
function recalculateAndRefresh(): void {
    let critical = 0;
    let warnings = 0;
    let info = 0;
    const allResults: ScanResult[] = [];

    for (const result of scanCache.values()) {
        allResults.push(result);
        for (const finding of result.findings) {
            if (finding.severity === 'critical') {
                critical++;
            } else if (finding.severity === 'warning') {
                warnings++;
            } else if (finding.severity === 'info') {
                info++;
            }
        }
    }

    totalCritical = critical;
    totalWarnings = warnings;
    totalInfo = info;

    // Create a virtual workspace result for the report
    const virtualResult: WorkspaceScanResult = {
        fileResults: allResults,
        totalFiles: scanCache.size,
        totalFindings: critical + warnings + info,
        criticalCount: critical,
        warningCount: warnings,
        infoCount: info,
        totalScanTimeMs: 0 // Live scans don't have an aggregate time
    };

    latestWorkspaceResult = virtualResult;
    updateStatusBar(critical, warnings);
    updateReportData(virtualResult);
}


/**
 * Update the status bar item text and appearance.
 */
function updateStatusBar(critical: number, warnings: number): void {
    if (critical === 0 && warnings === 0) {
        statusBarItem.text = '$(shield) AI-SEC: ✅ Clean';
        statusBarItem.backgroundColor = undefined;
        statusBarItem.tooltip = 'AI Security Scanner — No issues detected';
    } else {
        statusBarItem.text = `$(shield) AI-SEC: ${critical} critical, ${warnings} warnings`;
        if (critical > 0) {
            statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        } else {
            statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        }
        statusBarItem.tooltip = `AI Security Scanner — ${critical} critical, ${warnings} warning issues found. Click to view report.`;
    }
}

export function deactivate(): void {
    console.log('AI Security Scanner deactivated');
}
