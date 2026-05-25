/**
 * AI Security Scanner — API Misuse Detector
 */

import { DetectionPattern, Finding, Category, Severity } from '../types';

const INSECURE_CONFIG_PATTERNS: DetectionPattern[] = [
    {
        id: 'AM-001',
        regex: /(?:api[_-]?key|token|secret|auth)\s*[=:]\s*(?:req\.query|request\.query|params|searchParams|url\.parse)/gi,
        category: Category.API_MISUSE,
        severity: Severity.CRITICAL,
        title: 'API Key from URL Query Parameters',
        message: 'API key is read from URL query parameters — keys in URLs are logged by proxies, CDNs, and browser history.',
        explanation: 'URL query parameters are logged in server access logs, browser history, CDN logs, and proxy caches. API keys in URLs are trivially extractable.',
        fix: 'Pass API keys in HTTP headers (Authorization: Bearer) instead of URL parameters.',
        applicableLanguages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
    },
    {
        id: 'AM-002',
        regex: /(?:new\s+(?:OpenAI|Anthropic|GoogleGenerativeAI|Configuration|ChatOpenAI))\s*\(\s*\{[^}]*(?:apiKey|api_key)\s*:\s*(?:req\.|request\.|window\.|document\.|localStorage|sessionStorage|location)/gi,
        category: Category.API_MISUSE,
        severity: Severity.CRITICAL,
        title: 'AI SDK with Client-Side API Key',
        message: 'AI SDK instantiated with a key from client-side sources — the key is exposed to users.',
        explanation: 'API keys from browser-accessible sources (window, localStorage, URL) are visible to any user. This allows unlimited API usage billed to your account.',
        fix: 'Never use AI API keys on the client side. Proxy all AI API calls through your backend server.',
    },
    {
        id: 'AM-003',
        regex: /(?:openai|anthropic|genai|ai)\s*\.\s*(?:chat|complete|generate|create)\s*\([^)]*\)(?:(?!timeout|signal|AbortController|AbortSignal|setTimeout)[\s\S]){0,200}$/gm,
        category: Category.API_MISUSE,
        severity: Severity.WARNING,
        title: 'No Timeout on AI API Call',
        message: 'AI API call detected without visible timeout/abort configuration — may cause denial-of-service.',
        explanation: 'AI API calls without timeouts can hang indefinitely, consuming server resources and potentially causing cascading failures.',
        fix: 'Add a timeout using AbortController:\n\nconst controller = new AbortController();\nsetTimeout(() => controller.abort(), 30000);\nawait openai.chat.completions.create({ ... }, { signal: controller.signal });',
    },
];

