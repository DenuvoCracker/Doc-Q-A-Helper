import ReactMarkdown from 'react-markdown';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { askQuestion, fetchDocuments, analyzeResume, jobMatch } from '../api';
import styles from './Chat.module.css';

function SourceCard({ source, index }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <button
      className={styles.sourceCard}
      onClick={() => setExpanded(e => !e)}
    >
      <div className={styles.sourceHeader}>
        <div>
          <span className={styles.sourceLabel}>{source.label}</span>
          <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
            Chunk {source.chunkIndex}
          </div>
        </div>
        <span className={styles.sourceSim}>{source.similarity}% match</span>
        <span className={styles.sourceChevron}>{expanded ? '▴' : '▾'}</span>
      </div>
      {expanded && (
        <p className={styles.sourceContent}>{source.content}</p>
      )}
    </button>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`${styles.messageWrap} ${isUser ? styles.userWrap : styles.assistantWrap}`}>
      {!isUser && (
        <div className={styles.avatarMark}>✦</div>
      )}
      <div className={`${styles.bubble} ${isUser ? styles.userBubble : styles.assistantBubble}`}>
      <div className={styles.messageText}>
        <ReactMarkdown>
          {message.content}
        </ReactMarkdown>
      </div>
        {message.streaming && (
          <span className={styles.cursor} aria-hidden="true" />
        )}
        {message.sources && message.sources.length > 0 && (
          <div className={styles.sources}>
            <p className={styles.sourcesLabel}>From the document:</p>
            <div className={styles.sourcesList}>
              {message.sources.map((s, i) => (
                <SourceCard key={i} source={s} index={i} />
              ))}
            </div>
          </div>
        )}
        {message.error && (
          <p className={styles.errorText}>{message.error}</p>
        )}
      </div>
    </div>
  );
}

const SUGGESTIONS = [
  'What is this document about?',
  'Summarise the key points',
  'What are the main conclusions?',
  'What problems does this document address?',
];

