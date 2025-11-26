import { NextResponse } from 'next/server'
import net from 'net'

export async function GET() {
  const testResults = {
    port25Available: false,
    canConnectToGmail: false,
    error: null as string | null,
    details: [] as string[]
  }

  try {
    // Test 1: Can we create a socket?
    testResults.details.push('✓ Socket module available')

    // Test 2: Try connecting to Gmail's MX server on port 25
    const connectionTest = await new Promise((resolve) => {
      const socket = net.createConnection(25, 'aspmx.l.google.com')
      let connected = false

      socket.setTimeout(10000)

      socket.on('connect', () => {
        testResults.details.push('✓ Successfully connected to aspmx.l.google.com:25')
        connected = true
        socket.end()
      })

      socket.on('data', (data) => {
        const response = data.toString()
        testResults.details.push(`✓ Received: ${response.trim().substring(0, 100)}`)
      })

      socket.on('timeout', () => {
        testResults.details.push('✗ Connection timeout (10s)')
        testResults.error = 'Timeout - port 25 may be blocked'
        socket.destroy()
        resolve(false)
      })

      socket.on('error', (err) => {
        testResults.details.push(`✗ Connection error: ${err.message}`)
        testResults.error = err.message
        resolve(false)
      })

      socket.on('close', () => {
        if (connected) {
          testResults.details.push('✓ Connection closed gracefully')
          resolve(true)
        } else {
          resolve(false)
        }
      })
    })

    testResults.canConnectToGmail = connectionTest as boolean
    testResults.port25Available = connectionTest as boolean

    if (testResults.port25Available) {
      testResults.details.push('✅ PORT 25 IS OPEN - Catch-all detection will work!')
    } else {
      testResults.details.push('❌ PORT 25 IS BLOCKED - Catch-all detection will not work')
    }

  } catch (error: any) {
    testResults.error = error.message
    testResults.details.push(`✗ Unexpected error: ${error.message}`)
  }

  return NextResponse.json(testResults, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0'
    }
  })
}
