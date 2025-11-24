import { createYoga } from 'graphql-yoga'
import { schema } from '@/lib/graphql/schema'
import { createClient } from '@/lib/supabase/server'

const { handleRequest } = createYoga({
  schema,
  graphqlEndpoint: '/api/graphql',
  fetchAPI: { Response },
  
  // Context builder - adds authenticated user to context
  context: async ({ request }) => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('Unauthorized')
    }
    
    return {
      user,
      supabase
    }
  },
  
  // Enable GraphiQL in development
  graphiql: process.env.NODE_ENV === 'development' ? {
    title: 'FKbounce GraphQL API',
    headers: JSON.stringify({
      'Content-Type': 'application/json'
    })
  } : false,
  
  // CORS configuration
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    credentials: true
  }
})

export { handleRequest as GET, handleRequest as POST }
