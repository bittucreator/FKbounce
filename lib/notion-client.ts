import { Client } from '@notionhq/client'

export interface NotionDatabase {
  id: string
  title: string
  icon?: string | null
}

export interface NotionConnection {
  access_token: string
  workspace_name: string
  workspace_icon?: string
  bot_id: string
}

export class NotionClient {
  private client: Client

  constructor(accessToken: string) {
    this.client = new Client({ auth: accessToken })
  }

  async listDatabases(): Promise<NotionDatabase[]> {
    try {
      const response = await this.client.search({
        filter: { property: 'object', value: 'database' } as any,
        page_size: 100,
      })

      return response.results.map((db: any) => ({
        id: db.id,
        title: db.title?.[0]?.plain_text || 'Untitled',
        icon: db.icon?.emoji || null,
      }))
    } catch (error) {
      console.error('Error listing Notion databases:', error)
      throw error
    }
  }

  async getDatabaseProperties(databaseId: string) {
    try {
      const database = await this.client.databases.retrieve({
        database_id: databaseId,
      }) as any
      return database.properties
    } catch (error) {
      console.error('Error getting database properties:', error)
      throw error
    }
  }

  async addEmailToDatabase(
    databaseId: string,
    emailData: {
      email: string
      valid: boolean
      syntax: boolean
      dns: boolean
      smtp: boolean
      disposable: boolean
      catch_all: boolean
      message: string
      verified_at?: string
    }
  ) {
    try {
      const properties: any = {
        Email: {
          title: [
            {
              text: {
                content: emailData.email,
              },
            },
          ],
        },
      }

      // Add optional properties if they exist in the database
      const dbProperties = await this.getDatabaseProperties(databaseId)

      if (dbProperties['Status']) {
        properties['Status'] = {
          select: {
            name: emailData.valid ? 'Valid' : 'Invalid',
          },
        }
      }

      if (dbProperties['Valid']) {
        properties['Valid'] = {
          checkbox: emailData.valid,
        }
      }

      if (dbProperties['Syntax']) {
        properties['Syntax'] = {
          checkbox: emailData.syntax,
        }
      }

      if (dbProperties['DNS/MX']) {
        properties['DNS/MX'] = {
          checkbox: emailData.dns,
        }
      }

      if (dbProperties['SMTP']) {
        properties['SMTP'] = {
          checkbox: emailData.smtp,
        }
      }

      if (dbProperties['Disposable']) {
        properties['Disposable'] = {
          checkbox: emailData.disposable,
        }
      }

      if (dbProperties['Catch-All']) {
        properties['Catch-All'] = {
          checkbox: emailData.catch_all,
        }
      }

      if (dbProperties['Message']) {
        properties['Message'] = {
          rich_text: [
            {
              text: {
                content: emailData.message,
              },
            },
          ],
        }
      }

      if (dbProperties['Verified At'] && emailData.verified_at) {
        properties['Verified At'] = {
          date: {
            start: emailData.verified_at,
          },
        }
      }

      await this.client.pages.create({
        parent: { database_id: databaseId },
        properties,
      })

      return { success: true }
    } catch (error) {
      console.error('Error adding email to Notion:', error)
      throw error
    }
  }

  async addBulkEmailsToDatabase(
    databaseId: string,
    emails: Array<{
      email: string
      valid: boolean
      syntax: boolean
      dns: boolean
      smtp: boolean
      disposable: boolean
      catch_all: boolean
      message: string
    }>
  ) {
    const results = []
    const verified_at = new Date().toISOString()

    // Add emails in batches to avoid rate limits
    for (const emailData of emails) {
      try {
        await this.addEmailToDatabase(databaseId, {
          ...emailData,
          verified_at,
        })
        results.push({ email: emailData.email, success: true })
        
        // Rate limiting: wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        results.push({ 
          email: emailData.email, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return results
  }

  async createEmailDatabase(workspaceName: string) {
    try {
      // Note: This requires the integration to have access to a parent page
      // Users will need to share a page with the integration first
      const response = await (this.client.databases.create as any)({
        parent: {
          type: 'page_id',
          page_id: '', // Will be provided by user
        },
        title: [
          {
            text: {
              content: `Email Verifications - ${workspaceName}`,
            },
          },
        ],
        properties: {
          Email: {
            title: {},
          },
          Status: {
            select: {
              options: [
                { name: 'Valid', color: 'green' },
                { name: 'Invalid', color: 'red' },
              ],
            },
          },
          Valid: {
            checkbox: {},
          },
          Syntax: {
            checkbox: {},
          },
          'DNS/MX': {
            checkbox: {},
          },
          SMTP: {
            checkbox: {},
          },
          Disposable: {
            checkbox: {},
          },
          'Catch-All': {
            checkbox: {},
          },
          Message: {
            rich_text: {},
          },
          'Verified At': {
            date: {},
          },
        },
      })

      return { id: response.id, success: true }
    } catch (error) {
      console.error('Error creating Notion database:', error)
      throw error
    }
  }
}

export async function exchangeCodeForToken(code: string): Promise<NotionConnection> {
  const response = await fetch('https://api.notion.com/v1/oauth/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(
        `${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`
      ).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/notion/callback`,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to exchange code for token')
  }

  const data = await response.json()

  return {
    access_token: data.access_token,
    workspace_name: data.workspace_name,
    workspace_icon: data.workspace_icon,
    bot_id: data.bot_id,
  }
}
