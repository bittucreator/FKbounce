#!/usr/bin/env node

const API_KEY = process.argv[2]
const BASE_URL = process.argv[3] || 'http://localhost:3000'

if (!API_KEY) {
  console.error('❌ Usage: node test-duplicates.js YOUR_API_KEY [BASE_URL]')
  process.exit(1)
}

console.log('🔍 Duplicate Detection Test\n')

async function testDuplicateDetection() {
  // Create a list with duplicates
  const emails = [
    'user1@example.com',
    'user2@gmail.com',
    'user1@example.com',  // duplicate
    'user3@yahoo.com',
    'user2@gmail.com',     // duplicate
    'user4@hotmail.com',
    'User1@Example.com',   // duplicate (case insensitive)
    '  user3@yahoo.com  ', // duplicate (with spaces)
    'user5@outlook.com'
  ]
  
  console.log(`📧 Testing with ${emails.length} emails (contains duplicates)...\n`)
  
  try {
    const response = await fetch(`${BASE_URL}/api/verify-bulk-with-key`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({ emails })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      console.log(`❌ Error: ${data.error}`)
      return
    }
    
    console.log('✅ Results:')
    console.log('═'.repeat(60))
    console.log(`   Total emails submitted: ${data.total}`)
    console.log(`   Unique emails: ${data.unique}`)
    console.log(`   Duplicates detected: ${data.duplicates}`)
    console.log(`   Valid emails: ${data.valid}`)
    console.log(`   Invalid emails: ${data.invalid}`)
    console.log()
    
    if (data.duplicateEmails && data.duplicateEmails.length > 0) {
      console.log('🔄 Duplicate Emails:')
      console.log('═'.repeat(60))
      data.duplicateEmails.forEach((email, idx) => {
        console.log(`   ${idx + 1}. ${email}`)
      })
      console.log()
    }
    
    console.log('💰 Cost Savings:')
    console.log('═'.repeat(60))
    console.log(`   You were charged for: ${data.unique} verifications`)
    console.log(`   Instead of: ${data.total} verifications`)
    console.log(`   Saved: ${data.duplicates} verification${data.duplicates > 1 ? 's' : ''}`)
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`)
  }
}

testDuplicateDetection()
