/**
 * AI Security Scanner — Data Leakage Detector
 */

import { DetectionPattern, Finding, Category, Severity } from '../types';

const SECRET_PATTERNS: DetectionPattern[] = [
    {
        id: 'DL-001',
        regex: /(?:sk-[a-zA-Z0-9_-]{20,})/g,
        category: Category.DATA_LEAKAGE,
        severity: Severity.CRITICAL,
        title: 'Hardcoded OpenAI API Key',
        message: 'Detected a hardcoded OpenAI API key (sk-...) — this key should never be in source code.',
        explanation: 'OpenAI API keys grant full access to your account. If committed to version control, they can be scraped by bots within seconds. In 2024, thousands of exposed OpenAI keys were found on GitHub.',
        fix: 'Move the key to an environment variable or secrets manager:\n\nconst key = process.env.OPENAI_API_KEY;',
    },
    {
        id: 'DL-002',
        regex: /(?:sk-ant-[a-zA-Z0-9-]{20,})/g,
        category: Category.DATA_LEAKAGE,
        severity: Severity.CRITICAL,
        title: 'Hardcoded Anthropic API Key',
        message: 'Detected a hardcoded Anthropic API key (sk-ant-...).',
        explanation: 'Anthropic API keys provide access to Claude models. Exposed keys can incur significant charges and data exposure.',
        fix: 'Use environment variables: process.env.ANTHROPIC_API_KEY',
    },
    {
        id: 'DL-003',
        regex: /AIza[0-9A-Za-z\-_]{35}/g,
        category: Category.DATA_LEAKAGE,
        severity: Severity.CRITICAL,
        title: 'Hardcoded Google API Key',
        message: 'Detected a hardcoded Google API key (AIza...).',
        explanation: 'Google API keys can access multiple services including Gemini, Maps, and Cloud. Exposed keys are frequently abused for crypto-mining.',
        fix: 'Store in environment variables and restrict the key to specific APIs in Google Cloud Console.',
    },
    {
        id: 'DL-004',
        regex: /AKIA[0-9A-Z]{16}/g,
        category: Category.DATA_LEAKAGE,
        severity: Severity.CRITICAL,
        title: 'Hardcoded AWS Access Key',
        message: 'Detected a hardcoded AWS access key (AKIA...).',
        explanation: 'AWS access keys can provision infrastructure, access S3 data, and more. Exposed AWS keys cost companies thousands of dollars in minutes.',
        fix: 'Use AWS IAM roles, environment variables, or AWS Secrets Manager.',
    },
    {
        id: 'DL-005',
        regex: /hf_[a-zA-Z0-9]{20,}/g,
        category: Category.DATA_LEAKAGE,
        severity: Severity.CRITICAL,
        title: 'Hardcoded HuggingFace Token',
        message: 'Detected a hardcoded HuggingFace token (hf_...).',
        explanation: 'HuggingFace tokens grant access to models and datasets. Exposed tokens can be used to access private models or deploy inference endpoints.',
        fix: 'Use environment variables: process.env.HF_TOKEN',
    },
    {
        id: 'DL-006',
        regex: /-----BEGIN\s+(?:RSA|EC|DSA|OPENSSH|PGP)?\s*PRIVATE\s+KEY-----/g,
        category: Category.DATA_LEAKAGE,
        severity: Severity.CRITICAL,
        title: 'Private Key in Source Code',
        message: 'Detected a private key block in source code.',
        explanation: 'Private keys in source code can be used to impersonate services, decrypt communications, or gain SSH access to servers.',
        fix: 'Move private keys to a secure key vault. Never commit them to version control. Add key file patterns to .gitignore.',
    },
    {
        id: 'DL-007',
        regex: /(?:api[_-]?key|apikey|api[_-]?secret|secret[_-]?key|access[_-]?token|auth[_-]?token|bearer|password|passwd)\s*[=:]\s*["'`][a-zA-Z0-9+/=_\-]{8,}["'`]/gi,
        category: Category.DATA_LEAKAGE,
        severity: Severity.CRITICAL,
        title: 'Hardcoded Secret in Variable Assignment',
        message: 'Detected a secret value assigned to a credential-named variable.',
        explanation: 'Variables named api_key, secret, password, or token should never contain hardcoded values. These are trivially extractable from compiled code.',
        fix: 'Replace with environment variable lookup or a secrets manager.',
    },
    {
        id: 'DL-008',
        regex: /(?:mongodb(?:\+srv)?|postgres(?:ql)?|mysql|redis|amqp):\/\/[^:]+:[^@]+@[^\s"'`]+/gi,
        category: Category.DATA_LEAKAGE,
        severity: Severity.CRITICAL,
        title: 'Database Connection String with Credentials',
        message: 'Detected a database connection string containing embedded credentials.',
        explanation: 'Database URLs with passwords are a common source of breaches. Connection strings in code are often committed to public repos.',
        fix: 'Use environment variables for connection strings. Separate credentials from host configuration.',
    },
];

const PII_PATTERNS: DetectionPattern[] = [
    {
        id: 'DL-009',
        regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
        category: Category.DATA_LEAKAGE,
        severity: Severity.WARNING,
        title: 'Email Address in Code',
        message: 'Detected an email address — check if this is PII being sent to an AI API.',
        explanation: 'Email addresses are PII. If included in prompts sent to AI APIs, they may be logged or used for training, violating privacy regulations like GDPR.',
        fix: 'Anonymize email addresses before including in AI prompts. Use placeholder tokens: user_email@example.com',
    },
    {
        id: 'DL-010',
        regex: /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/g,
        category: Category.DATA_LEAKAGE,
        severity: Severity.WARNING,
        title: 'Possible SSN Pattern',
        message: 'Detected a pattern matching Social Security Number format (XXX-XX-XXXX).',
        explanation: 'SSNs in code or prompts are a severe privacy violation. If sent to AI APIs, this constitutes a data breach under most regulatory frameworks.',
        fix: 'Never include SSNs in code. If processing SSNs, ensure they are masked/redacted before any AI API calls.',
    },
    {
        id: 'DL-011',
        regex: /\b(?:\+?1[-.]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
        category: Category.DATA_LEAKAGE,
        severity: Severity.INFO,
        title: 'Phone Number Pattern',
        message: 'Detected a phone number pattern — verify this is not PII in AI context.',
        explanation: 'Phone numbers are PII that should not appear in AI prompts or be logged in AI response handlers.',
        fix: 'Replace phone numbers with anonymized placeholders when constructing AI prompts.',
    },
    {
        id: 'DL-012',
        regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
        category: Category.DATA_LEAKAGE,
        severity: Severity.CRITICAL,
        title: 'Credit Card Number Pattern',
        message: 'Detected a pattern matching credit card number format.',
        explanation: 'Credit card numbers in code violate PCI DSS compliance. If sent to AI APIs, this is a reportable data breach.',
        fix: 'Never store credit card numbers in code. Use a payment processor like Stripe and reference tokens instead.',
    },
];

const EXFILTRATION_PATTERNS: DetectionPattern[] = [
    {
        id: 'DL-013',
        regex: /(?:fetch|axios|http|request)\s*\(.*(?:completion|response|result|output|answer|reply).*\)/gi,
        category: Category.DATA_LEAKAGE,
        severity: Severity.WARNING,
        title: 'AI Response Sent to External Endpoint',
        message: 'Detected AI completion results being sent to an external HTTP endpoint.',
        explanation: 'Sending AI responses to external endpoints can exfiltrate sensitive data that was reflected in the AI output, including PII from prompts.',
        fix: 'Review the destination endpoint. Implement allow-listing for approved domains and sanitize AI responses before forwarding.',
    },
    {
        id: 'DL-014',
        regex: /console\.log\s*\(.*(?:completion|response|apiResponse|result).*\)/gi,
        category: Category.DATA_LEAKAGE,
        severity: Severity.INFO,
        title: 'AI Response Logged to Console',
        message: 'AI API response is logged — this may expose reflected PII in log aggregators.',
        explanation: 'AI responses may contain reflected PII from prompts. Logging full responses can cause PII to appear in log management systems, violating data retention policies.',
        fix: 'Log only metadata (status, token count, latency) rather than full AI responses. Implement PII redaction on log outputs.',
    },
    {
        id: 'DL-015',
        regex: /(?:\.\.\.(?:req\.body|user|userData|profile|customer|patient)|Object\.assign\s*\(\s*\{\},\s*(?:req\.body|user|userData)).*(?:messages|prompt|content)/gi,
        category: Category.DATA_LEAKAGE,
        severity: Severity.WARNING,
        title: 'User Data Spread into AI Messages',
        message: 'User/request data is spread directly into AI message construction — may leak PII.',
        explanation: 'Spreading full user objects into AI API messages sends all user fields (including PII) to the AI provider. This is a common accidental data leakage pattern.',
        fix: 'Explicitly select only the fields needed for the AI prompt. Never spread full user objects into AI API calls.',
    },
];

const ALL_PATTERNS: DetectionPattern[] = [
    ...SECRET_PATTERNS,
    ...PII_PATTERNS,
    ...EXFILTRATION_PATTERNS,
];

export function scanForDataLeakage(
    text: string,
    filePath: string,
    _languageId?: string
): Finding[] {
    const findings: Finding[] = [];
    const lines = text.split('\n');

    for (const pattern of ALL_PATTERNS) {
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
