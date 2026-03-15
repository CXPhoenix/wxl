import { createContentLoader } from 'vitepress'

export interface ChallengeData {
  title: string
  url: string
  difficulty?: 'esay' | 'medium' | 'hard' | string
  category?: string
}

export default createContentLoader('challenge/*.md', {
  excerpt: true,
  transform(raw): ChallengeData[] {
    return raw
      .filter((page) => !page.url.endsWith('/')) // exclude index
      .map((page, idx) => ({
        id: page.frontmatter.id ?? idx+1,
        title: page.frontmatter.title ?? '密碼學挑戰',
        url: page.url,
        difficulty: page.frontmatter.difficulty ?? "mystery",
        category: page.frontmatter.category ?? "綜合",
      }))
  },
})

declare const data: ChallengeData[]
export { data }
