export function buildExplainPrompt(text: string, lang = 'ko'): string {
  if (lang === 'ko') {
    return `다음 텍스트를 쉽게 설명해주세요:\n\n"${text}"`
  }
  return `Please explain the following text in simple terms:\n\n"${text}"`
}

export function buildTranslatePrompt(text: string, targetLang = 'en'): string {
  const langNames: Record<string, string> = {
    ko: 'Korean',
    en: 'English',
    ja: 'Japanese',
    zh: 'Chinese',
  }
  const langName = langNames[targetLang] || targetLang
  return `Translate the following text to ${langName}:\n\n"${text}"`
}

export function buildSummarizePrompt(text: string, lang = 'ko'): string {
  if (lang === 'ko') {
    return `다음 내용을 핵심 포인트 3-5개로 요약해주세요:\n\n${text}`
  }
  return `Summarize the following content in 3-5 key points:\n\n${text}`
}

export function buildImprovePrompt(text: string, lang = 'ko'): string {
  if (lang === 'ko') {
    return `다음 텍스트를 더 명확하고 전문적으로 개선해주세요:\n\n"${text}"`
  }
  return `Please improve the following text to be clearer and more professional:\n\n"${text}"`
}

export function buildPageAnalysisPrompt(
  pageContent: string,
  question: string,
  lang = 'ko',
): string {
  if (lang === 'ko') {
    return `다음은 현재 웹페이지의 내용입니다:\n\n---\n${pageContent.slice(0, 10000)}\n---\n\n질문: ${question}`
  }
  return `Here is the content of the current web page:\n\n---\n${pageContent.slice(0, 10000)}\n---\n\nQuestion: ${question}`
}
