export interface SetupData {
  jobRole: string
  company: string
  resumeText: string
  interviewType: 'general' | 'technical' | 'behavioral'
}

export interface ValidationResult {
  companyValid: boolean
  roleValid: boolean
  message: string
}

export interface Question {
  id: string
  text: string
  type: 'main' | 'followup'
  parentId?: string
}

export interface Answer {
  questionId: string
  text: string
  duration: number
}

export interface AnswerFeedback {
  questionId: string
  score: number
  logic: number
  specificity: number
  relevance: number
  strengths: string[]
  improvements: string[]
  summary: string
}

export interface InterviewSession {
  id: string
  date: string
  setupData: SetupData
  questions: Question[]
  answers: Answer[]
  feedbacks: AnswerFeedback[]
  overallScore: number
  duration: number
  completedAt: string
}
