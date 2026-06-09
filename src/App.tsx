import { useState } from 'react'
import LandingPage from './pages/LandingPage'
import SetupPage from './pages/SetupPage'
import InterviewPage from './pages/InterviewPage'
import FeedbackPage from './pages/FeedbackPage'
import DashboardPage from './pages/DashboardPage'
import type { InterviewSession, SetupData } from './types'

type Page = 'landing' | 'setup' | 'interview' | 'feedback' | 'dashboard'

export default function App() {
  const [page, setPage] = useState<Page>('landing')
  const [setupData, setSetupData] = useState<SetupData | null>(null)
  const [currentSession, setCurrentSession] = useState<InterviewSession | null>(null)
  const [sessions, setSessions] = useState<InterviewSession[]>([])

  const handleSetupComplete = (data: SetupData) => {
    setSetupData(data)
    setPage('interview')
  }

  const handleInterviewComplete = (session: InterviewSession) => {
    setCurrentSession(session)
    setSessions(prev => [...prev, session])
    setPage('feedback')
  }

  return (
    <div className="app">
      {page === 'landing' && (
        <LandingPage onStart={() => setPage('setup')} onDashboard={() => setPage('dashboard')} />
      )}
      {page === 'setup' && (
        <SetupPage onComplete={handleSetupComplete} onBack={() => setPage('landing')} />
      )}
      {page === 'interview' && setupData && (
        <InterviewPage setupData={setupData} onComplete={handleInterviewComplete} onBack={() => setPage('setup')} />
      )}
      {page === 'feedback' && currentSession && (
        <FeedbackPage session={currentSession} onSave={() => setPage('dashboard')} onRetry={() => setPage('setup')} />
      )}
      {page === 'dashboard' && (
        <DashboardPage sessions={sessions} onNewInterview={() => setPage('setup')} onBack={() => setPage('landing')} />
      )}
    </div>
  )
}
