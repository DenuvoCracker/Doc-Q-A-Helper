# Doc-QA Helper

A Retrieval-Augmented Generation (RAG) application that allows users to upload PDF documents and ask natural language questions about their contents.

The application uses semantic search powered by vector embeddings and generates answers grounded only in the uploaded documents, reducing hallucinations and ensuring reliable responses.

---

## Features

* Upload PDF documents
* Automatic PDF text extraction
* Intelligent document chunking
* Semantic search using vector embeddings
* Context-aware question answering
* Source citations for retrieved content
* Local AI inference using Ollama
* PostgreSQL + pgvector vector database
* Modern React-based user interface
* No paid APIs required

---

## How It Works

### 1. Document Upload

When a PDF is uploaded:

* Text is extracted using `pdf-parse`
* The document is split into smaller chunks
* Each chunk is converted into a vector embedding using `nomic-embed-text`
* Embeddings are stored in PostgreSQL using `pgvector`

### 2. Question Answering

When a user asks a question:

* The question is embedded using the same embedding model
* The most relevant document chunks are retrieved using vector similarity search
* Retrieved chunks are provided as context to the language model
* The model generates an answer based only on the retrieved context

This Retrieval-Augmented Generation (RAG) approach significantly reduces hallucinations and ensures answers remain grounded in the uploaded documents.

---

## Architecture

```
React Frontend
       |
       v
Node.js + Express Backend
       |
       v
PDF Processing (pdf-parse)
       |
       v
Chunking
       |
       v
nomic-embed-text (Ollama)
       |
       v
PostgreSQL + pgvector
       |
       v
Similarity Search
       |
       v
Llama 3.2 (Ollama)
       |
       v
Grounded Answer
```

---

## Tech Stack

### Frontend

* React
* Vite
* CSS Modules

### Backend

* Node.js
* Express.js

### Database

* PostgreSQL
* pgvector

### AI & Machine Learning

* Ollama
* Llama 3.2 (3B)
* nomic-embed-text

### Document Processing

* pdf-parse
* multer

---

## Installation

### Prerequisites

Install:

* Node.js
* PostgreSQL
* Docker Desktop
* Ollama

---

### Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/Doc-Q-A-Helper.git
cd Doc-Q-A-Helper
```

---

### Install Dependencies

```bash
npm install

cd client
npm install

cd ../server
npm install
```

---

### Start PostgreSQL + pgvector

Example Docker container:

```bash
docker run -d \
  --name docqa-pgvector \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=docqa \
  -p 5433:5432 \
  pgvector/pgvector:pg17
```

---

### Install Ollama Models

```bash
ollama pull llama3.2:3b
ollama pull nomic-embed-text
```

Verify:

```bash
ollama list
```

---

### Configure Environment

Create:

```env
server/.env
```

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/docqa
PORT=3001
```

---

### Initialize Database

```bash
npm run setup:db
```

---

### Start Application

```bash
npm run dev
```

Frontend:

```
http://localhost:5173
```

Backend:

```
http://localhost:3001
```

---

## Example Questions

* What skills does the candidate have?
* Summarize this document.
* What certifications are mentioned?
* What projects are described?
* What technologies are used?

---

## Project Structure

```
doc-qa/
├── server/
│   ├── routes/
│   │   ├── documents.js   
│   │   └── ask.js         
│   ├── utils/
│   │   ├── chunker.js     
│   │   ├── embedder.js    
│   │   ├── retriever.js   
│   │   └── openaiClient.js
│   ├── db/
│   │   ├── index.js       
│   │   └── setup.js       
│   └── index.js           
└── client/
    └── src/
        ├── pages/
        │   ├── Home.jsx   
        │   └── Chat.jsx   
        ├── api.js         
        └── App.jsx
```

---

## Future Improvements

* Multi-document retrieval
* Chat history persistence
* Resume analysis mode
* ATS scoring
* Hybrid search (BM25 + vector search)
* Authentication and user accounts
* Cloud deployment support

---

## Learning Outcomes

This project demonstrates:

* Retrieval-Augmented Generation (RAG)
* Vector Databases
* Semantic Search
* Embedding Models
* Local LLM Inference
* Full-Stack Development
* PostgreSQL Integration
* AI Application Development

---

## License

This project is intended for educational purposes.
