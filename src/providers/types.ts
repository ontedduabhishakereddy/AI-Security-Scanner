/**
 * AI Security Scanner — Core Type Definitions
 * 
 * Defines all interfaces used across the scanner engine,
 * diagnostic providers, and reporting subsystem.
 */

/** Severity levels for security findings, ordered by impact */
export enum Severity {
    CRITICAL = 'critical',
    WARNING = 'warning',
    INFO = 'info',
}

/** Detection categories — the three threat pillars */
export enum Category {
    PROMPT_INJECTION = 'Prompt Injection',
    DATA_LEAKAGE = 'Data Leakage',
    API_MISUSE = 'API Misuse',
}

/** A single security finding produced by a detector */
export interface Finding {
    /** Unique identifier for the finding type (e.g., "PI-001") */
    id: string;

    /** Threat category this finding belongs to */
    category: Category;

    /** How severe the risk is */
    severity: Severity;

    /** Short human-readable title */
    title: string;

    /** Detailed message explaining the risk */
    message: string;

    /** Why this is dangerous (real-world context) */
    explanation: string;

    /** Concrete suggestion for remediation */
    fix: string;

    /** Absolute file path where the finding was detected */
    filePath: string;

    /** 0-based line number in the file */
    line: number;

    /** 0-based column start in the line */
    column: number;

    /** Length of the matched pattern in characters */
    length: number;

    /** The exact source text that matched */
    matchedText: string;
}

/** Result of scanning a single file */
export interface ScanResult {
    /** Absolute path of the scanned file */
    filePath: string;

    /** All findings detected in this file */
    findings: Finding[];

    /** Time taken to scan in milliseconds */
    scanTimeMs: number;

    /** Whether the scan completed successfully */
    success: boolean;

    /** Error message if scan failed */
    error?: string;
}

/** Aggregate result of scanning multiple files (workspace scan) */
export interface WorkspaceScanResult {
    /** Individual file scan results */
    fileResults: ScanResult[];

    /** Total number of files scanned */
    totalFiles: number;

    /** Total number of findings across all files */
    totalFindings: number;

    /** Count of critical severity findings */
    criticalCount: number;

    /** Count of warning severity findings */
    warningCount: number;

    /** Count of info severity findings */
    infoCount: number;

    /** Total scan time in milliseconds */
    totalScanTimeMs: number;
}

/** A detection pattern used by scanners */
export interface DetectionPattern {
    /** Unique pattern identifier */
    id: string;

    /** Precompiled regex for matching */
    regex: RegExp;

    /** Category of threat */
    category: Category;

    /** Severity when matched */
    severity: Severity;

    /** Short title for the finding */
    title: string;

    /** Detailed explanation of the risk */
    message: string;

    /** Why it is dangerous */
    explanation: string;

    /** How to fix it */
    fix: string;

    /** File extensions this pattern applies to (empty = all) */
    applicableExtensions?: string[];

    /** Language IDs this pattern applies to (empty = all) */
    applicableLanguages?: string[];
}

/** User-defined custom pattern from settings */
export interface CustomPattern {
    name: string;
    pattern: string;
    category: 'prompt-injection' | 'data-leakage' | 'api-misuse';
    severity: 'critical' | 'warning' | 'info';
    message: string;
    fix?: string;
}

/** Configuration shape matching package.json contributes.configuration */
export interface ScannerConfiguration {
    enableOnSave: boolean;
    enableRealTime: boolean;
    scanWorkspaceOnStart: boolean;
    ignoredPaths: string[];
    severityThreshold: 'critical' | 'warning' | 'info';
    customPatterns: CustomPattern[];
}

/** Message types for webview communication */
export interface WebviewMessage {
    type: 'scanResults' | 'exportReport' | 'jumpToFinding' | 'clearFindings' | 'requestData';
    payload?: WorkspaceScanResult | Finding | { format: 'json' | 'markdown' };
}
