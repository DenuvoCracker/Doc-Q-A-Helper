import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  timeout: 60000,
});

export async function fetchDocuments() {
  const { data } = await api.get('/documents');
  return data.documents;
}

export async function uploadDocument(file, onProgress) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    },
  });
  return data;
}

export async function deleteDocument(id) {
  await api.delete(`/documents/${id}`);
}

export async function askQuestion({ question, documentId, onSources, onToken, onDone, onError }) {
  try {
    const response = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, documentId }),
    });

    if (!response.ok) {
      onError(`Request failed (${response.status})`);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (!raw) continue;
        try {
          const event = JSON.parse(raw);
          if (event.type === 'sources') onSources(event.sources);
          else if (event.type === 'token') onToken(event.text);
          else if (event.type === 'done') onDone();
          else if (event.type === 'error') onError(event.message);
        } catch {}
      }
    }
  } catch (err) {
    onError(err.message);
  }
}

export async function analyzeResume({
  documentId,
  onToken,
  onDone,
  onError,
}) {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documentId,
      }),
    });

    if (!response.ok) {
      onError(`Request failed (${response.status})`);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, {
        stream: true,
      });

      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;

        const raw = line.slice(6).trim();

        if (!raw) continue;

        try {
          const event = JSON.parse(raw);

          if (event.type === 'token') {
            onToken(event.text);
          }
          else if (event.type === 'done') {
            onDone();
          }
          else if (event.type === 'error') {
            onError(event.message);
          }
        } catch {}
      }
    }
  } catch (err) {
    onError(err.message);
  }
}

export async function jobMatch({
  documentId,
  jobDescription,
  onToken,
  onDone,
  onError,
}) {
  try {
    const response = await fetch('/api/job-match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documentId,
        jobDescription,
      }),
    });

    if (!response.ok) {
      onError(`Request failed (${response.status})`);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, {
        stream: true,
      });

      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;

        const raw = line.slice(6).trim();

        if (!raw) continue;

        try {
          const event = JSON.parse(raw);

          if (event.type === 'token') {
            onToken(event.text);
          }
          else if (event.type === 'done') {
            onDone();
          }
          else if (event.type === 'error') {
            onError(event.message);
          }
        } catch {}
      }
    }
  } catch (err) {
    onError(err.message);
  }
}
