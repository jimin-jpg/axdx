import './landing.css'

interface Props { onStart: () => void; onDashboard: () => void }

export default function LandingPage({ onStart, onDashboard }: Props) {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="landing-logo"><span className="logo-icon">◈</span><span className="logo-text">InterviewAI</span></div>
        <button className="nav-btn" onClick={onDashboard}>대시보드</button>
      </nav>
      <main className="landing-main">
        <div className="landing-badge">AI 면접 코칭 서비스</div>
        <h1 className="landing-title">면접, 이제<br /><span className="title-accent">AI와 함께</span><br />준비하세요</h1>
        <p className="landing-desc">자기소개서 기반 맞춤형 질문 생성부터<br />실시간 피드백까지 — 언제 어디서나</p>
        <div className="landing-actions">
          <button className="btn-primary" onClick={onStart}><span>면접 시작하기</span><span>→</span></button>
          <button className="btn-secondary" onClick={onDashboard}>성장 리포트 보기</button>
        </div>
        <div className="landing-features">
          {[
            { icon: '✦', title: '맞춤형 질문', desc: '자소서와 직무를 분석해\n개인화된 질문을 생성합니다' },
            { icon: '◉', title: '실시간 피드백', desc: '논리성, 구체성, 직무 적합성을\n즉시 분석합니다' },
            { icon: '◈', title: '꼬리질문 대응', desc: '답변에 따른 심화 질문으로\n실전 대응력을 키웁니다' },
            { icon: '▲', title: '성장 추적', desc: '누적 데이터로 면접 역량\n향상을 시각화합니다' },
          ].map(f => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
      <div className="landing-bg">
        <div className="bg-circle bg-circle-1" /><div className="bg-circle bg-circle-2" /><div className="bg-grid" />
      </div>
    </div>
  )
}
