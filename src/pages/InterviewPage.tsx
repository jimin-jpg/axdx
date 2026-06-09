/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from 'react'
import type { SetupData, Question, Answer, InterviewSession } from '../types'
import { generateQuestions } from '../services/geminiApi'
import './interview.css'

interface Props {
  setupData: SetupData
  onComplete: (session: InterviewSession) => void
  onBack: () => void
}

type Status = 'loading' | 'ready' | 'answering' | 'processing' | 'done'
type InputMode = 'voice' | 'text'

export default function InterviewPage({ setupData, onComplete, onBack }: Props) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [status, setStatus] = useState<Status>('loading')
  const [inputMode, setInputMode] = useState<InputMode>('voice')
  const [transcript, setTranscript] = useState('')
  const [textInput, setTextInput] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<any>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const sessionStartRef = useRef<number>(Date.now())
  const finalTranscriptRef = useRef<string>('')

  useEffect(() => {
    ;(async () => {
      try {
        const qs = await generateQuestions(setupData)
        setQuestions(qs)
        setStatus('ready')
      } catch {
        setError('질문 생성에 실패했습니다.')
      }
    })()
  }, [setupData])

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now()
    timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000)), 1000)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    return Math.floor((Date.now() - startTimeRef.current) / 1000)
  }, [])

  const startVoice = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { setInputMode('text'); return }

    finalTranscriptRef.current = ''
    setTranscript('')

    const rec = new SR()
    rec.lang = 'ko-KR'
    rec.continuous = true
    rec.interimResults = true

    rec.onresult = (e: any) => {
      let interimText = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) {
          finalTranscriptRef.current += t
        } else {
          interimText += t
        }
      }
      setTranscript(finalTranscriptRef.current + interimText)
    }

    rec.onerror = () => {}
    recognitionRef.current = rec
    rec.start()
    startTimer()
    setStatus('answering')
  }, [startTimer])

  const submitAnswer = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    const duration = stopTimer()
    const answerText = inputMode === 'voice' ? finalTranscriptRef.current || transcript : textInput
    if (!answerText.trim()) return

    const currentQ = questions[currentIdx]
    const newAnswer: Answer = { questionId: currentQ.id, text: answerText.trim(), duration }
    const updatedAnswers = [...answers, newAnswer]
    setAnswers(updatedAnswers)
    setTranscript('')
    setTextInput('')
    setElapsed(0)
    finalTranscriptRef.current = ''
    setStatus('processing')

    const isLast = currentIdx >= questions.length - 1
    if (!isLast) {
      setTimeout(() => { setCurrentIdx(prev => prev + 1); setStatus('ready') }, 400)
    } else {
      const totalTime = Math.floor((Date.now() - sessionStartRef.current) / 1000)
      const session: InterviewSession = {
        id: `session_${Date.now()}`,
        date: new Date().toLocaleDateString('ko-KR'),
        setupData, questions,
        answers: updatedAnswers,
        feedbacks: [], overallScore: 0, duration: totalTime,
        completedAt: new Date().toISOString(),
      }
      onComplete(session)
    }
  }, [inputMode, transcript, textInput, questions, currentIdx, answers, stopTimer, setupData, onComplete])

  const currentQ = questions[currentIdx]
  const progress = questions.length > 0 ? (currentIdx / questions.length) * 100 : 0

  if (error) return (
    <div className="iv-center">
      <div className="error-card"><div className="error-icon">⚠</div><p>{error}</p><button onClick={onBack}>돌아가기</button></div>
    </div>
  )

  if (status === 'loading') return (
    <div className="iv-center">
      <div className="loading-spinner" />
      <p style={{ color: 'var(--text-primary)', marginTop: 16 }}>AI가 맞춤형 질문을 생성하고 있습니다...</p>
      <span style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 8 }}>{setupData.jobRole} 직무 분석 중</span>
    </div>
  )

  return (
    <div className="iv-page">
      <div className="iv-header">
        <button className="back-btn" onClick={onBack}>← 나가기</button>
        <div className="iv-meta">
          <span className="iv-role">{setupData.jobRole}</span>
          {setupData.company && <span className="iv-company">@ {setupData.company}</span>}
        </div>
        <div className="iv-counter">{currentIdx + 1} / {questions.length}</div>
      </div>

      <div className="iv-progress"><div className="iv-progress-fill" style={{ width: `${progress}%` }} /></div>

      <div className="iv-body">
        {currentQ && (
          <div className="iv-question animate-in">
            <div className="iv-q-badge">{currentQ.type === 'followup' ? '꼬리 질문' : `Q${currentIdx + 1}`}</div>
            <p className="iv-q-text">{currentQ.text}</p>
          </div>
        )}

        <div className="iv-mode-tabs">
          <button className={`mode-tab ${inputMode === 'voice' ? 'active' : ''}`} onClick={() => { setInputMode('voice'); if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null } setStatus('ready') }}>🎙 음성 답변</button>
          <button className={`mode-tab ${inputMode === 'text' ? 'active' : ''}`} onClick={() => { setInputMode('text'); if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null } setStatus('ready') }}>⌨ 텍스트 답변</button>
        </div>

        <div className="iv-answer-area">
          {inputMode === 'voice' && (
            <>
              {status === 'ready' && (
                <div className="iv-ready">
                  <p>마이크 버튼을 눌러 답변을 시작하세요</p>
                  <button className="mic-btn start" onClick={startVoice}>🎙 답변 시작</button>
                </div>
              )}
              {status === 'answering' && (
                <div className="iv-answering">
                  <div className="rec-indicator"><span className="rec-dot" /><span className="rec-time">{elapsed}초</span></div>
                  <div className="transcript-box">{transcript || <span className="transcript-ph">말씀하세요...</span>}</div>
                  <button className="mic-btn stop" onClick={submitAnswer} disabled={!transcript.trim()}>답변 완료 ■</button>
                </div>
              )}
              {status === 'processing' && (
                <div className="iv-ready"><div className="loading-spinner small" /><p style={{ marginTop: 8 }}>다음 질문 준비 중...</p></div>
              )}
            </>
          )}

          {inputMode === 'text' && (
            <div className="iv-text-mode">
              <textarea
                className="text-answer-input"
                placeholder="여기에 답변을 입력하세요..."
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                rows={6}
                disabled={status === 'processing'}
              />
              <div className="text-mode-footer">
                <span className="char-count">{textInput.length}자</span>
                <button className="submit-text-btn" onClick={submitAnswer} disabled={!textInput.trim() || status === 'processing'}>
                  {status === 'processing' ? '처리 중...' : '답변 제출 →'}
                </button>
              </div>
            </div>
          )}
        </div>

        {answers.length > 0 && (
          <div className="iv-prev">
            <h4>완료된 답변</h4>
            {answers.map((ans, i) => {
              const q = questions.find(q => q.id === ans.questionId)
              return (
                <div key={ans.questionId} className="iv-prev-item">
                  <span className="iv-prev-num">Q{i + 1}</span>
                  <div>
                    <p className="iv-prev-q">{q?.text}</p>
                    <p className="iv-prev-a">{ans.text.slice(0, 80)}{ans.text.length > 80 ? '...' : ''}</p>
                  </div>
                  <span className="check">✓</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
