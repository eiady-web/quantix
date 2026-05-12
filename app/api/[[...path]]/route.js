import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import OpenAI from 'openai'

let cached = global._mongoCache
if (!cached) cached = global._mongoCache = { client: null, db: null }

async function getDb() {
  if (cached.db) return cached.db
  if (!cached.client) {
    cached.client = new MongoClient(process.env.MONGO_URL)
    await cached.client.connect()
  }
  cached.db = cached.client.db(process.env.DB_NAME || 'quantix_takeoff')
  return cached.db
}

function getLLM() {
  return new OpenAI({
    apiKey: process.env.EMERGENT_LLM_KEY,
    baseURL: 'https://integrations.emergentagent.com/llm',
  })
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const json = (data, status = 200) =>
  NextResponse.json(data, { status, headers: corsHeaders })

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}

async function readBody(request) {
  try { return await request.json() } catch { return {} }
}

function getRoute(request) {
  const url = new URL(request.url)
  const parts = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean)
  return parts
}

async function handleProjects(method, parts, request) {
  const db = await getDb()
  const col = db.collection('projects')

  if (method === 'GET' && parts.length === 1) {
    const list = await col.find({}).sort({ createdAt: -1 }).limit(100).toArray()
    return json(list.map(p => ({ ...p, _id: undefined })))
  }
  if (method === 'GET' && parts.length === 2) {
    const p = await col.findOne({ id: parts[1] })
    if (!p) return json({ error: 'Not found' }, 404)
    return json({ ...p, _id: undefined })
  }
  if (method === 'POST' && parts.length === 1) {
    const body = await readBody(request)
    const proj = {
      id: uuidv4(),
      name: body.name || 'Untitled Project',
      client: body.client || '',
      location: body.location || '',
      currency: body.currency || 'USD',
      taxRate: body.taxRate || 0,
      boqItems: [],
      drawings: [],
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await col.insertOne(proj)
    return json({ ...proj, _id: undefined })
  }
  if (method === 'PUT' && parts.length === 2) {
    const body = await readBody(request)
    delete body._id
    body.updatedAt = new Date().toISOString()
    await col.updateOne({ id: parts[1] }, { $set: body })
    const updated = await col.findOne({ id: parts[1] })
    return json({ ...updated, _id: undefined })
  }
  if (method === 'DELETE' && parts.length === 2) {
    await col.deleteOne({ id: parts[1] })
    return json({ ok: true })
  }
  return json({ error: 'Not found' }, 404)
}

async function handleExtract(request) {
  const body = await readBody(request)
  const { imageBase64, mimeType = 'image/jpeg' } = body
  if (!imageBase64) return json({ error: 'imageBase64 required' }, 400)

  const prompt = `You are an expert quantity surveyor. Analyze this architectural/construction drawing in detail.

Return ONLY valid JSON (no markdown, no comments) with this EXACT structure:
{
  "summary": {
    "totalRooms": number,
    "totalArea": number,
    "totalDoors": number,
    "totalWindows": number,
    "totalOpenings": number,
    "perimeter": number,
    "drawingType": "floor_plan|elevation|section|detail|site_plan|other",
    "scale": "string e.g. 1:100 or unknown"
  },
  "rooms": [
    { "name": "string", "width": number_meters, "length": number_meters, "area": number_m2, "perimeter": number_m }
  ],
  "openings": [
    { "type": "door|window|opening", "label": "D1, W2 etc if visible", "width": number_m, "height": number_m, "area": number_m2, "location": "string", "count": number }
  ],
  "items": [
    { "category": "floor|wall|ceiling|door|window|concrete|steel|paint|plaster|plumbing|electrical|insulation|tile|other",
      "description": "detailed item description with material/size",
      "quantity": number,
      "unit": "m2|m3|m|pcs|kg|L",
      "confidence": number_0_to_1,
      "unitPrice": estimated_USD_unit_price,
      "location": "where in the drawing" }
  ]
}

REQUIREMENTS:
- Identify EVERY door and window with its width × height and compute area.
- List every room with width, length, computed area and perimeter.
- For each room, generate BOQ items for: floor finish, wall paint/plaster (use perimeter × ceiling height 3m minus openings), ceiling, and any visible features.
- Include estimated unit prices in USD based on typical 2025 construction prices.
- If a dimension is not clearly visible, estimate reasonably and lower the confidence score.
- Be exhaustive: aim for 15-40 BOQ items minimum on a typical floor plan.
- NEVER include markdown fences. Output raw JSON only.`

  try {
    const llm = getLLM()
    const completion = await llm.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
          ],
        },
      ],
    })

    const text = completion.choices[0]?.message?.content || ''
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return json({ error: 'Failed to parse AI output', raw: text }, 500)
    const parsed = JSON.parse(match[0])
    return json(parsed)
  } catch (e) {
    console.error('AI extract error:', e)
    return json({ error: e.message || 'AI failed' }, 500)
  }
}

async function handleChat(request) {
  const body = await readBody(request)
  const { messages = [], sessionId, projectContext } = body

  const system = `You are an expert AI assistant for construction quantity surveying and estimation. Help with:
- Quantity takeoffs and BOQ generation
- Material calculations (concrete, steel, tiles, paint, etc.)
- Construction standards (NRM2, CESMM, local codes)
- Cost estimation and pricing
- Engineering formulas
Be concise, accurate, and practical. Provide formulas and numbers when relevant. Reply in the same language as the user.
${projectContext ? `\nCurrent project context:\n${JSON.stringify(projectContext).slice(0, 2000)}` : ''}`

  try {
    const llm = getLLM()
    const completion = await llm.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [
        { role: 'system', content: system },
        ...messages,
      ],
    })
    const reply = completion.choices[0]?.message?.content || ''

    if (sessionId) {
      const db = await getDb()
      await db.collection('chats').updateOne(
        { sessionId },
        {
          $set: { sessionId, updatedAt: new Date().toISOString() },
          $push: { messages: { $each: [...messages.slice(-1), { role: 'assistant', content: reply }] } },
        },
        { upsert: true }
      )
    }
    return json({ reply })
  } catch (e) {
    console.error('Chat error:', e)
    return json({ error: e.message || 'Chat failed' }, 500)
  }
}

export async function GET(request) {
  const parts = getRoute(request)
  if (parts[0] === 'health') return json({ status: 'ok', ts: Date.now() })
  if (parts[0] === 'projects') return handleProjects('GET', parts, request)
  return json({ error: 'Not found' }, 404)
}

export async function POST(request) {
  const parts = getRoute(request)
  if (parts[0] === 'projects') return handleProjects('POST', parts, request)
  if (parts[0] === 'ai' && parts[1] === 'extract') return handleExtract(request)
  if (parts[0] === 'ai' && parts[1] === 'chat') return handleChat(request)
  return json({ error: 'Not found' }, 404)
}

export async function PUT(request) {
  const parts = getRoute(request)
  if (parts[0] === 'projects') return handleProjects('PUT', parts, request)
  return json({ error: 'Not found' }, 404)
}

export async function DELETE(request) {
  const parts = getRoute(request)
  if (parts[0] === 'projects') return handleProjects('DELETE', parts, request)
  return json({ error: 'Not found' }, 404)
}
