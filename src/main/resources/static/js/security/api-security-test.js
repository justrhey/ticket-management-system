// api-security-test.js
const tests = [
    // Test 1: Basic API Access
    {
        name: "API Endpoint Accessibility",
        test: async () => {
            const response = await fetch('http://localhost:8080/api/tickets');
            return response.status;
        }
    },
    
    // Test 2: SQL Injection in GET parameters
    {
        name: "SQL Injection - GET Parameters",
        test: async () => {
            const payloads = [
                "1' OR '1'='1",
                "1; DROP TABLE tickets--",
                "1' UNION SELECT 1,2,3--"
            ];
            
            for (const payload of payloads) {
                const response = await fetch(`http://localhost:8080/api/tickets?ticketId=${encodeURIComponent(payload)}`);
                if (response.status === 500) {
                    return "VULNERABLE - Server error on malicious input";
                }
            }
            return "SAFE - Proper input validation";
        }
    },
    
    // Test 3: XSS in POST requests
    {
        name: "XSS Vulnerability - POST Data",
        test: async () => {
            const xssPayloads = [
                "<script>alert('XSS')</script>",
                "<img src=x onerror=alert(1)>",
                "javascript:alert('XSS')"
            ];
            
            for (const payload of xssPayloads) {
                const response = await fetch('http://localhost:8080/api/tickets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        subject: payload,
                        intent: "Test description",
                        fullName: "Test User"
                    })
                });
                
                if (response.status === 200) {
                    return "POTENTIAL XSS - Malicious input accepted";
                }
            }
            return "SAFE - XSS payloads rejected";
        }
    },
    
    // Test 4: IDOR (Insecure Direct Object Reference)
    {
        name: "IDOR Vulnerability",
        test: async () => {
            // Try to access tickets that might not belong to current user
            const response = await fetch('http://localhost:8080/api/tickets/9999');
            return response.status === 200 ? "VULNERABLE - Accessed non-existent ticket" : "SAFE - Proper authorization";
        }
    },
    
    // Test 5: Mass Assignment
    {
        name: "Mass Assignment",
        test: async () => {
            const response = await fetch('http://localhost:8080/api/tickets/1', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: "Test",
                    isAdmin: true,
                    role: "administrator",
                    password: "hacked"
                })
            });
            return response.status === 200 ? "VULNERABLE - Extra fields accepted" : "SAFE - Mass assignment protected";
        }
    }
];

// Run tests
console.log('🔒 API Security Test Results:\n');
tests.forEach(async (test) => {
    try {
        const result = await test.test();
        console.log(`📋 ${test.name}: ${result}`);
    } catch (error) {
        console.log(`📋 ${test.name}: ERROR - ${error.message}`);
    }
});