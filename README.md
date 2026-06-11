# DocMind - AI-Powered Document Intelligence Platform

DocMind is a full-stack Retrieval-Augmented Generation (RAG) application that enables users to upload PDF documents, ask context-aware questions, analyze resumes, and evaluate job fit against specific job descriptions.

The platform combines semantic search, vector embeddings, PostgreSQL vector storage, and Google's Gemini models to deliver grounded answers based on uploaded documents rather than relying on external knowledge.

---

## Features

### Document Question Answering

* Upload PDF documents and extract text automatically
* Semantic search powered by vector embeddings
* Retrieval-Augmented Generation (RAG) pipeline
* Context-aware answers grounded in document content
* Source attribution with retrieved document chunks
* Real-time streamed responses using Server-Sent Events (SSE)

### Resume Analysis

Upload a resume and receive:

* ATS-style score estimation
* Technical skills assessment
* Resume strengths and weaknesses
* Missing industry-standard sections
* Actionable improvement suggestions
* Internship and entry-level software engineering focused feedback

### Job Match Analysis

Compare a resume against a job description and receive:

* Match score
* Matching skills
* Missing skills
* Role-specific strengths
* Role-specific weaknesses
* Recommended projects
* Recommended certifications
* Personalized action plan

### Document Management

* Upload multiple PDF documents
* View processed documents
* Delete uploaded documents
* Track page count and chunk count

---

## Architecture

```text
                        ┌──────────────────┐
                        │      User        │
                        └────────┬─────────┘
                                 │
                                 ▼
                   ┌──────────────────────────┐
                   │ React + Vite Frontend    │
                   └────────┬─────────────────┘
                            │
                            ▼
                   ┌──────────────────────────┐
                   │ Express API Server       │
                   └────────┬─────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼

    PDF Processing      Resume AI       Job Match AI

          │
          ▼

      Chunking

          │
          ▼

 Gemini Embeddings
 (gemini-embedding-001)

          │
          ▼

 PostgreSQL + pgvector

          │
          ▼

 Vector Similarity Search

          │
          ▼

 Gemini 2.5 Flash

          │
          ▼

 Streamed Response
```

---

## How It Works

### 1. Document Upload

When a PDF is uploaded:

1. Text is extracted using `pdf-parse`
2. Text is cleaned and validated
3. Content is split into semantic chunks
4. Embeddings are generated using Gemini Embeddings
5. Embeddings are stored in PostgreSQL using pgvector

### 2. Retrieval

When a question is asked:

1. The question is converted into an embedding
2. PostgreSQL performs vector similarity search
3. The most relevant chunks are retrieved
4. Retrieved chunks become context for the LLM

### 3. Answer Generation

Gemini 2.5 Flash receives:

* User question
* Retrieved document context

The model is explicitly instructed to:

* Use only retrieved context
* Avoid hallucinations
* Cite supporting sources
* Admit when information is unavailable

Responses are streamed back to the frontend in real time.

---

## Tech Stack

### Frontend

* React
* Vite
* React Router
* Axios
* React Markdown
* CSS Modules

### Backend

* Node.js
* Express.js
* Multer
* Server-Sent Events (SSE)

### Database

* PostgreSQL
* pgvector

### AI & Machine Learning

* Google Gemini 2.5 Flash
* Gemini Embeddings (`gemini-embedding-001`)
* Retrieval-Augmented Generation (RAG)

### Document Processing

* pdf-parse

### Deployment

* Vercel (Frontend)
* Render (Backend)

---

## Database Schema

### documents

Stores uploaded document metadata.

| Column        | Description                |
| ------------- | -------------------------- |
| id            | Document ID                |
| filename      | Stored filename            |
| original_name | Original uploaded filename |
| page_count    | Number of pages            |
| chunk_count   | Number of generated chunks |
| created_at    | Upload timestamp           |

### chunks

Stores document chunks and embeddings.

| Column      | Description      |
| ----------- | ---------------- |
| id          | Chunk ID         |
| document_id | Parent document  |
| content     | Chunk text       |
| chunk_index | Chunk order      |
| embedding   | Vector embedding |

---

## API Endpoints

### Documents

#### Get Documents

```http
GET /api/documents
```

#### Upload Document

```http
POST /api/documents/upload
```

#### Delete Document

```http
DELETE /api/documents/:id
```

---

### Question Answering

```http
POST /api/ask
```

Request:

```json
{
  "question": "What skills are mentioned?",
  "documentId": 1
}
```

---

### Resume Analysis

```http
POST /api/analyze
```

Request:

```json
{
  "documentId": 1
}
```

---

### Job Match Analysis

```http
POST /api/job-match
```

Request:

```json
{
  "documentId": 1,
  "jobDescription": "Software Engineer Intern..."
}
```

---

## Installation

### Clone Repository

```bash
git clone https://github.com/DenuvoCracker/Doc-Q-A-Helper.git
cd Doc-Q-A-Helper
```

### Install Dependencies

```bash
npm install
cd client && npm install
cd ../server && npm install
```

---

## Environment Variables

### Backend (`server/.env`)

```env
DATABASE_URL=your_postgresql_connection_string

GOOGLE_API_KEY=your_google_ai_api_key

PORT=3001

CLIENT_URL=http://localhost:5173
```

### Frontend (`client/.env`)

```env
VITE_API_URL=http://localhost:3001
```

---

## Database Setup

Initialize PostgreSQL tables and pgvector support:

```bash
npm run setup:db
```

---

## Run Locally

### Backend

```bash
cd server
npm start
```

### Frontend

```bash
cd client
npm run dev
```

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:3001
```

Health Check:

```text
http://localhost:3001/api/health
```

---

## Example Use Cases

### Document Intelligence

* Research papers
* Technical documentation
* Academic notes
* Company reports

### Resume Review

* ATS optimization
* Internship preparation
* Resume improvement

### Career Preparation

* Job description matching
* Skill gap analysis
* Project recommendations
* Certification suggestions

---

## Project Structure

```text
Doc-Q-A-Helper
│
├── client
│   ├── src
│   │   ├── pages
│   │   │   ├── Home.jsx
│   │   │   └── Chat.jsx
│   │   ├── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   └── package.json
│
├── server
│   ├── db
│   │   ├── index.js
│   │   └── setup.js
│   │
│   ├── routes
│   │   ├── documents.js
│   │   ├── ask.js
│   │   ├── analyze.js
│   │   └── jobMatch.js
│   │
│   ├── utils
│   │   ├── chunker.js
│   │   ├── embedder.js
│   │   ├── retriever.js
│   │   └── openaiClient.js
│   │
│   └── index.js
│
└── README.md
```

---

## Future Enhancements

* OCR support for scanned PDFs
* Multi-document retrieval
* Conversation history
* User authentication
* Workspace-based document organization
* Hybrid retrieval (keyword + vector search)
* Advanced citation highlighting
* Resume version tracking
* Exportable analysis reports

---

## Learning Outcomes

This project demonstrates:

* Retrieval-Augmented Generation (RAG)
* Semantic Search
* Vector Databases
* Embedding Models
* PostgreSQL + pgvector
* LLM Integration
* Streaming AI Responses
* Full-Stack Development
* Cloud Deployment
* AI-Powered Career Assistance

---

## Author

**Hrishit Rai**

Built to explore practical applications of Retrieval-Augmented Generation, semantic search, vector databases, and AI-powered document intelligence.
