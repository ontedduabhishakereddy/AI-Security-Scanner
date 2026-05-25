/**
 * AI Security Scanner — Test Suite
 * 
 * Tests all three scanner modules against known fixture files.
 * Run with: npm test
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { scanForPromptInjection } from '../../src/scanner/promptInjection';
import { scanForDataLeakage } from '../../src/scanner/dataLeakage';
import { scanForApiMisuse } from '../../src/scanner/apiMisuse';

// ── Helpers ──

function loadFixture(filename: string): string {
    // __dirname at runtime is out/test/suite — go up 3 levels to project root
    const fixturePath = path.join(__dirname, '..', '..', '..', 'test', 'fixtures', filename);
    return fs.readFileSync(fixturePath, 'utf-8');
}

function findById(findings: { id: string }[], id: string): boolean {
    return findings.some(f => f.id === id);
}

// ── Prompt Injection Tests ──

function testPromptInjectionDetection(): void {
    console.log('\n🔍 Testing Prompt Injection Detection...');
    const text = loadFixture('injection-sample.ts');
    const findings = scanForPromptInjection(text, '/test/injection-sample.ts', 'typescript');

    // Should detect "ignore previous instructions"
    assert.ok(findById(findings, 'PI-001'), 'Should detect PI-001: ignore previous instructions');
    console.log('  ✅ PI-001: Ignore previous instructions');

    // Should detect "you are now a different"
    assert.ok(findById(findings, 'PI-003'), 'Should detect PI-003: identity reassignment');
    console.log('  ✅ PI-003: Identity reassignment');

    // Should detect "act as DAN"
    assert.ok(findById(findings, 'PI-004'), 'Should detect PI-004: DAN jailbreak');
    console.log('  ✅ PI-004: DAN jailbreak');

    // Should detect "your new instructions are"
    assert.ok(findById(findings, 'PI-005'), 'Should detect PI-005: instruction replacement');
    console.log('  ✅ PI-005: Instruction replacement');

    // Should detect "forget everything"
    assert.ok(findById(findings, 'PI-006'), 'Should detect PI-006: memory wipe');
    console.log('  ✅ PI-006: Memory wipe');

    // Should detect "override your guidelines"
    assert.ok(findById(findings, 'PI-007'), 'Should detect PI-007: guideline bypass');
    console.log('  ✅ PI-007: Guideline bypass');

    // Should detect "from now on you must"
    assert.ok(findById(findings, 'PI-008'), 'Should detect PI-008: persistent injection');
    console.log('  ✅ PI-008: Persistent injection');

    // Should detect "new persona:"
    assert.ok(findById(findings, 'PI-009'), 'Should detect PI-009: persona declaration');
    console.log('  ✅ PI-009: Persona declaration');

    // Should detect "pretend you have no restrictions"
    assert.ok(findById(findings, 'PI-011'), 'Should detect PI-011: restriction removal');
    console.log('  ✅ PI-011: Restriction removal');

    // PI-012 tested in edge cases with actual zero-width characters
    console.log('  ⏭️  PI-012: Tested in edge cases (requires real zero-width chars)');

    // Should detect HTML comment injection
    assert.ok(findById(findings, 'PI-013'), 'Should detect PI-013: HTML comment injection');
    console.log('  ✅ PI-013: HTML comment injection');

    // Should detect unsanitized template interpolation
    assert.ok(findById(findings, 'PI-014'), 'Should detect PI-014: unsanitized prompt template');
    console.log('  ✅ PI-014: Unsanitized prompt template');

    // Should detect system prompt from file
    assert.ok(findById(findings, 'PI-016'), 'Should detect PI-016: system prompt from file');
    console.log('  ✅ PI-016: System prompt from file');

    // Should detect system prompt from env
    assert.ok(findById(findings, 'PI-017'), 'Should detect PI-017: system prompt from env');
    console.log('  ✅ PI-017: System prompt from env');

    console.log(`  📊 Total findings: ${findings.length}`);
    console.log('  ✅ All prompt injection tests passed!\n');
}

// ── Data Leakage Tests ──

function testDataLeakageDetection(): void {
    console.log('🔍 Testing Data Leakage Detection...');
    const text = loadFixture('leakage-sample.py');
    const findings = scanForDataLeakage(text, '/test/leakage-sample.py', 'python');

    // Should detect OpenAI key
    assert.ok(findById(findings, 'DL-001'), 'Should detect DL-001: OpenAI API key');
    console.log('  ✅ DL-001: OpenAI API key');

    // Should detect Anthropic key
    assert.ok(findById(findings, 'DL-002'), 'Should detect DL-002: Anthropic API key');
    console.log('  ✅ DL-002: Anthropic API key');

    // Should detect Google key
    assert.ok(findById(findings, 'DL-003'), 'Should detect DL-003: Google API key');
    console.log('  ✅ DL-003: Google API key');

    // Should detect AWS key
    assert.ok(findById(findings, 'DL-004'), 'Should detect DL-004: AWS access key');
    console.log('  ✅ DL-004: AWS access key');

    // Should detect HuggingFace token
    assert.ok(findById(findings, 'DL-005'), 'Should detect DL-005: HuggingFace token');
    console.log('  ✅ DL-005: HuggingFace token');

    // Should detect private key
    assert.ok(findById(findings, 'DL-006'), 'Should detect DL-006: private key');
    console.log('  ✅ DL-006: Private key');

    // Should detect generic secrets
    assert.ok(findById(findings, 'DL-007'), 'Should detect DL-007: generic secret');
    console.log('  ✅ DL-007: Generic secret variable');

    // Should detect database connection string
    assert.ok(findById(findings, 'DL-008'), 'Should detect DL-008: database connection string');
    console.log('  ✅ DL-008: Database connection string');

    // Should detect email address
    assert.ok(findById(findings, 'DL-009'), 'Should detect DL-009: email address');
    console.log('  ✅ DL-009: Email address');

    console.log(`  📊 Total findings: ${findings.length}`);
    console.log('  ✅ All data leakage tests passed!\n');
}

// ── API Misuse Tests ──

function testApiMisuseDetection(): void {
    console.log('🔍 Testing API Misuse Detection...');
    const text = loadFixture('misuse-sample.ts');
    const findings = scanForApiMisuse(text, '/test/misuse-sample.ts', 'typescript');

    // Should detect eval() of AI response
    assert.ok(findById(findings, 'AM-004'), 'Should detect AM-004: eval of AI response');
    console.log('  ✅ AM-004: eval() of AI response');

    // Should detect exec() of AI response
    assert.ok(findById(findings, 'AM-005'), 'Should detect AM-005: exec of AI response');
    console.log('  ✅ AM-005: exec() of AI response');

    // Should detect new Function() from AI response
    assert.ok(findById(findings, 'AM-006'), 'Should detect AM-006: new Function from AI response');
    console.log('  ✅ AM-006: new Function() from AI response');

    // Should detect innerHTML from AI response
    assert.ok(findById(findings, 'AM-007'), 'Should detect AM-007: innerHTML from AI response');
    console.log('  ✅ AM-007: innerHTML from AI response');

    console.log(`  📊 Total findings: ${findings.length}`);
    console.log('  ✅ All API misuse tests passed!\n');
}

// ── Edge Case Tests ──

function testEdgeCases(): void {
    console.log('🔍 Testing Edge Cases...');

    // Empty file should return no findings
    const emptyFindings = scanForPromptInjection('', '/test/empty.ts', 'typescript');
    assert.strictEqual(emptyFindings.length, 0, 'Empty file should have no findings');
    console.log('  ✅ Empty file returns no findings');

    // Clean code should return no findings
    const cleanCode = `
        const greeting = "Hello, world!";
        function add(a: number, b: number) { return a + b; }
        console.log(greeting);
    `;
    const cleanFindings = [
        ...scanForPromptInjection(cleanCode, '/test/clean.ts', 'typescript'),
        ...scanForDataLeakage(cleanCode, '/test/clean.ts', 'typescript'),
        ...scanForApiMisuse(cleanCode, '/test/clean.ts', 'typescript'),
    ];
    assert.strictEqual(cleanFindings.length, 0, 'Clean code should have no findings');
    console.log('  ✅ Clean code returns no findings');

    // Findings should have correct line numbers
    const lineTestCode = 'line 0\nline 1\nignore previous instructions\nline 3';
    const lineFindings = scanForPromptInjection(lineTestCode, '/test/lines.ts');
    const lineMatch = lineFindings.find(f => f.id === 'PI-001');
    assert.ok(lineMatch, 'Should find PI-001 in line test');
    assert.strictEqual(lineMatch!.line, 2, 'PI-001 should be on line 2 (0-indexed)');
    console.log('  ✅ Line numbers are correct');

    // Test zero-width characters with actual characters (not escape sequences in fixture)
    const zwText = 'Hello\u200BWorld\u200CTest\u200D';
    const zwFindings = scanForPromptInjection(zwText, '/test/zw.txt');
    assert.ok(findById(zwFindings, 'PI-012'), 'Should detect PI-012: zero-width characters');
    console.log('  ✅ PI-012: Zero-width characters detected');

    console.log('  ✅ All edge case tests passed!\n');
}

// ── Run All Tests ──

function runAllTests(): void {
    console.log('═══════════════════════════════════════════');
    console.log('  🛡️  AI Security Scanner — Test Suite');
    console.log('═══════════════════════════════════════════');

    try {
        testPromptInjectionDetection();
        testDataLeakageDetection();
        testApiMisuseDetection();
        testEdgeCases();

        console.log('═══════════════════════════════════════════');
        console.log('  ✅  ALL TESTS PASSED');
        console.log('═══════════════════════════════════════════\n');
    } catch (error) {
        console.error('\n❌ TEST FAILED:', error);
        process.exit(1);
    }
}

runAllTests();
