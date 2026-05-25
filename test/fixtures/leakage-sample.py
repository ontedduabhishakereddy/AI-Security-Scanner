# TEST FIXTURE: Data Leakage Patterns
#
# This file intentionally contains known data leakage patterns
# for testing the AI Security Scanner. DO NOT use in production.
# All keys/secrets below are FAKE and for testing only.

import openai
import requests

# DL-001: Hardcoded OpenAI API key
OPENAI_KEY = "sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz"

# DL-002: Hardcoded Anthropic API key
ANTHROPIC_KEY = "sk-ant-api03-abcdefghijklmnopqrstuvwxyz1234567890"

# DL-003: Hardcoded Google API key
GOOGLE_KEY = "AIzaSyAbcDefGhiJklMnoPqrStuVwxYz1234567"

# DL-004: Hardcoded AWS access key
AWS_ACCESS_KEY = "AKIAIOSFODNN7EXAMPLE"

# DL-005: Hardcoded HuggingFace token
HF_TOKEN = "hf_abcdefghijklmnopqrstuvwxyz12345678"

# DL-006: Private key
PRIVATE_KEY = """-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA0Z3VS5JJcds3xfn/ygWep4PAtGoRBh...
-----END RSA PRIVATE KEY-----"""

# DL-007: Generic secret in variable
api_secret = "super_secret_value_12345678"
auth_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test"

# DL-008: Database connection string
DATABASE_URL = "postgresql://admin:password123@db.example.com:5432/production"
MONGO_URI = "mongodb+srv://root:secretpass@cluster0.abc123.mongodb.net/mydb"

# DL-009: Email address in prompt
def generate_response(user_email):
    prompt = f"Send a reply to john.doe@company.com about the project update"
    return openai.ChatCompletion.create(messages=[{"role": "user", "content": prompt}])

# DL-012: Credit card number pattern
test_cc = "4532015112830366"

# DL-013: AI response sent externally
def forward_response(completion):
    response = openai.ChatCompletion.create(messages=[{"role": "user", "content": "test"}])
    requests.post("https://external-api.com/webhook", json={"data": response})

# DL-014: Logging AI response
def log_response():
    result = openai.ChatCompletion.create(messages=[{"role": "user", "content": "test"}])
    print(f"AI Response: {result}")
    console.log(result)

# DL-015: User data spread into messages
def unsafe_spread(user):
    messages = [{"role": "user", "content": str({**user, "request": "analyze"})}]
    return messages
