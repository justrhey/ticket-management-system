// ticket-system-security.js
const tests = [
    // Test 1: SQL Injection in Search
    {
        name: "SQL Injection - Search Function",
        test: async () => {
            const payloads = [
                "' OR '1'='1",
                "'; DROP TABLE tickets--",
                "' UNION SELECT username,password FROM users--"
            ];
            
            for (const payload of payloads) {
                const response = await fetch(`http://localhost:8080/api/tickets?search=${encodeURIComponent(payload)}`);
                if (response.status === 500) {
                    return `VULNERABLE - SQLi payload caused error: ${payload}`;
                }
            }
            return "SAFE - SQL injection attempts blocked";
        }
    },
    
    // Test 2: XSS in Ticket Creation
    {
        name: "XSS - Ticket Creation",
        test: async () => {
            const xssPayloads = [
                "<script>alert('XSS')</script>",
                "<img src=x onerror=alert(1)>",
                "<svg onload=alert(1)>",
                "javascript:alert('XSS')"
            ];
            
            for (const payload of xssPayloads) {
                const response = await fetch('http://localhost:8080/api/tickets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        subject: payload,
                        intent: "Test description",
                        fullName: "Test User",
                        priority: "MEDIUM"
                    })
                });
                
                if (response.status === 200 || response.status === 201) {
                    const data = await response.json();
                    // Check if payload was stored without sanitization
                    if (data.subject && data.subject.includes(payload)) {
                        return `VULNERABLE - XSS payload stored: ${payload}`;
                    }
                }
            }
            return "SAFE - XSS payloads filtered";
        }
    },
    
    // Test 3: Authentication Bypass
    {
        name: "Authentication Bypass",
        test: async () => {
            const endpoints = [
                '/api/tickets',
                '/api/tickets/1',
                '/api/admin/users'
            ];
            
            for (const endpoint of endpoints) {
                const response = await fetch(`http://localhost:8080${endpoint}`);
                if (response.status === 200) {
                    return `VULNERABLE - No auth required for ${endpoint}`;
                }
            }
            return "SAFE - Authentication required";
        }
    },
    
    // Test 4: IDOR (Insecure Direct Object Reference)
    {
        name: "IDOR Vulnerability",
        test: async () => {
            // Try to access tickets that shouldn't be accessible
            for (let i = 1; i <= 10; i++) {
                const response = await fetch(`http://localhost:8080/api/tickets/${i}`);
                if (response.status === 200) {
                    const ticket = await response.json();
                    return `POTENTIAL IDOR - Accessed ticket ${i}`;
                }
            }
            return "SAFE - Proper access controls";
        }
    },
    
    // Test 5: Path Traversal
    {
        name: "Path Traversal",
        test: async () => {
            const traversalPayloads = [
                "../../../etc/passwd",
                "../../windows/system32/config/SAM",
                "....//....//....//etc/passwd"
            ];
            
            for (const payload of traversalPayloads) {
                const response = await fetch(`http://localhost:8080/api/files?name=${encodeURIComponent(payload)}`);
                if (response.status === 200) {
                    const content = await response.text();
                    if (content.includes("root:") || content.includes("Administrator")) {
                        return `CRITICAL - Path traversal successful: ${payload}`;
                    }
                }
            }
            return "SAFE - Path traversal blocked";
        }
    }
];

console.log('🔒 Ticket System Security Test Results:\n');

// Run tests with delay to avoid rate limiting
tests.forEach(async (test, index) => {
    setTimeout(async () => {
        try {
            const result = await test.test();
            console.log(`${index + 1}. ${test.name}: ${result}`);
        } catch (error) {
            console.log(`${index + 1}. ${test.name}: ERROR - ${error.message}`);
        }
    }, index * 1000);
});