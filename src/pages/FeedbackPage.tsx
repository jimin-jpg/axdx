import { useState, useEffect } from 'react'
import type { InterviewSession, AnswerFeedback } from '../types'
import { generateAllFeedbacks } from '../services/geminiApi'
import './feedback.css'

interface Props { session: InterviewSession; onSave: () => void; onRetry: () => void }

export default function FeedbackPage({ session, onSave, onRetry }: Props) {
  const [feedbacks, setFeedbacks] = useState<AnswerFeedback[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(0)

  useEffect(() => {
    ;(async () => {
      const fbs = await generateAllFeedbacks(session.setupData, session.questions, session.answers)
      setFeedbacks(fbs)
      session.feedbacks = fbs
      session.overallScore = fbs.length > 0 ? Math.round(fbs.reduce((s, f) => s + f.score, 0) / fbs.length) : 0
      setLoading(false)
    })()
  }, [session])

  const color = (s: number) => s >= 85 ? '#22c55e' : s >= 70 ? '#3b82f6' : s >= 55 ? '#f59e0b' : '#ef4444'
  const label = (s: number) => s >= 85 ? '우수' : s >= 70 ? '양호' : s >= 55 ? '보통' : '개선 필요'
  const avg = (key: keyof AnswerFeedback) => feedbacks.length > 0 ? Math.round(feedbacks.reduce((s, f) => s + (f[key] as number), 0) / feedbacks.length) : 0
  const overall = avg('score')
  const fmt = (s: number) => `${Math.floor(s / 60)}분 ${s % 60}초`

  if (loading) return (
    <div className="fb-center">
      <div className="loading-spinner" />
      <p style={{ color: 'var(--text-primary)', marginTop: 16 }}>AI가 답변을 분석하고 있습니다...</p>
      <span style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 8 }}>논리성 · 구체성 · 직무 적합성 평가 중</span>
    </div>
  )

  const cf = feedbacks[activeTab]
  const ca = session.answers[activeTab]
  const cq = session.questions[activeTab]

  return (
    <div className="fb-page">
      <div className="fb-header">
        <div><h2>면접 결과 리포트</h2><span className="fb-date">{session.date} · {fmt(session.duration)}</span></div>
        <div className="fb-header-btns">
          <button className="btn-retry" onClick={onRetry}>다시 연습</button>
          <button className="btn-save" onClick={onSave}>대시보드 저장 →</button>
        </div>
      </div>

      <div className="fb-overview">
        <div className="fb-score-main">
          <div className="fb-circle" style={{ '--c': color(overall) } as React.CSSProperties}>
            <span className="fb-score-num">{overall}</span><span className="fb-score-max">/100</span>
          </div>
          <div>
            <span className="fb-label" style={{ color: color(overall) }}>{label(overall)}</span>
            <span className="fb-sub">{session.setupData.jobRole} · {session.questions.length}개 질문</span>
          </div>
        </div>
        <div className="fb-breakdown">
          {[['논리성', avg('logic')], ['구체성', avg('specificity')], ['직무 적합성', avg('relevance')]].map(([l, v]) => (
            <div key={l} className="fb-metric">
              <div className="fb-metric-header"><span>{l}</span><span style={{ fontWeight: 700 }}>{v}</span></div>
              <div className="fb-bar"><div className="fb-bar-fill" style={{ width: `${v}%`, background: color(v as number) }} /></div>
            </div>
          ))}
        </div>
      </div>

      <div className="fb-tabs">
        {session.questions.map((q, i) => (
          <button key={q.id} className={`fb-tab ${activeTab === i ? 'active' : ''}`} onClick={() => setActiveTab(i)}>
            <span>Q{i + 1}</span>
            {feedbacks[i] && <span style={{ color: color(feedbacks[i].score), fontWeight: 700, fontSize: 12 }}>{feedbacks[i].score}</span>}
          </button>
        ))}
      </div>

      {cf && cq && (
        <div className="fb-detail animate-in">
          <div className="fb-detail-q"><span className="fb-badge">질문</span><p>{cq.text}</p></div>
          <div className="fb-detail-a"><span className="fb-badge accent">내 답변</span><p>{ca?.text}</p></div>
          <div className="fb-grid">
            <div className="fb-strengths"><h4>✦ 잘한 점</h4><ul>{cf.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul></div>
            <div className="fb-improvements"><h4>◈ 개선할 점</h4><ul>{cf.improvements.map((s, i) => <li key={i}>{s}</li>)}</ul></div>
          </div>
          <div className="fb-summary"><h4>AI 종합 피드백</h4><p>{cf.summary}</p></div>
        </div>
      )}
    </div>
  )
}
