/**
 * AI Security Scanner — Prompt Injection Detector
 */

import { DetectionPattern, Finding, Category, Severity } from '../types';

const INJECTION_COMMAND_PATTERNS: DetectionPattern[] = [
    {
        id: 'PI-001',
        regex: /ignore\s+(all\s+)?previous\s+instructions/gi,
        category: Category.PROMPT_INJECTION,
        severity: Severity.CRITICAL,
        title: 'Prompt Override — Ignore Previous Instructions',
        message: 'Detected "ignore previous instructions" — a classic prompt injection payload.',
        explanation: 'This phrase is the #1 prompt injection vector. Attackers embed it in user input to override AI safety guidelines. The 2023 Bing Chat jailbreak used this exact technique.',
        fix: 'Remove this text. Implement input sanitization that strips injection commands before they reach the LLM. Use prompt injection detection libraries like rebuff or promptguard.',
    },
    {
        id: 'PI-002',
        regex: /disregard\s+(your\s+)?(system\s+)?prompt/gi,
        category: Category.PROMPT_INJECTION,
        severity: Severity.CRITICAL,
        title: 'Prompt Override — Disregard System Prompt',
        message: 'Detected "disregard system prompt" — attempts to bypass AI foundational instructions.',
        explanation: 'System prompt override attacks bypass safety mechanisms. An attacker could send this through any user-facing input connected to an LLM.',
        fix: 'Never allow raw user input to be concatenated with system prompts. Implement strict input validation and use separate system/user message roles.',
    },
    {
        id: 'PI-003',
        regex: /you\s+are\s+now\s+(?:a\s+)?(?:different|new|my|an?\s+)/gi,
        category: Category.PROMPT_INJECTION,
        severity: Severity.CRITICAL,
        title: 'Prompt Override — Identity Reassignment',
        message: 'Detected identity reassignment ("you are now...") — attempts to change the AI persona.',
        explanation: 'Identity reassignment is a jailbreak technique. The "DAN" jailbreak family uses this approach to remove AI restrictions.',
        fix: 'Sanitize user inputs to remove identity reassignment phrases. Implement post-processing checks on prompt content.',
    },
    {
        id: 'PI-004',
        regex: /act\s+as\s+(?:DAN|a\s+hacker|evil|malicious|unrestricted)/gi,
        category: Category.PROMPT_INJECTION,
        severity: Severity.CRITICAL,
        title: 'Jailbreak — DAN/Persona Attack',
        message: 'Detected jailbreak persona pattern ("act as DAN/hacker") — a known jailbreak technique.',
        explanation: 'The "DAN" jailbreak and variants trick AI models into role-playing as unrestricted entities, bypassing content filters.',
        fix: 'Implement input filtering that detects and blocks jailbreak persona requests. Use a prompt injection classifier.',
    },
    {
        id: 'PI-005',
        regex: /your\s+new\s+instructions\s+are/gi,
        category: Category.PROMPT_INJECTION,
        severity: Severity.CRITICAL,
        title: 'Prompt Override — Instruction Replacement',
        message: 'Detected instruction replacement attempt ("your new instructions are").',
        explanation: 'This attempts to overwrite active instructions mid-conversation. Attackers embed this in data processed by AI pipelines.',
        fix: 'Strip instruction-override patterns from all user-controlled input. Use structured prompting with clear role boundaries.',
    },
    {
        id: 'PI-006',
        regex: /forget\s+(everything|all|what)\s+(you\s+)?(know|were|have)/gi,
        category: Category.PROMPT_INJECTION,
        severity: Severity.CRITICAL,
        title: 'Prompt Override — Memory Wipe',
        message: 'Detected memory wipe injection ("forget everything").',
        explanation: 'Memory wipe injections discard the AI system prompt and conversation history, leaving it vulnerable to follow-up attacker instructions.',
        fix: 'Implement input sanitization that detects command-like phrases targeting AI behavior. Use immutable system prompts.',
    },
    {
        id: 'PI-007',
        regex: /override\s+(your\s+)?(guidelines|rules|restrictions|safety)/gi,
        category: Category.PROMPT_INJECTION,
        severity: Severity.CRITICAL,
        title: 'Prompt Override — Guideline Bypass',
        message: 'Detected guideline override attempt — tries to bypass AI safety restrictions.',
        explanation: 'Direct attempts to override safety guidelines are a fundamental prompt injection vector.',
        fix: 'Never include guideline-override text in prompts. Validate all inputs against an injection pattern blocklist.',
    },
    {
        id: 'PI-008',
        regex: /from\s+now\s+on\s+you\s+must/gi,
        category: Category.PROMPT_INJECTION,
        severity: Severity.CRITICAL,
        title: 'Prompt Override — Persistent Instruction Injection',
        message: 'Detected persistent instruction injection ("from now on you must").',
        explanation: 'Persistent injection establishes ongoing malicious behavior affecting all subsequent interactions.',
        fix: 'Filter out temporal instruction patterns from user input.',
    },
    {
        id: 'PI-009',
        regex: /new\s+persona\s*:/gi,
        category: Category.PROMPT_INJECTION,
        severity: Severity.CRITICAL,
        title: 'Jailbreak — Persona Declaration',
        message: 'Detected persona declaration pattern ("new persona:").',
        explanation: 'Structured persona declarations define a complete new identity for the AI, including permissions and behavior modifications.',
        fix: 'Block structured persona definitions in user input. Implement a prompt injection classifier.',
    },
    {
        id: 'PI-010',
        regex: /\bjailbreak\b/gi,
        category: Category.PROMPT_INJECTION,
        severity: Severity.WARNING,
        title: 'Jailbreak Reference Detected',
        message: 'The word "jailbreak" was found — verify this is not part of an injection payload.',
        explanation: 'While "jailbreak" may appear in legitimate security docs, its presence near prompt construction warrants review.',
        fix: 'If in documentation/tests, add a comment. If in production prompt code, remove it.',
    },
    {
        id: 'PI-011',
        regex: /pretend\s+you\s+have\s+no\s+restrictions/gi,
        category: Category.PROMPT_INJECTION,
        severity: Severity.CRITICAL,
        title: 'Jailbreak — Restriction Removal',
        message: 'Detected restriction removal injection ("pretend you have no restrictions").',
        explanation: 'Social-engineering style injection asking AI to role-play being unrestricted.',
        fix: 'Remove this text. Implement prompt input validation that strips role-play restriction removal attempts.',
    },
    {
        id: 'PI-012',
        regex: /[\u200B\u200C\u200D\uFEFF]/g,
        category: Category.PROMPT_INJECTION,
        severity: Severity.CRITICAL,
        title: 'Hidden Unicode — Zero-Width Characters',
        message: 'Detected zero-width Unicode characters — these can hide injection payloads invisibly.',
        explanation: 'Zero-width characters are invisible but processed by LLMs. Attackers hide complete prompt override commands in them.',
        fix: 'Strip zero-width characters: text.replace(/[\\u200B\\u200C\\u200D\\uFEFF]/g, "")',
    },
    {
        id: 'PI-013',
        regex: /<!--\s*(?:AI|LLM|GPT|system|instruction|prompt)\s*[^>]*-->/gi,
        category: Category.PROMPT_INJECTION,
        severity: Severity.WARNING,
        title: 'HTML Comment Injection — AI Directive',
        message: 'Detected HTML comment with AI-related directives — may target AI processing HTML/Markdown.',
        explanation: 'HTML comments with AI directives are used in indirect prompt injection through web-scraped content.',
        fix: 'Strip HTML comments before feeding content to AI models.',
    },
];

