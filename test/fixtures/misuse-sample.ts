/**
 * TEST FIXTURE: API Misuse Patterns
 * 
 * This file intentionally contains known API misuse patterns
 * for testing the AI Security Scanner. DO NOT use in production.
 */

import OpenAI from 'openai';

// AM-002: Client-side API key usage
const clientAI = new OpenAI({ apiKey: window.location.search.split('key=')[1] });

// AM-004: eval() of AI response
async function dangerousEval() {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Write a function' }],
    });
    // DANGEROUS: Executing AI output as code
    eval(completion.choices[0].message.content!);
}

// AM-005: exec() of AI response
import { exec } from 'child_process';
async function dangerousExec() {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const result = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Give me a shell command' }],
    });
    // DANGEROUS: Running AI output as shell command
    exec(result.choices[0].message.content!);
}

// AM-006: new Function() from AI response
async function dangerousFunction() {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Create a function' }],
    });
    const fn = new Function(response.choices[0].message.content!);
    fn();
}

// AM-007: innerHTML from AI response
async function dangerousInnerHTML() {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Generate HTML' }],
    });
    document.getElementById('output')!.innerHTML = completion.choices[0].message.content!;
}

// AM-010: SQL from AI response
async function dangerousSQL(db: any) {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const result = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Write a SQL query' }],
    });
    // DANGEROUS: Using AI output directly in SQL
    db.query(`SELECT * FROM users WHERE ${result.choices[0].message.content}`);
}

// AM-013: No rate limiting on AI route
import express from 'express';
const app = express();
app.post('/api/ai/chat', async (req, res) => {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: req.body.messages,
    });
    res.json(completion);
});

export { dangerousEval, dangerousExec, dangerousFunction };
