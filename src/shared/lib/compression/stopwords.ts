/**
 * Phase 37: Korean/English stopword dictionary for prompt compression.
 * ~500 words, ~1.5KB gzipped.
 */

const EN_STOPWORDS = new Set([
  'the', 'is', 'are', 'was', 'were', 'a', 'an', 'to', 'of',
  'and', 'in', 'on', 'for', 'with', 'at', 'by', 'from',
  'it', 'its', 'this', 'that', 'these', 'those', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'shall', 'may', 'might', 'must',
  'can', 'need', 'dare', 'ought', 'used', 'am', 'not', 'no',
  'nor', 'or', 'but', 'if', 'then', 'else', 'when', 'up',
  'out', 'so', 'than', 'too', 'very', 'just', 'about', 'above',
  'after', 'again', 'against', 'all', 'also', 'any', 'as',
  'because', 'before', 'below', 'between', 'both', 'during',
  'each', 'few', 'further', 'get', 'got', 'here', 'how',
  'into', 'more', 'most', 'much', 'my', 'myself', 'now',
  'only', 'other', 'our', 'ours', 'over', 'own', 'same',
  'she', 'he', 'her', 'him', 'his', 'hers', 'some', 'such',
  'there', 'their', 'them', 'they', 'through', 'under', 'until',
  'us', 'we', 'what', 'which', 'while', 'who', 'whom', 'why',
  'you', 'your', 'yours', 'i', 'me', 'mine', 'where',
  'however', 'therefore', 'furthermore', 'moreover', 'although',
  'though', 'even', 'still', 'yet', 'already', 'often',
  'always', 'never', 'sometimes', 'usually', 'perhaps',
  'really', 'actually', 'basically', 'essentially', 'simply',
  'quite', 'rather', 'somewhat', 'almost', 'enough',
  'please', 'thank', 'thanks', 'okay', 'ok', 'well', 'like',
  'know', 'think', 'want', 'going', 'yeah', 'yes', 'right',
])

const KO_STOPWORDS = new Set([
  '은', '는', '이', '가', '을', '를', '의', '에', '에서',
  '와', '과', '도', '로', '으로', '부터', '까지', '에게',
  '한테', '께', '더', '덜', '좀', '잘', '못', '안',
  '그', '저', '이것', '그것', '저것', '여기', '거기', '저기',
  '다', '모두', '전부', '각', '매', '어떤', '무슨', '아무',
  '하다', '되다', '있다', '없다', '아니다', '같다', '보다',
  '수', '것', '등', '및', '또', '또는', '그리고', '그러나',
  '하지만', '그런데', '따라서', '왜냐하면', '때문에', '위해',
  '대해', '관해', '통해', '의해', '대한', '관한',
  '이런', '그런', '저런', '어떤', '아주', '매우', '너무',
  '정말', '진짜', '참', '꽤', '상당히', '약간', '조금',
  '많이', '적게', '별로', '전혀', '거의', '완전히',
  '네', '예', '아니요', '응', '글쎄', '음', '아',
  '합니다', '입니다', '습니다', '됩니다', '겠습니다',
  '해요', '에요', '이에요', '예요', '세요', '게요',
  '했다', '했는데', '하는', '하면', '한다', '하고',
  '이고', '이며', '이라', '이면', '인데', '인',
  '좀', '제발', '부디', '혹시', '그냥', '일단',
])

export function isStopword(word: string): boolean {
  const lower = word.toLowerCase().trim()
  if (lower.length === 0) return true
  return EN_STOPWORDS.has(lower) || KO_STOPWORDS.has(lower)
}

export function removeStopwords(text: string): string {
  return text
    .split(/\s+/)
    .filter((word) => !isStopword(word.replace(/[.,!?;:'"()[\]{}]/g, '')))
    .join(' ')
}

export function getStopwordRatio(text: string): number {
  const words = text.split(/\s+/).filter((w) => w.length > 0)
  if (words.length === 0) return 0
  const stopCount = words.filter((w) =>
    isStopword(w.replace(/[.,!?;:'"()[\]{}]/g, '')),
  ).length
  return stopCount / words.length
}
