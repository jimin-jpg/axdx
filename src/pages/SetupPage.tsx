import { useState } from 'react'
import type { SetupData } from '../types'
import { validateCompanyAndRole } from '../services/geminiApi'
import './setup.css'

interface Props { onComplete: (data: SetupData) => void; onBack: () => void }

export default function SetupPage({ onComplete, onBack }: Props) {
  const [jobRole, setJobRole] = useState('')
  const [company, setCompany] = useState('')
  const [resumeText, setResumeText] = useState('')
  const [interviewType, setInterviewType] = useState<SetupData['interviewType']>('general')
  const [step, setStep] = useState(1)
  const [validating, setValidating] = useState(false)
  const [validationMsg, setValidationMsg] = useState('')
  const [validationOk, setValidationOk] = useState<boolean | null>(null)

  const handleValidateAndNext = async () => {
    if (!jobRole.trim()) return
    setValidating(true)
    setValidationMsg('')

    try {
      const result = await validateCompanyAndRole(company || '일반기업', jobRole)
      setValidationMsg(result.message)
      setValidationOk(result.companyValid && result.roleValid)

      if (result.companyValid && result.roleValid) {
        setTimeout(() => setStep(2), 800)
      }
    } catch {
      setValidationOk(true)
      setStep(2)
    } finally {
      setValidating(false)
    }
  }

  const handleSubmit = () => {
    onComplete({ jobRole, company, resumeText, interviewType })
  }

  return (
    <div className="setup-page">
      <div className="setup-header">
        <button className="back-btn" onClick={onBack}>← 돌아가기</button>
        <div className="step-indicator">
          <div className={`step-dot ${step >= 1 ? 'active' : ''}`} />
          <div className="step-line" />
          <div className={`step-dot ${step >= 2 ? 'active' : ''}`} />
        </div>
      </div>

      <div className="setup-container">
        {step === 1 && (
          <div className="setup-card animate-in">
            <div className="setup-label">STEP 01</div>
            <h2 className="setup-title">어떤 직무에<br />지원하시나요?</h2>

            <div className="field-group">
              <label className="field-label">지원 직무 <span className="required">*</span></label>
              <input className="field-input" type="text" placeholder="예: 마케팅, 개발, 인사, 영업..." value={jobRole} onChange={e => { setJobRole(e.target.value); setValidationOk(null); setValidationMsg('') }} />
            </div>

            <div className="field-group">
              <label className="field-label">지원 회사</label>
              <input className="field-input" type="text" placeholder="예: 삼성전자, 카카오, 현대자동차..." value={company} onChange={e => { setCompany(e.target.value); setValidationOk(null); setValidationMsg('') }} />
            </div>

            <div className="field-group">
              <label className="field-label">면접 유형</label>
              <div className="type-options">
                {(['general', 'technical', 'behavioral'] as const).map(type => (
                  <button key={type} className={`type-option ${interviewType === type ? 'selected' : ''}`} onClick={() => setInterviewType(type)}>
                    {type === 'general' ? '종합 면접' : type === 'technical' ? '직무 기술' : '인성 면접'}
                  </button>
                ))}
              </div>
            </div>

            {validationMsg && (
              <div className={`validation-msg ${validationOk ? 'ok' : 'fail'}`}>
                {validationOk ? '✓' : '✗'} {validationMsg}
              </div>
            )}

            {validationOk === false && (
              <button className="skip-btn" onClick={() => setStep(2)}>그래도 계속하기 →</button>
            )}

            <button className="setup-next-btn" disabled={!jobRole.trim() || validating} onClick={handleValidateAndNext}>
              {validating ? '검증 중...' : '다음 단계 →'}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="setup-card animate-in">
            <div className="setup-label">STEP 02</div>
            <h2 className="setup-title">자기소개서를<br />입력해주세요</h2>
            <p className="setup-subtitle">입력하시면 AI가 맞춤형 질문을 생성합니다 (선택 사항)</p>

            <div className="field-group">
              <label className="field-label">자기소개서</label>
              <textarea className="field-textarea" placeholder="자기소개서 내용을 붙여넣으세요. 입력하지 않아도 직무 기반 질문이 생성됩니다." value={resumeText} onChange={e => setResumeText(e.target.value)} rows={10} />
              <span className="char-count">{resumeText.length}자</span>
            </div>

            <div className="setup-btn-row">
              <button className="setup-back-btn" onClick={() => setStep(1)}>← 이전</button>
              <button className="setup-next-btn" onClick={handleSubmit}>면접 시작 →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
