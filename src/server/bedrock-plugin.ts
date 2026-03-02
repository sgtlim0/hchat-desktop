import type { Plugin, Connect } from 'vite'
import {
  BedrockRuntimeClient,
  ConverseStreamCommand,
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
