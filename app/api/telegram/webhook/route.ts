import { NextRequest, NextResponse } from 'next/server'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`

// Send message to Telegram
async function sendMessage(chatId: number, text: string, parseMode: string = 'HTML') {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: parseMode,
    }),
  })
}

// Send typing indicator
async function sendTyping(chatId: number) {
  await fetch(`${TELEGRAM_API}/sendChatAction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      action: 'typing',
    }),
  })
}

// Verify single email using Azure SMTP microservice
async function verifyEmail(email: string) {
  try {
    const smtpUrl = process.env.SMTP_SERVICE_URL || 'https://fkbounce-smtp.azurewebsites.net'
    const response = await fetch(`${smtpUrl}/api/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    
    if (!response.ok) {
      throw new Error('Verification failed')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Verification error:', error)
    return null
  }
}

// Format verification result
function formatResult(result: any): string {
  if (!result) {
    return '❌ <b>Error:</b> Could not verify email. Please try again.'
  }

  const status = result.valid ? '✅' : '❌'
  const validText = result.valid ? 'Valid' : 'Invalid'
  
  // Calculate quality score
  let qualityScore = 0
  if (result.syntax) qualityScore += 15
  if (result.dns) qualityScore += 15
  if (result.smtp) qualityScore += 25
  if (!result.catch_all) qualityScore += 15
  if (!result.disposable) qualityScore += 15
  if (!result.is_role_based) qualityScore += 5
  if (!result.is_spam_trap) qualityScore += 10
  qualityScore = Math.min(100, qualityScore)

  // Determine risk
  let risk = 'Low 🟢'
  if (result.is_spam_trap || result.disposable) risk = 'High 🔴'
  else if (!result.smtp || result.catch_all) risk = 'Medium 🟡'

  return `
${status} <b>Email Verification Result</b>

📧 <b>Email:</b> <code>${result.email}</code>
📊 <b>Status:</b> ${validText}

<b>━━━ Checks ━━━</b>
✏️ Syntax: ${result.syntax ? '✅ Yes' : '❌ No'}
🌐 DNS: ${result.dns ? '✅ Yes' : '❌ No'}
📬 SMTP: ${result.smtp ? '✅ Yes' : '❌ No'}
🗑️ Disposable: ${result.disposable ? '⚠️ Yes' : '✅ No'}
📥 Catch-All: ${result.catch_all ? '⚠️ Yes' : '✅ No'}

<b>━━━ Scores ━━━</b>
📈 Quality: ${qualityScore}%
⚠️ Risk: ${risk}

💬 <i>${result.message || 'Verification complete'}</i>
`.trim()
}

// Handle /start command
function getStartMessage(): string {
  return `
🚀 <b>Welcome to FKBounce Email Verifier!</b>

I can help you verify email addresses instantly.

<b>Commands:</b>
/verify <code>email@example.com</code> - Verify an email
/help - Show this help message

<b>Quick Start:</b>
Just send me any email address and I'll verify it!

Example: <code>test@gmail.com</code>

🔗 <a href="https://fkbounce.com">Visit FKBounce.com</a> for bulk verification
`.trim()
}

// Handle /help command
function getHelpMessage(): string {
  return `
📖 <b>FKBounce Bot Help</b>

<b>How to use:</b>
1️⃣ Send an email address directly
2️⃣ Or use /verify command

<b>Examples:</b>
• <code>test@gmail.com</code>
• <code>/verify john@company.com</code>

<b>What I check:</b>
• ✏️ Email syntax validity
• 🌐 Domain DNS records
• 📬 SMTP mailbox existence
• 🗑️ Disposable email detection
• 📥 Catch-all server detection

<b>Need bulk verification?</b>
Visit 🔗 <a href="https://fkbounce.com">fkbounce.com</a>

<b>Support:</b> @fkbounce_support
`.trim()
}

// Check if text is an email
function isEmail(text: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(text.trim())
}

// Extract email from /verify command
function extractEmail(text: string): string | null {
  const match = text.match(/\/verify\s+([^\s@]+@[^\s@]+\.[^\s@]+)/i)
  return match ? match[1] : null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Handle message updates
    const message = body.message
    if (!message) {
      return NextResponse.json({ ok: true })
    }

    const chatId = message.chat.id
    const text = message.text?.trim() || ''
    const username = message.from?.username || 'User'

    console.log(`[Telegram] Message from @${username}: ${text}`)

    // Handle /start command
    if (text === '/start') {
      await sendMessage(chatId, getStartMessage())
      return NextResponse.json({ ok: true })
    }

    // Handle /help command
    if (text === '/help') {
      await sendMessage(chatId, getHelpMessage())
      return NextResponse.json({ ok: true })
    }

    // Handle /verify command
    if (text.startsWith('/verify')) {
      const email = extractEmail(text)
      if (!email) {
        await sendMessage(chatId, '⚠️ Please provide an email address.\n\nExample: <code>/verify test@gmail.com</code>')
        return NextResponse.json({ ok: true })
      }

      await sendTyping(chatId)
      const result = await verifyEmail(email)
      await sendMessage(chatId, formatResult(result))
      return NextResponse.json({ ok: true })
    }

    // Handle direct email input
    if (isEmail(text)) {
      await sendTyping(chatId)
      const result = await verifyEmail(text)
      await sendMessage(chatId, formatResult(result))
      return NextResponse.json({ ok: true })
    }

    // Unknown command or text
    if (text.startsWith('/')) {
      await sendMessage(chatId, '❓ Unknown command. Use /help to see available commands.')
    } else {
      await sendMessage(chatId, '📧 Please send a valid email address to verify.\n\nExample: <code>test@gmail.com</code>')
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[Telegram] Webhook error:', error)
    return NextResponse.json({ ok: true }) // Always return 200 to Telegram
  }
}

// GET endpoint to set up webhook
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  if (action === 'setWebhook') {
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://fkbounce.com'}/api/telegram/webhook`
    
    const response = await fetch(`${TELEGRAM_API}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message'],
      }),
    })

    const result = await response.json()
    return NextResponse.json(result)
  }

  if (action === 'getWebhookInfo') {
    const response = await fetch(`${TELEGRAM_API}/getWebhookInfo`)
    const result = await response.json()
    return NextResponse.json(result)
  }

  if (action === 'deleteWebhook') {
    const response = await fetch(`${TELEGRAM_API}/deleteWebhook`)
    const result = await response.json()
    return NextResponse.json(result)
  }

  return NextResponse.json({
    message: 'FKBounce Telegram Bot Webhook',
    actions: {
      setWebhook: '/api/telegram/webhook?action=setWebhook',
      getWebhookInfo: '/api/telegram/webhook?action=getWebhookInfo',
      deleteWebhook: '/api/telegram/webhook?action=deleteWebhook',
    },
  })
}
