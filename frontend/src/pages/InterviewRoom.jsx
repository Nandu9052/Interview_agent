import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'
import { Cpu, Send, ChevronRight, Flag, Clock, Mic, MicOff, CheckCircle2, AlertCircle, Loader2, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import './InterviewRoom.css'

const QUESTION_COUNT = 5

function TypingIndicator() {
  return (
    <div className="typing-indicator">
      <span /><span /><span />
    </div>
  )
}

function ScoreBar({ score }) {
  const pct = (score / 10) * 100
  const color = pct >= 70 ? 'success' : pct >= 50 ? 'warning' : 'danger'
  return (
    <div className="score-bar-wrap">
      <span className="score-bar-label">{score}/10</span>
      <div className="progress-bar" style={{flex:1}}>
        <div className={`progress-fill ${color}`} style={{width: `${pct}%`}} />
      </div>
    </div>
  )
}

export default function InterviewRoom() {
  const { sessionId } = useParams()
  const nav = useNavigate()

  const [interview, setInterview] = useState(null)
  const [currentQ, setCurrentQ] = useState(null)
  const [answer, setAnswer] = useState('')
  const [evaluation, setEvaluation] = useState(null)
  const [phase, setPhase] = useState('loading') // loading | question | answering | evaluating | feedback | completing
  const [questionNum, setQuestionNum] = useState(0)
  const [timer, setTimer] = useState(0)
  const [messages, setMessages] = useState([])
  const [isListening, setIsListening] = useState(false)

  const timerRef = useRef(null)
  const answerRef = useRef(null)
  const chatEndRef = useRef(null)
  const recognitionRef = useRef(null)

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => { scrollToBottom() }, [messages])

  // Load interview & get first question
  useEffect(() => {
    api.get(`/interviews/${sessionId}`).then(r => {
      setInterview(r.data.interview)
      addMessage('ai', `Welcome to your ${r.data.interview.difficulty} ${r.data.interview.role} interview! I'm your AI interviewer powered by IBM Granite 4. We'll cover ${r.data.interview.topics?.join(', ')}. Let's begin with the first question.`)
      setTimeout(() => fetchNextQuestion(), 1200)
    }).catch(() => {
      toast.error('Interview session not found')
      nav('/interview/start')
    })
  }, [sessionId])

  // Timer
  useEffect(() => {
    if (phase === 'answering') {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
    } else {
      clearInterval(timerRef.current)
      if (phase === 'question') setTimer(0)
    }
    return () => clearInterval(timerRef.current)
  }, [phase])

  const addMessage = (role, content, extra = {}) => {
    setMessages(prev => [...prev, { role, content, ...extra, id: Date.now() + Math.random() }])
  }

  const fetchNextQuestion = useCallback(async () => {
    setPhase('loading')
    const topics = interview?.topics || ['General']
    const topic = topics[questionNum % topics.length]
    try {
      const r = await api.post(`/interviews/${sessionId}/question`, { topic })
      setCurrentQ(r.data)
      addMessage('ai', r.data.question, { questionNum: questionNum + 1, type: r.data.type, topic })
      setPhase('answering')
      setQuestionNum(n => n + 1)
      setTimeout(() => answerRef.current?.focus(), 100)
    } catch {
      addMessage('ai', "I encountered an issue generating the next question. Let's try again.")
      setPhase('answering')
    }
  }, [sessionId, questionNum, interview])

  // Need interview before fetching; re-fetch when interview loads
  const [interviewLoaded, setInterviewLoaded] = useState(false)
  useEffect(() => {
    if (interview && !interviewLoaded) {
      setInterviewLoaded(true)
    }
  }, [interview])

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) return toast.error('Please type your answer before submitting')
    const answerText = answer.trim()
    addMessage('user', answerText)
    setAnswer('')
    setPhase('evaluating')

    try {
      const r = await api.post(`/interviews/${sessionId}/answer`, {
        question_id: currentQ.question_id,
        answer: answerText,
      })
      setEvaluation(r.data.evaluation)
      addMessage('ai', r.data.evaluation.feedback, {
        isEvaluation: true,
        evaluation: r.data.evaluation,
      })
      setPhase('feedback')
    } catch {
      addMessage('ai', "I had trouble evaluating your answer. Let's continue to the next question.")
      setPhase('feedback')
    }
  }

  const handleNext = () => {
    setEvaluation(null)
    if (questionNum >= QUESTION_COUNT) {
      handleFinish()
    } else {
      fetchNextQuestion()
    }
  }

  const handleFinish = async () => {
    setPhase('completing')
    addMessage('ai', "Excellent! You've completed all questions. I'm now generating your comprehensive performance report...")
    try {
      const r = await api.post(`/interviews/${sessionId}/complete`)
      setTimeout(() => nav(`/interview/${sessionId}/report`), 1500)
    } catch {
      toast.error('Failed to generate report')
      setPhase('feedback')
    }
  }

  const toggleSpeech = () => {
    if (!('webkitSpeechRecognition' in window)) return toast.error('Speech recognition not supported in this browser')
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
    const rec = new SpeechRecognition()
    rec.continuous = true
    rec.interimResults = true
    rec.onresult = e => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('')
      setAnswer(transcript)
    }
    rec.onend = () => setIsListening(false)
    rec.start()
    recognitionRef.current = rec
    setIsListening(true)
  }

  const formatTime = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
  const progress = Math.round((questionNum / QUESTION_COUNT) * 100)

  return (
    <div className="interview-room">
      {/* Header bar */}
      <div className="room-header">
        <div className="room-header-left">
          <div className="room-ai-avatar">
            <Cpu size={18} color="var(--accent)" />
          </div>
          <div>
            <div className="room-title">AI Interview Session</div>
            <div className="room-subtitle">
              {interview ? `${interview.role} · ${interview.difficulty}` : 'Loading...'}
            </div>
          </div>
        </div>

        <div className="room-header-center">
          <div className="room-progress">
            <span className="room-progress-text">Question {Math.min(questionNum, QUESTION_COUNT)} of {QUESTION_COUNT}</span>
            <div className="progress-bar" style={{width: 160}}>
              <div className="progress-fill" style={{width: `${progress}%`}} />
            </div>
          </div>
        </div>

        <div className="room-header-right">
          {phase === 'answering' && (
            <div className="room-timer">
              <Clock size={13} />
              <span>{formatTime(timer)}</span>
            </div>
          )}
          {questionNum > 0 && questionNum >= QUESTION_COUNT && phase !== 'completing' && (
            <button className="btn btn-secondary btn-sm" onClick={handleFinish}>
              <Flag size={13} /> Finish
            </button>
          )}
        </div>
      </div>

      {/* Chat feed */}
      <div className="room-chat">
        {messages.map(msg => (
          <div key={msg.id} className={`chat-msg chat-msg-${msg.role}`}>
            {msg.role === 'ai' && (
              <div className="chat-avatar chat-avatar-ai">
                <Cpu size={14} color="var(--accent)" />
              </div>
            )}
            <div className={`chat-bubble chat-bubble-${msg.role}`}>
              {msg.questionNum && (
                <div className="chat-question-meta">
                  <span className="badge badge-accent">Q{msg.questionNum}</span>
                  <span className="badge badge-muted">{msg.topic}</span>
                  <span className="badge badge-muted" style={{textTransform:'capitalize'}}>{msg.type}</span>
                </div>
              )}
              <p>{msg.content}</p>
              {msg.isEvaluation && msg.evaluation && (
                <div className="chat-evaluation">
                  <div className="chat-eval-score">
                    <ScoreBar score={msg.evaluation.score} />
                  </div>
                  {msg.evaluation.strengths?.length > 0 && (
                    <div className="chat-eval-section">
                      <div className="chat-eval-section-title success-text">
                        <CheckCircle2 size={12} /> Strengths
                      </div>
                      {msg.evaluation.strengths.map((s, i) => (
                        <div key={i} className="chat-eval-point">· {s}</div>
                      ))}
                    </div>
                  )}
                  {msg.evaluation.improvements?.length > 0 && (
                    <div className="chat-eval-section">
                      <div className="chat-eval-section-title warning-text">
                        <AlertCircle size={12} /> Areas to Improve
                      </div>
                      {msg.evaluation.improvements.map((s, i) => (
                        <div key={i} className="chat-eval-point">· {s}</div>
                      ))}
                    </div>
                  )}
                  {msg.evaluation.sample_answer && (
                    <div className="chat-eval-sample">
                      <div className="chat-eval-section-title">
                        <BookOpen size={12} /> Model Answer
                      </div>
                      <p>{msg.evaluation.sample_answer}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="chat-avatar chat-avatar-user">U</div>
            )}
          </div>
        ))}

        {(phase === 'loading' || phase === 'evaluating' || phase === 'completing') && (
          <div className="chat-msg chat-msg-ai">
            <div className="chat-avatar chat-avatar-ai">
              <Cpu size={14} color="var(--accent)" />
            </div>
            <div className="chat-bubble chat-bubble-ai">
              <TypingIndicator />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      <div className="room-input-area">
        {phase === 'feedback' && (
          <div className="room-next-bar">
            <div className="room-next-info">
              {questionNum >= QUESTION_COUNT
                ? '🎉 All questions answered! Ready to see your report?'
                : `Question ${questionNum} of ${QUESTION_COUNT} complete. Ready for the next?`}
            </div>
            <button className="btn btn-primary" onClick={handleNext}>
              {questionNum >= QUESTION_COUNT
                ? <><Flag size={15} /> Generate Report</>
                : <>Next Question <ChevronRight size={15} /></>}
            </button>
          </div>
        )}

        {phase === 'answering' && (
          <div className="room-answer-input">
            <textarea
              ref={answerRef}
              className="input room-textarea"
              placeholder="Type your answer here... Be thorough and specific."
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleSubmitAnswer() }}
              rows={3}
            />
            <div className="room-input-actions">
              <button
                className={`btn btn-ghost btn-sm room-mic-btn${isListening ? ' listening' : ''}`}
                onClick={toggleSpeech}
                title="Toggle voice input">
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                <span>{isListening ? 'Stop Recording' : 'Voice Input'}</span>
              </button>
              <span className="room-hint">Ctrl+Enter to submit</span>
              <div style={{flex:1}} />
              <button
                className="btn btn-primary"
                onClick={handleSubmitAnswer}
                disabled={!answer.trim()}>
                <Send size={15} /> Submit Answer
              </button>
            </div>
          </div>
        )}

        {(phase === 'evaluating' || phase === 'completing') && (
          <div className="room-processing">
            <Loader2 size={16} className="spin-icon" />
            <span>{phase === 'evaluating' ? 'IBM Granite is evaluating your answer...' : 'Generating your performance report...'}</span>
          </div>
        )}
      </div>
    </div>
  )
}
