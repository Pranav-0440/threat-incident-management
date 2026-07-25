import { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, ArrowRight } from 'lucide-react';
import { incidentsAPI } from '../api/client';
import { Link } from 'react-router-dom';

export default function AiCopilotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      sender: 'ai',
      text: 'Hello Analyst! I am your AI SOC Assistant. How can I help with your security investigations today?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const msgCounter = useRef(100);

  const quickPrompts = [
    'What is highest priority?',
    'Summarize today incidents',
    'Recommend mitigation actions',
    'Show critical threats'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (queryText) => {
    const text = queryText || input;
    if (!text.trim() || loading) return;

    msgCounter.current += 1;
    const userMsgId = `user-${msgCounter.current}`;
    const userMsg = {
      id: userMsgId,
      sender: 'user',
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      // Fetch incidents context for intelligent response
      const res = await incidentsAPI.getAll();
      const incidents = res.data || [];
      
      const q = text.toLowerCase();
      let replyText = '';
      let actionLink = null;

      if (q.includes('priority') || q.includes('highest')) {
        const p1s = incidents.filter(i => i.priority === 'P1' || i.severity === 'CRITICAL');
        if (p1s.length > 0) {
          replyText = `Found ${p1s.length} P1 Critical Incident(s). Highest risk score is ${p1s[0].riskScore}/100: "${p1s[0].title}".`;
          actionLink = { label: 'View Incident', url: `/incidents/${p1s[0].id}` };
        } else {
          replyText = 'Great news! There are currently no P1 Critical incidents active. All systems operate within normal risk thresholds.';
        }
      } else if (q.includes('summarize') || q.includes('today')) {
        const total = incidents.length;
        const open = incidents.filter(i => i.status === 'OPEN' || i.status === 'INVESTIGATING').length;
        const critical = incidents.filter(i => i.severity === 'CRITICAL').length;
        replyText = `Today's Summary: ${total} total incidents logged. ${open} currently active under investigation, with ${critical} critical alerts needing immediate analyst review.`;
      } else if (q.includes('recommend') || q.includes('mitigat') || q.includes('action')) {
        replyText = `Recommended SOC Actions:\n1. Verify physical CCTV logs for unauthorized access.\n2. Revoke active API tokens & force MFA reset for targeted user accounts.\n3. Escalate any unassigned P1/P2 incidents to Senior Analyst.`;
      } else if (q.includes('critical') || q.includes('threat')) {
        const criticals = incidents.filter(i => i.severity === 'CRITICAL');
        replyText = `There are ${criticals.length} Critical Threat(s) logged in the database. Please review evidence files and complete investigation checklists immediately.`;
      } else {
        replyText = `I analyzed your query regarding "${text}". Based on current SOC metrics, there are ${incidents.length} total incidents tracked. Is there a specific incident ID or category you would like me to inspect?`;
      }

      msgCounter.current += 1;
      const aiMsgId = `ai-${msgCounter.current}`;
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: aiMsgId,
            sender: 'ai',
            text: replyText,
            link: actionLink,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setLoading(false);
      }, 600);

    } catch (err) {
      console.error(err);
      msgCounter.current += 1;
      const errorMsgId = `err-${msgCounter.current}`;
      setMessages((prev) => [
        ...prev,
        {
          id: errorMsgId,
          sender: 'ai',
          text: 'Sorry, I encountered a network issue analyzing live incident data.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          borderRadius: '50px',
          padding: '14px 20px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          color: '#ffffff',
          boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          border: 'none',
          cursor: 'pointer',
          transition: 'transform 0.2s ease, boxShadow 0.2s ease'
        }}
        id="ai-copilot-trigger"
      >
        <Sparkles size={20} className="animate-spin-slow" />
        <span style={{ fontWeight: 600, fontSize: '14px' }}>AI Copilot</span>
      </button>

      {/* Floating Chat Drawer */}
      {isOpen && (
        <div
          className="animate-scale-in"
          style={{
            position: 'fixed',
            bottom: '88px',
            right: '24px',
            width: '380px',
            maxHeight: '520px',
            height: '80vh',
            zIndex: 9999,
            backgroundColor: 'var(--color-bg-secondary, #0f172a)',
            border: '1px solid var(--color-border, #1e293b)',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              background: 'linear-gradient(90deg, #1e293b 0%, #0f172a 100%)',
              borderBottom: '1px solid var(--color-border, #334155)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(59, 130, 246, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#3b82f6'
                }}
              >
                <Bot size={20} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', color: '#f8fafc' }}>SOC Copilot AI</h4>
                <span style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span> Live SOC Intelligence
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Prompts Bar */}
          <div
            style={{
              padding: '10px 14px',
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              borderBottom: '1px solid var(--color-border, #1e293b)',
              background: 'rgba(15, 23, 42, 0.5)'
            }}
          >
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                style={{
                  fontSize: '11px',
                  whiteSpace: 'nowrap',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  color: '#60a5fa',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  cursor: 'pointer'
                }}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Chat Messages */}
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%'
                }}
              >
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    background: m.sender === 'user' ? '#2563eb' : 'rgba(30, 41, 59, 0.8)',
                    color: '#f8fafc',
                    border: m.sender === 'user' ? 'none' : '1px solid #334155',
                    whiteSpace: 'pre-line'
                  }}
                >
                  {m.text}
                  {m.link && (
                    <div style={{ marginTop: '8px' }}>
                      <Link
                        to={m.link.url}
                        onClick={() => setIsOpen(false)}
                        style={{
                          fontSize: '12px',
                          color: '#60a5fa',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          textDecoration: 'underline'
                        }}
                      >
                        {m.link.label} <ArrowRight size={12} />
                      </Link>
                    </div>
                  )}
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    color: '#64748b',
                    marginTop: '2px',
                    textAlign: m.sender === 'user' ? 'right' : 'left'
                  }}
                >
                  {m.time}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', background: 'rgba(30, 41, 59, 0.8)', padding: '10px 14px', borderRadius: '12px', color: '#94a3b8', fontSize: '13px' }}>
                <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Analyzing SOC logs...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div style={{ padding: '12px', borderTop: '1px solid var(--color-border, #1e293b)' }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              style={{ display: 'flex', gap: '8px' }}
            >
              <input
                type="text"
                className="form-input"
                placeholder="Ask AI Copilot..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                style={{ fontSize: '13px', padding: '8px 12px' }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !input.trim()}
                style={{ padding: '8px 12px' }}
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
