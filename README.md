# DocMind — AI Document Q&A

Upload a PDF. Ask it anything. Get cited answers grounded in your document.

**Live demo:** _add your Vercel URL here_

---

## What it does

1. **Upload a PDF** — the backend extracts text, splits it into overlapping chunks, and embeds each chunk using OpenAI's `text-embedding-3-small` model
2. **Ask a question** — your question is embedded and the 5 most semantically similar chunks are retrieved using cosine similarity in PostgreSQL (pgvector)
3. **Get a cited answer** — GPT-4o reads only those chunks and streams an answer back, citing which parts of the document it used

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, CSS Modules |
| Backend | Node.js, Express |
| Database | PostgreSQL + pgvector |
| AI | OpenAI `text-embedding-3-small` + `gpt-4o` |
| Deployment | Vercel (frontend) + Railway (backend + DB) |

## Architecture

```
User → React UI → Express API
                      ↓
                  pdf-parse         (extract text)
                  chunkText()       (split into 400-word chunks with 50-word overlap)
                  OpenAI Embeddings (convert each chunk to a 1536-dim vector)
                  pgvector          (store + similarity search)
                      ↓
                  findRelevantChunks() (cosine distance query)
                  GPT-4o (stream answer from retrieved context)
                      ↓
                  SSE stream → React UI (token by token)
```

## Local setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ with [pgvector](https://github.com/pgvector/pgvector) installed
- OpenAI API key

### 1. Clone and install

```bash
git clone https://github.com/yourusername/doc-qa
cd doc-qa
npm run install:all
```

### 2. Configure environment

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:
```
OPENAI_API_KEY=sk-your-key-here
DATABASE_URL=postgresql://postgres:password@localhost:5432/docqa
PORT=3001
```

### 3. Create the database

```bash
createdb docqa          # create Postgres database
npm run setup:db        # create tables + vector index
```

### 4. Run

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001/api/health

## Deployment

### Backend → Railway
1. Create a new project on [Railway](https://railway.app)
2. Add a PostgreSQL service — copy the `DATABASE_URL`
3. Deploy this repo's `server/` folder
4. Set env vars: `OPENAI_API_KEY`, `DATABASE_URL`, `NODE_ENV=production`, `CLIENT_URL=https://your-vercel-url.vercel.app`
5. Run the DB setup: in Railway shell → `node db/setup.js`

### Frontend → Vercel
1. Import the repo on [Vercel](https://vercel.com)
2. Set root directory to `client/`
3. Set env var: `VITE_API_URL=https://your-railway-url.railway.app`
4. Update `client/src/api.js` baseURL to use `import.meta.env.VITE_API_URL`

## Key design decisions

**Why overlap in chunking?** Answers that straddle chunk boundaries would be lost without overlap. 50-word overlap ensures context isn't cut off at boundaries.

**Why pgvector instead of Pinecone?** pgvector keeps the entire app in one database — simpler ops, no extra service, free on Railway. Pinecone makes sense at scale (millions of vectors), not for a portfolio project.

**Why `temperature: 0.2`?** Lower temperature makes the model stick closer to the provided context and hallucinate less. RAG is only as good as how faithfully the model uses the retrieved chunks.

**Why SSE for streaming?** Server-Sent Events are simpler than WebSockets for one-directional streaming. The browser's native `EventSource` API (or fetch + ReadableStream as used here) handles reconnection automatically.

## Project structure

```
doc-qa/
├── server/
│   ├── routes/
│   │   ├── documents.js   # upload, list, delete
│   │   └── ask.js         # RAG pipeline + streaming
│   ├── utils/
│   │   ├── chunker.js     # text splitting with overlap
│   │   ├── embedder.js    # OpenAI embeddings + DB storage
│   │   ├── retriever.js   # cosine similarity search
│   │   └── openaiClient.js
│   ├── db/
│   │   ├── index.js       # pg Pool
│   │   └── setup.js       # table + index creation
│   └── index.js           # Express app
└── client/
    └── src/
        ├── pages/
        │   ├── Home.jsx   # document library + upload
        │   └── Chat.jsx   # streaming Q&A interface
        ├── api.js         # axios + fetch SSE client
        └── App.jsx
```

---

Built with React, Node.js, PostgreSQL, pgvector, and OpenAI APIs.
