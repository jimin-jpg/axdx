import type { InterviewSession } from '../types'
import './dashboard.css'

interface Props { sessions: InterviewSession[]; onNewInterview: () => void; onBack: () => void }

const MOCK: InterviewSession[] = [
  { id: 'm1', date: '2026.04.10', setupData: { jobRole: '마케팅', company: '카카오', resumeText: '', interviewType: 'general' }, questions: [], answers: [], feedbacks: [], overallScore: 62, duration: 780, completedAt: '' },
  { id: 'm2', date: '2026.04.14', setupData: { jobRole: '마케팅', company: '카카오', resumeText: '', interviewType: 'general' }, questions: [], answers: [], feedbacks: [], overallScore: 71, duration: 910, completedAt: '' },
  { id: 'm3', date: '2026.04.17', setupData: { jobRole: '마케팅', company: '삼성전자', resumeText: '', interviewType: 'behavioral' }, questions: [], answers: [], feedbacks: [], overallScore: 78, duration: 850, completedAt: '' },
]

export default function DashboardPage({ sessions, onNewInterview, onBack }: Props) {
  const all = sessions.length > 0 ? sessions : MOCK
  const sorted = [...all].sort((a, b) => a.date.localeCompare(b.date))
  const color = (s: number) => s >= 85 ? '#22c55e' : s >= 70 ? '#3b82f6' : s >= 55 ? '#f59e0b' : '#ef4444'
  const avgScore = Math.round(sorted.reduce((s, v) => s + v.overallScore, 0) / sorted.length)
  const maxScore = Math.max(...sorted.map(s => s.overallScore))
  const improvement = sorted.length >= 2 ? sorted[sorted.length - 1].overallScore - sorted[0].overallScore : null
  const fmt = (s: number) => `${Math.floor(s / 60)}분 ${s % 60}초`

  return (
    <div className="db-page">
      <div className="db-header">
        <button className="back-btn" onClick={onBack}>← 홈으로</button>
        <h1 className="db-title">성장 리포트</h1>
        <button className="btn-new" onClick={onNewInterview}>+ 새 면접</button>
      </div>

      <div className="db-kpi">
        {[
          { icon: '◉', value: avgScore, label: '평균 점수', color: color(avgScore) },
          { icon: '▲', value: maxScore, label: '최고 점수', color: color(maxScore) },
          { icon: '✦', value: sorted.length, label: '총 연습 횟수', color: 'var(--text-primary)' },
          { icon: '◈', value: improvement !== null ? (improvement >= 0 ? `+${improvement}` : improvement) : '-', label: '점수 향상', color: improvement !== null && improvement >= 0 ? '#22c55e' : '#ef4444' },
        ].map(k => (
          <div key={k.label} className="db-kpi-card">
            <span className="db-kpi-icon">{k.icon}</span>
            <span className="db-kpi-value" style={{ color: k.color }}>{k.value}</span>
            <span className="db-kpi-label">{k.label}</span>
          </div>
        ))}
      </div>

      <div className="db-chart-section">
        <h3 className="db-section-title">점수 변화 추이</h3>
        <div className="db-chart">
          {sorted.map((s, i) => (
            <div key={s.id} className="db-bar-group">
              <span className="db-bar-score">{s.overallScore}</span>
              <div className="db-bar" style={{ height: `${s.overallScore}%`, background: color(s.overallScore) }} />
              <span className="db-bar-label">{i + 1}회차</span>
            </div>
          ))}
        </div>
      </div>

      <div className="db-history-section">
        <h3 className="db-section-title">면접 기록</h3>
        {[...sorted].reverse().map(s => (
          <div key={s.id} className="db-history-item">
            <div>
              <span className="db-history-date">{s.date}</span>
              <div className="db-history-meta">
                <span className="db-history-role">{s.setupData.jobRole}</span>
                {s.setupData.company && <span className="db-history-company">@ {s.setupData.company}</span>}
                <span className="db-history-type">{s.setupData.interviewType === 'general' ? '종합' : s.setupData.interviewType === 'technical' ? '직무기술' : '인성'}</span>
              </div>
              {s.duration > 0 && <span className="db-history-dur">{fmt(s.duration)}</span>}
            </div>
            <div style={{ color: color(s.overallScore) }}>
              <span className="db-history-score">{s.overallScore}</span><span className="db-history-pt">점</span>
            </div>
          </div>
        ))}
      </div>

      {sessions.length === 0 && <p className="db-notice">※ 샘플 데이터입니다. 실제 면접을 완료하면 업데이트됩니다.</p>}
    </div>
  )
}
