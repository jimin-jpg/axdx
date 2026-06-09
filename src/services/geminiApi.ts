import { GoogleGenerativeAI } from '@google/generative-ai'
import type { SetupData, Question, Answer, AnswerFeedback, ValidationResult } from '../types'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null
const model = genAI ? genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }) : null

async function callGemini(prompt: string): Promise<string> {
  if (!model) throw new Error('API_KEY_MISSING')
  const result = await model.generateContent(prompt)
  return result.response.text()
}

function parseJSON<T>(raw: string): T {
  const clean = raw.replace(/```json|```/g, '').trim()
  return JSON.parse(clean) as T
}

export async function validateCompanyAndRole(company: string, jobRole: string): Promise<ValidationResult> {
  if (!API_KEY) return { companyValid: true, roleValid: true, message: '' }
  const prompt = `다음 회사와 직무가 실제로 존재하는지 판단하세요.
회사명: ${company}
직무명: ${jobRole}
순수 JSON만 반환:
{"companyValid":true,"roleValid":true,"message":"한 문장 설명"}
companyValid: 실제 존재하는 회사면 true
roleValid: 해당 회사에 그 직무가 있을 수 있으면 true`
  try { return parseJSON<ValidationResult>(await callGemini(prompt)) }
  catch { return { companyValid: true, roleValid: true, message: '' } }
}

export async function generateQuestions(setupData: SetupData): Promise<Question[]> {
  if (!API_KEY) return getMockQuestions(setupData)
  const prompt = `당신은 ${setupData.company || '기업'}의 ${setupData.jobRole} 직무 면접관입니다.
면접 유형: ${setupData.interviewType === 'general' ? '종합' : setupData.interviewType === 'technical' ? '직무기술' : '인성'}
자기소개서: ${setupData.resumeText || '미제공'}

${setupData.company ? setupData.company + '의 기업문화와 인재상을 반영하여 ' : ''}${setupData.jobRole} 직무에 맞는 면접 질문 5개를 생성하세요.
자기소개서가 있으면 내용을 반영한 맞춤형 질문을 만드세요.

순수 JSON 배열만 반환:
[{"id":"q1","text":"질문","type":"main"},{"id":"q2","text":"질문","type":"main"},{"id":"q3","text":"질문","type":"main"},{"id":"q4","text":"질문","type":"main"},{"id":"q5","text":"질문","type":"main"}]`
  try { return parseJSON<Question[]>(await callGemini(prompt)) }
  catch { return getMockQuestions(setupData) }
}

export async function generateFollowUp(setupData: SetupData, question: Question, answer: Answer): Promise<Question> {
  if (!API_KEY) return { id: `fq_${question.id}`, text: '방금 말씀하신 내용을 좀 더 구체적으로 설명해주실 수 있나요?', type: 'followup', parentId: question.id }
  const prompt = `${setupData.company || '기업'} ${setupData.jobRole} 면접관으로서 아래 답변에 대한 날카로운 꼬리 질문 1개를 생성하세요.
질문: ${question.text}
답변: ${answer.text}
순수 JSON만 반환: {"id":"fq_${question.id}","text":"꼬리질문","type":"followup","parentId":"${question.id}"}`
  try { return parseJSON<Question>(await callGemini(prompt)) }
  catch { return { id: `fq_${question.id}`, text: '방금 말씀하신 내용을 좀 더 구체적으로 설명해주실 수 있나요?', type: 'followup', parentId: question.id } }
}

export async function generateAllFeedbacks(setupData: SetupData, questions: Question[], answers: Answer[]): Promise<AnswerFeedback[]> {
  if (!API_KEY) return answers.map(a => getMockFeedback(a.questionId))

  const company = setupData.company || '일반기업'
  const role = setupData.jobRole

  const qaList = answers.map((ans, i) => {
    const q = questions.find(q => q.id === ans.questionId)
    return `Q${i + 1}. ${q?.text || ''}
답변(${(ans.text || '').trim().length}자): "${ans.text || '(없음)'}"`
  }).join('\n\n')

  const prompt = `당신은 ${company} 채용 담당자입니다. ${company}의 기업문화와 ${role} 직무 특성에 맞춰 면접 답변 ${answers.length}개를 한번에 평가하세요.

${qaList}

【${company} ${role} 평가 기준】
- ${company}의 인재상과 ${role} 직무 역량에 부합하는지 평가
- 5자 이하 → score 5~15, 30자 이하 → score 15~30
- 구체적 수치/사례 없음 → specificity 20~40

순수 JSON 배열만 반환:
[{"questionId":"q1","score":0,"logic":0,"specificity":0,"relevance":0,"strengths":["강점"],"improvements":["개선점"],"summary":"총평"}]
배열 길이 반드시 ${answers.length}개.`

  try {
    const raw = await callGemini(prompt)
    const feedbacks = parseJSON<AnswerFeedback[]>(raw)
    return feedbacks.map((fb, i) => ({ ...fb, questionId: answers[i]?.questionId ?? fb.questionId }))
  } catch {
    return answers.map(a => getMockFeedback(a.questionId))
  }
}

export async function generateFeedback(_setupData: SetupData, question: Question, _answer: Answer): Promise<AnswerFeedback> {
  return getMockFeedback(question.id)
}

function getMockQuestions(setupData: SetupData): Question[] {
  return [
    { id: 'q1', text: `${setupData.jobRole} 직무에 지원하게 된 동기가 무엇인가요?`, type: 'main' },
    { id: 'q2', text: '본인의 강점과 약점을 각각 하나씩 말씀해주세요.', type: 'main' },
    { id: 'q3', text: `${setupData.jobRole} 관련 경험이나 프로젝트를 소개해주세요.`, type: 'main' },
    { id: 'q4', text: '팀 협업에서 갈등이 생겼을 때 어떻게 해결했나요?', type: 'main' },
    { id: 'q5', text: '5년 후 본인의 커리어 목표는 무엇인가요?', type: 'main' },
  ]
}

function getMockFeedback(questionId: string): AnswerFeedback {
  return {
    questionId, score: 30, logic: 25, specificity: 20, relevance: 35,
    strengths: ['답변을 완료했습니다'],
    improvements: ['구체적인 경험과 수치를 추가하세요', 'STAR 기법을 활용해보세요', '지원 직무와 연관된 내용을 포함하세요'],
    summary: '답변이 너무 짧거나 구체성이 부족합니다. 실제 경험을 바탕으로 상황, 행동, 결과를 구체적으로 서술해주세요.',
  }
}