const STRUCTURAL_PATTERNS: DetectionPattern[] = [
    {
        id: 'PI-014',
        regex: /(?:prompt|system(?:_?[Pp]rompt)?|user(?:_?[Mm]essage)?|llm(?:_?[Ii]nput)?)\s*=\s*`[^`]*\$\{(?:user|input|req|request|body|params?|query|data|msg|message|text|content)/gi,
        category: Category.PROMPT_INJECTION,
        severity: Severity.WARNING,
        title: 'Unsanitized Input in Prompt Template',
        message: 'User-controlled input directly interpolated into a prompt template without sanitization.',
        explanation: 'Template literal interpolation of user input into prompts is the most common structural vulnerability enabling prompt injection.',
        fix: 'Never directly interpolate user input. Use parameterized prompt construction or dedicated template libraries that escape content.',
        applicableLanguages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
    },
    {
        id: 'PI-015',
        regex: /(?:prompt|system(?:_?prompt)?|user(?:_?message)?|llm(?:_?input)?)\s*=\s*f["'][^"']*\{(?:user|input|req|request|body|params?|query|data|msg|message|text|content)/gi,
        category: Category.PROMPT_INJECTION,
        severity: Severity.WARNING,
        title: 'Unsanitized Input in Python f-string Prompt',
        message: 'User-controlled variable directly embedded in a Python f-string prompt.',
        explanation: 'Python f-string interpolation of user input into prompts is equivalent to SQL injection for LLMs.',
        fix: 'Use a prompt template system that sanitizes inputs before interpolation.',
        applicableLanguages: ['python'],
    },
    {
        id: 'PI-016',
        regex: /(?:system(?:_?[Pp]rompt)?|instructions?)\s*=\s*(?:fs\.readFileSync|readFile|open|fetch|axios|require)\s*\(/gi,
        category: Category.PROMPT_INJECTION,
        severity: Severity.WARNING,
        title: 'System Prompt Loaded from External Source',
        message: 'System prompt loaded from an external file/URL — the source may be tampered with.',
        explanation: 'Loading system prompts from external sources creates a supply-chain risk. If an attacker modifies the source, they control the AI.',
        fix: 'Hardcode system prompts or load from a verified, integrity-checked source with content hashing.',
    },
    {
        id: 'PI-017',
        regex: /(?:system(?:_?[Pp]rompt)?|instructions?)\s*=\s*(?:process\.env|os\.environ|os\.getenv|env\[)/gi,
        category: Category.PROMPT_INJECTION,
        severity: Severity.WARNING,
        title: 'System Prompt from Environment Variable',
        message: 'System prompt loaded from an environment variable — can be modified without code review.',
        explanation: 'Environment variables are mutable at runtime. A compromised CI/CD pipeline could inject malicious system prompts.',
        fix: 'Define system prompts in version-controlled source files, not environment variables.',
    },
];

const ALL_PATTERNS: DetectionPattern[] = [
    ...INJECTION_COMMAND_PATTERNS,
    ...STRUCTURAL_PATTERNS,
];

export function scanForPromptInjection(
    text: string,
    filePath: string,
    languageId?: string
): Finding[] {
    const findings: Finding[] = [];
    const lines = text.split('\n');

    for (const pattern of ALL_PATTERNS) {
        if (pattern.applicableLanguages && pattern.applicableLanguages.length > 0) {
            if (languageId && !pattern.applicableLanguages.includes(languageId)) {
                continue;
            }
        }
        pattern.regex.lastIndex = 0;

        let match: RegExpExecArray | null;
        while ((match = pattern.regex.exec(text)) !== null) {
            const { line, column } = getLineAndColumn(lines, match.index);
            findings.push({
                id: pattern.id,
                category: pattern.category,
                severity: pattern.severity,
                title: pattern.title,
                message: pattern.message,
                explanation: pattern.explanation,
                fix: pattern.fix,
                filePath,
                line,
                column,
                length: match[0].length,
                matchedText: match[0],
            });
            if (match[0].length === 0) {
                pattern.regex.lastIndex++;
            }
        }
    }
    return findings;
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
