// containerd-security-test.js
const { exec } = require('child_process');

console.log('🔒 Testing Containerd Security on port 44021...\n');

// Test 1: Basic API accessibility
async function testAPIAccess() {
    console.log('1. Testing Containerd API Access...');
    
    const endpoints = [
        '/v1/version',
        '/v1/containers',
        '/v1/images',
        '/v1/tasks',
        '/v1/namespaces'
    ];
    
    for (const endpoint of endpoints) {
        try {
            const response = await fetch(`http://localhost:44021${endpoint}`);
            console.log(`   ${endpoint}: ${response.status} ${response.statusText}`);
            
            if (response.status === 200) {
                const data = await response.text();
                console.log(`   ⚠️  DATA EXPOSED: ${data.substring(0, 100)}...`);
            }
        } catch (error) {
            console.log(`   ${endpoint}: Connection failed`);
        }
    }
}

// Test 2: Check for gRPC access
async function testGRPCAccess() {
    console.log('\n2. Testing gRPC API Access...');
    
    try {
        exec('which grpcurl', (error, stdout) => {
            if (!error) {
                exec('grpcurl -plaintext localhost:44021 list', (error, stdout, stderr) => {
                    if (!error && stdout) {
                        console.log('   ❌ VULNERABLE: gRPC API exposed');
                        console.log(`   Services: ${stdout}`);
                    } else {
                        console.log('   ✅ gRPC API not accessible');
                    }
                });
            } else {
                console.log('   ℹ️  grpcurl not installed');
            }
        });
    } catch (error) {
        console.log('   ✅ gRPC test completed');
    }
}

// Test 3: Check container information exposure
async function testContainerExposure() {
    console.log('\n3. Testing Container Information Exposure...');
    
    try {
        // Try to access container metadata
        const response = await fetch('http://localhost:44021/containers/json', {
            method: 'GET'
        });
        
        if (response.status === 200) {
            console.log('   ❌ CRITICAL: Container list exposed');
            const containers = await response.json();
            console.log(`   Containers found: ${containers.length}`);
        } else {
            console.log('   ✅ Container list not directly exposed');
        }
    } catch (error) {
        console.log('   ✅ Container API not accessible via HTTP');
    }
}

// Run tests
testAPIAccess();
setTimeout(testGRPCAccess, 1000);
setTimeout(testContainerExposure, 2000);