const TRUST_VALIDATION_PATTERNS: DetectionPattern[] = [
    {
        id: 'AM-004',
        regex: /eval\s*\(\s*(?:completion|response|result|output|answer|reply|content|text|message|data)(?:[.\[!][^)]*)?\s*\)/gi,
        category: Category.API_MISUSE,
        severity: Severity.CRITICAL,
        title: 'eval() of AI Response — Remote Code Execution',
        message: 'AI API response is passed to eval() — this enables remote code execution via prompt injection.',
        explanation: 'Using eval() on AI output is equivalent to allowing arbitrary code execution. An attacker who can influence the AI response (via prompt injection) achieves full RCE.',
        fix: 'NEVER use eval() on AI responses. Parse structured AI output with JSON.parse() inside a try/catch, or use a sandboxed code execution environment.',
    },
    {
        id: 'AM-005',
        regex: /exec\s*\(\s*(?:completion|response|result|output|answer|reply|content|text|message|data)(?:[.\[!][^)]*)?\s*\)/gi,
        category: Category.API_MISUSE,
        severity: Severity.CRITICAL,
        title: 'exec() of AI Response — Command Injection',
        message: 'AI API response is passed to exec() — enables OS command injection.',
        explanation: 'Executing AI output as system commands allows an attacker to run arbitrary OS commands if they can manipulate the AI response.',
        fix: 'Never execute AI output as shell commands. If you need AI-generated commands, validate them against a strict allow-list.',
    },
    {
        id: 'AM-006',
        regex: /new\s+Function\s*\(\s*(?:completion|response|result|output|answer|reply|content|text|message|data)/gi,
        category: Category.API_MISUSE,
        severity: Severity.CRITICAL,
        title: 'new Function() from AI Response',
        message: 'AI response used to construct a Function object — equivalent to eval().',
        explanation: 'new Function() is functionally identical to eval() and allows arbitrary code execution from AI-generated content.',
        fix: 'Do not use new Function() with AI output. Parse structured responses with JSON.parse() instead.',
    },
    {
        id: 'AM-007',
        regex: /innerHTML\s*=\s*(?:completion|response|result|output|answer|reply|content|text|message|data)(?:[.\[!][^;\n]*)?/gi,
        category: Category.API_MISUSE,
        severity: Severity.CRITICAL,
        title: 'AI Response in innerHTML — XSS Risk',
        message: 'AI API response assigned to innerHTML — enables cross-site scripting.',
        explanation: 'Setting innerHTML with AI output allows script injection if the AI response contains HTML/JS. Attackers can trigger XSS via prompt injection.',
        fix: 'Use textContent instead of innerHTML, or sanitize with DOMPurify:\n\nelement.textContent = response;\n// OR\nelement.innerHTML = DOMPurify.sanitize(response);',
    },
    {
        id: 'AM-008',
        regex: /(?:fs\.writeFile|fs\.writeFileSync|open\s*\([^)]*,\s*['"]w['"])\s*\(\s*(?:completion|response|result|output|answer|reply|content|text|message|data)/gi,
        category: Category.API_MISUSE,
        severity: Severity.CRITICAL,
        title: 'File Write from AI Response',
        message: 'AI response data written directly to filesystem — enables arbitrary file write.',
        explanation: 'Writing AI output directly to files allows an attacker to overwrite critical files if they can influence the AI response path or content.',
        fix: 'Validate and sanitize AI output before writing to files. Restrict write paths to a safe directory and validate file names.',
    },
    {
        id: 'AM-009',
        regex: /(?:os\.system|subprocess\.run|subprocess\.call|subprocess\.Popen|child_process\.exec)\s*\(\s*(?:completion|response|result|output|answer|reply|content|text|message|data)/gi,
        category: Category.API_MISUSE,
        severity: Severity.CRITICAL,
        title: 'Shell Command from AI Response',
        message: 'AI response used in shell command execution — critical command injection risk.',
        explanation: 'Executing AI-generated content as shell commands gives attackers full OS-level control through prompt injection.',
        fix: 'Never pass AI output to shell execution functions. Use structured parsing and strict validation.',
        applicableLanguages: ['python', 'javascript', 'typescript'],
    },
    {
        id: 'AM-010',
        regex: /(?:query|execute|raw|sql)\s*\(\s*(?:`[^`]*\$\{|f['"][^'"]*\{)?\s*(?:completion|response|result|output|answer|reply|content|text|message|data)/gi,
        category: Category.API_MISUSE,
        severity: Severity.CRITICAL,
        title: 'SQL Query from AI Response',
        message: 'AI response used in SQL query construction — SQL injection risk.',
        explanation: 'Building SQL queries from AI output allows SQL injection if an attacker can manipulate the AI response via prompt injection.',
        fix: 'Use parameterized queries. Never concatenate AI output into SQL strings.',
    },
];

const COST_ABUSE_PATTERNS: DetectionPattern[] = [
    {
        id: 'AM-011',
        regex: /(?:catch|\.catch)\s*\([^)]*\)\s*\{[^}]*(?:retry|again|repeat|recall)[^}]*\}(?:(?!exponential|backoff|delay|setTimeout|wait)[\s\S]){0,100}/gi,
        category: Category.API_MISUSE,
        severity: Severity.WARNING,
        title: 'Retry Without Exponential Backoff',
        message: 'AI API retry logic detected without exponential backoff — may hammer the API on failures.',
        explanation: 'Retrying API calls without exponential backoff causes request storms during outages, worsening the problem and potentially getting your API key banned.',
        fix: 'Implement exponential backoff: delay = baseDelay * Math.pow(2, retryCount) + Math.random() * jitter',
    },
    {
        id: 'AM-012',
        regex: /(?:stream|createStream|pipe)\s*\([^)]*\)(?:(?!\.on\s*\(\s*['"](?:close|end|error|disconnect)['"]|destroy|abort|controller)[\s\S]){0,200}$/gm,
        category: Category.API_MISUSE,
        severity: Severity.WARNING,
        title: 'Stream Not Properly Closed',
        message: 'AI streaming response may not be properly closed on disconnect — resource leak risk.',
        explanation: 'Streaming responses that are not properly cleaned up on client disconnect consume server resources and API quota indefinitely.',
        fix: 'Implement proper stream cleanup:\n\nreq.on("close", () => {\n  stream.destroy();\n  controller.abort();\n});',
    },
    {
        id: 'AM-013',
        regex: /(?:app\.|router\.)(?:post|get|put)\s*\(\s*['"][^'"]*(?:ai|llm|chat|completion|generate|prompt)[^'"]*['"]\s*,(?:(?!rateLimit|rateLimiter|throttle|limiter)[\s\S]){0,300}(?:openai|anthropic|genai|ai)\s*\./gi,
        category: Category.API_MISUSE,
        severity: Severity.WARNING,
        title: 'No Rate Limiting on AI API Route',
        message: 'API route calling AI services without visible rate limiting — abuse risk.',
        explanation: 'Without rate limiting, a single user can make unlimited AI API calls, causing massive costs. Automated attacks can drain your API budget in minutes.',
        fix: 'Add rate limiting middleware:\n\nconst limiter = rateLimit({ windowMs: 60000, max: 10 });\napp.post("/api/chat", limiter, handler);',
    },
];

const ALL_PATTERNS: DetectionPattern[] = [
    ...INSECURE_CONFIG_PATTERNS,
    ...TRUST_VALIDATION_PATTERNS,
    ...COST_ABUSE_PATTERNS,
];

export function scanForApiMisuse(
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
