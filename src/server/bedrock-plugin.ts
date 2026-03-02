import type { Plugin, Connect } from 'vite'
import {
  BedrockRuntimeClient,
  ConverseStreamCommand,
  ConverseCommand,
  type Message as BedrockMessage,
  type ContentBlock,
} from '@aws-sdk/client-bedrock-runtime'

interface ChatRequestBody {
  credentials: {
    accessKeyId: string
    secretAccessKey: string
    region: string
  }
  modelId: string
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
  system?: string
}

function parseRequestBody(req: Connect.IncomingMessage): Promise<ChatRequestBody> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString())
        resolve(body)
      } catch (error) {
        reject(new Error('Invalid JSON body'))
      }
    })
    req.on('error', reject)
  })
}

function createClient(credentials: ChatRequestBody['credentials']): BedrockRuntimeClient {
  return new BedrockRuntimeClient({
    region: credentials.region,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
    },
  })
}

function convertMessages(messages: ChatRequestBody['messages']): BedrockMessage[] {
  return messages.map((msg) => ({
    role: msg.role,
    content: [{ text: msg.content }] as ContentBlock[],
  }))
}

function setupMiddleware(middlewares: { use: (path: string, handler: Connect.NextHandleFunction) => void }) {
  // POST /api/chat — streaming chat
  middlewares.use('/api/chat', async (req, res, next) => {
    if (req.method !== 'POST') {
      return next()
    }

    // Skip the test endpoint
    if (req.url === '/test') {
      return next()
    }

    try {
      const body = await parseRequestBody(req)
      const client = createClient(body.credentials)

      const bedrockMessages = convertMessages(body.messages)

      const command = new ConverseStreamCommand({
        modelId: body.modelId,
        messages: bedrockMessages,
        ...(body.system ? { system: [{ text: body.system }] } : {}),
      })

      const response = await client.send(command)

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      })

      if (response.stream) {
        for await (const event of response.stream) {
          if (event.contentBlockDelta?.delta?.text) {
            const data = JSON.stringify({
              type: 'text',
              content: event.contentBlockDelta.delta.text,
            })
            res.write(`data: ${data}\n\n`)
          }

          if (event.messageStop) {
            res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
          }
        }
      }

      res.end()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'

      if (!res.headersSent) {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
        })
      }

      res.write(`data: ${JSON.stringify({ type: 'error', error: message })}\n\n`)
      res.end()
    }
  })

  // POST /api/search — web search via DuckDuckGo HTML
  middlewares.use('/api/search', async (req, res, next) => {
    if (req.method !== 'POST') {
      return next()
    }

    try {
      const body = await parseRequestBody(req) as unknown as { query: string; maxResults?: number }
      const query = body.query
      const maxResults = body.maxResults ?? 5

      // Use DuckDuckGo Lite HTML API
      const params = new URLSearchParams({ q: query })
      const ddgResponse = await fetch(`https://lite.duckduckgo.com/lite/?${params.toString()}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; HChat/1.0)',
        },
      })

      const html = await ddgResponse.text()

      // Parse results from DuckDuckGo Lite HTML
      const results: Array<{ title: string; url: string; snippet: string }> = []
      const linkRegex = /<a[^>]+class="result-link"[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi
      const snippetRegex = /<td[^>]*class="result-snippet"[^>]*>(.*?)<\/td>/gi

      const links: Array<{ url: string; title: string }> = []
      let match
      while ((match = linkRegex.exec(html)) !== null) {
        links.push({
          url: match[1].replace(/&amp;/g, '&'),
          title: match[2].replace(/<[^>]*>/g, '').trim(),
        })
      }

      const snippets: string[] = []
      while ((match = snippetRegex.exec(html)) !== null) {
        snippets.push(match[1].replace(/<[^>]*>/g, '').trim())
      }

      for (let i = 0; i < Math.min(links.length, maxResults); i++) {
        results.push({
          title: links[i].title,
          url: links[i].url,
          snippet: snippets[i] ?? '',
        })
      }

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ results }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Search failed'
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ results: [], error: message }))
    }
  })

  // POST /api/extract-memory — extract memories from conversation via Bedrock
  middlewares.use('/api/extract-memory', async (req, res, next) => {
    if (req.method !== 'POST') {
      return next()
    }

    try {
      const body = await parseRequestBody(req) as unknown as {
        messages: Array<{ role: string; content: string }>
        credentials: ChatRequestBody['credentials']
      }

      const client = createClient(body.credentials)

      const conversationText = body.messages
        .filter((m) => m.content)
        .map((m) => `${m.role}: ${m.content}`)
        .join('\n')

      const systemPrompt = `You are a memory extraction assistant. Analyze the conversation and extract key facts, user preferences, and important information.

Return ONLY a valid JSON array of objects with this structure:
[
  { "key": "short descriptive label", "value": "the extracted fact or preference", "scope": "session" }
]

Rules:
- Extract only concrete, useful facts (names, preferences, technical details, decisions)
- Skip greetings, small talk, and generic statements
- Use "session" scope for conversation-specific facts
- Use "global" scope for user preferences that apply broadly
- Return an empty array [] if no meaningful facts found
- Return ONLY the JSON array, no markdown, no explanation`

      const extractionModel = 'us.anthropic.claude-haiku-4-5-20251001-v1:0'

      const command = new ConverseCommand({
        modelId: extractionModel,
        messages: [
          {
            role: 'user',
            content: [{ text: `Extract key facts from this conversation:\n\n${conversationText}` }],
          },
        ],
        system: [{ text: systemPrompt }],
        inferenceConfig: { maxTokens: 2048 },
      })

      const response = await client.send(command)

      let rawText = ''
      const contentBlocks = response.output?.message?.content ?? []
      for (const block of contentBlocks) {
        if (block.text) {
          rawText += block.text
        }
      }

      rawText = rawText.trim()
      if (rawText.startsWith('```')) {
        const lines = rawText.split('\n')
        rawText = lines.slice(1, lines[lines.length - 1]?.trim() === '```' ? -1 : undefined).join('\n')
      }

      const memories = JSON.parse(rawText)

      if (!Array.isArray(memories)) {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ memories: [], error: 'LLM returned non-array response' }))
        return
      }

      const validated = memories
        .filter((m: Record<string, unknown>) => m && typeof m.key === 'string' && typeof m.value === 'string')
        .map((m: Record<string, unknown>) => ({
          key: String(m.key),
          value: String(m.value),
          scope: m.scope === 'global' ? 'global' : 'session',
        }))

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ memories: validated }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Memory extraction failed'
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ memories: [], error: message }))
    }
  })

  // POST /api/chat/test — credential validation
  middlewares.use('/api/chat/test', async (req, res, next) => {
    if (req.method !== 'POST') {
      return next()
    }

    try {
      const body = await parseRequestBody(req)
      const client = createClient(body.credentials)

      // Send a minimal message to verify credentials
      const command = new ConverseStreamCommand({
        modelId: body.modelId,
        messages: [
          {
            role: 'user',
            content: [{ text: 'Hi' }],
          },
        ],
        inferenceConfig: {
          maxTokens: 1,
        },
      })

      const response = await client.send(command)

      // Consume the stream to complete the request
      if (response.stream) {
        for await (const _event of response.stream) {
          // Just consume, we only need to verify it works
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: true }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: false, error: message }))
    }
  })
}

export function bedrockProxy(): Plugin {
  return {
    name: 'bedrock-proxy',
    configureServer(server) {
      setupMiddleware(server.middlewares)
    },
    configurePreviewServer(server) {
      setupMiddleware(server.middlewares)
    },
  }
}