export default function Chat() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [doc, setDoc] = useState(location.state?.doc || null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [searchAllDocs, setSearchAllDocs] = useState(false);
  const [showJobMatch, setShowJobMatch] = useState(false);
  const [jobDescription, setJobDescription] = useState('');

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!doc) {
      fetchDocuments().then(docs => {
        const found = docs.find(d => String(d.id) === String(documentId));
        if (found) setDoc(found);
        else navigate('/');
      });
    }
  }, [doc, documentId, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
    }
  }, [input]);

  const handleResumeAnalysis = async () => {
    if (!documentId || isStreaming) return;
  
    setIsStreaming(true);
  
    const assistantId = Date.now();
  
    setMessages(prev => [
      ...prev,
      {
        id: assistantId,
        role: 'assistant',
        content: '',
        streaming: true,
        error: null,
      }
    ]);
  
    await analyzeResume({
      documentId: Number(documentId),
  
      onToken: (text) => {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content: msg.content + text,
                }
              : msg
          )
        );
      },
  
      onDone: () => {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantId
              ? {
                  ...msg,
                  streaming: false,
                }
              : msg
          )
        );
  
        setIsStreaming(false);
      },
  
      onError: (err) => {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantId
              ? {
                  ...msg,
                  streaming: false,
                  error: err,
                }
              : msg
          )
        );
  
        setIsStreaming(false);
      },
    });
  };

  const handleJobMatch = async () => {
    if (!documentId || !jobDescription.trim() || isStreaming) return;
  
    setIsStreaming(true);
  
    const assistantId = Date.now();
  
    setMessages(prev => [
      ...prev,
      {
        id: assistantId,
        role: 'assistant',
        content: '',
        streaming: true,
        error: null,
      }
    ]);
  
    await jobMatch({
      documentId: Number(documentId),
      jobDescription,
  
      onToken: (text) => {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content: msg.content + text,
                }
              : msg
          )
        );
      },
  
      onDone: () => {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantId
              ? {
                  ...msg,
                  streaming: false,
                }
              : msg
          )
        );
  
        setIsStreaming(false);
      },
  
      onError: (err) => {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantId
              ? {
                  ...msg,
                  streaming: false,
                  error: err,
                }
              : msg
          )
        );
  
        setIsStreaming(false);
      },
    });
  };

  const sendMessage = useCallback(async (questionText) => {
    const question = (questionText || input).trim();
    if (!question || isStreaming) return;

    setInput('');
    setIsStreaming(true);

    const userMsg = { id: Date.now(), role: 'user', content: question };
    const assistantId = Date.now() + 1;
    const assistantMsg = {
      id: assistantId,
      role: 'assistant',
      content: '',
      streaming: true,
      sources: null,
      error: null,
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);

    await askQuestion({
      question,
      documentId: searchAllDocs
        ? null
        : Number(documentId),
      onSources: (sources) => {
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, sources } : m
        ));
      },
      onToken: (text) => {
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, content: m.content + text } : m
        ));
      },
      onDone: () => {
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, streaming: false } : m
        ));
        setIsStreaming(false);
        inputRef.current?.focus();
      },
      onError: (err) => {
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, streaming: false, error: `Error: ${err}` } : m
        ));
        setIsStreaming(false);
      },
    });
  }, [input, isStreaming, documentId, searchAllDocs]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
          </svg>
          Library
        </button>

        {doc && (
          <div className={styles.docInfo}>
            <div className={styles.docInfoIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <p className={styles.docInfoName}>{doc.original_name}</p>
            <div className={styles.docInfoMeta}>
              <span>{doc.page_count} pages</span>
              <span>{doc.chunk_count} chunks indexed</span>
            </div>
          </div>
        )}

        <div className={styles.sidebarDivider} />

        <button className={styles.analysisBtn} onClick={handleResumeAnalysis} disabled={isStreaming}>
          📄 Resume Insights
        </button>

        <button className={`${styles.featureBtn} ${showJobMatch ? styles.featureBtnActive : ''}`} onClick={() => setShowJobMatch(prev => !prev)}>
          💼 Job Match
        </button>
        {showJobMatch && (
          <div className={styles.jobMatchBox}>
            <textarea
              className={styles.jobTextarea}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste job description here..."
            />
            <button
              className={styles.jobMatchBtn}
              onClick={handleJobMatch}
            >
              Analyze Match
            </button>
          </div>
        )}

        <p className={styles.sidebarHint}>
          DocMind uses RAG to search your document semantically, then generates answers grounded in the text.
        </p>
      </aside>

      <div className={styles.chatArea}>
        <div className={styles.messages}>
          {isEmpty ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>
                {searchAllDocs ? (
                  <>
                    Ask anything across<br />
                    <em>all uploaded documents</em>
                  </>
                ) : (
                  <>
                    Ask anything about<br />
                    <em>{doc?.original_name || 'this document'}</em>
                  </>
                )}
              </p>
              <div className={styles.suggestions}>
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    className={styles.suggestion}
                    onClick={() => sendMessage(s)}
                    style={{ animationDelay: `${i * 0.08}s` }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={msg.id} style={{ animationDelay: `${i * 0.03}s` }} className="animate-fade-up">
                <MessageBubble message={msg} />
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className={styles.inputArea}>
          <div className={styles.searchScope}>
            <label>
              <input
                type="radio"
                checked={!searchAllDocs}
                onChange={() => setSearchAllDocs(false)}
              />
              Current Document
            </label>

            <label>
              <input
                type="radio"
                checked={searchAllDocs}
                onChange={() => setSearchAllDocs(true)}
              />
              All Documents
            </label>
          </div>
          <div className={styles.inputWrap}>
            <textarea
              ref={(el) => { textareaRef.current = el; inputRef.current = el; }}
              className={styles.textarea}
              placeholder="Ask a question about this document…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isStreaming}
              aria-label="Ask a question"
            />
            <button
              className={styles.sendBtn}
              onClick={() => sendMessage()}
              disabled={!input.trim() || isStreaming}
              aria-label="Send question"
            >
              {isStreaming ? (
                <svg className={styles.spinner} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              )}
            </button>
          </div>
          <p className={styles.inputHint}>Shift+Enter for new line · answers sourced from your document only</p>
        </div>
      </div>
    </div>
  );
}
