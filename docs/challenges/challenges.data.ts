import { createContentLoader } from 'vitepress'

export interface ChallengeData {
  title: string
  url: string
  difficulty?: string
  category?: string
}

export default createContentLoader('challenges/*.md', {
  excerpt: true,
  transform(raw): ChallengeData[] {
    return raw
      .filter((page) => !page.url.endsWith('/')) // exclude index
      .map((page) => ({
        title: page.frontmatter.title ?? '',
        url: page.url,
        difficulty: page.frontmatter.difficulty,
        category: page.frontmatter.category,
      }))
  },
})

declare const data: ChallengeData[]
export { data }
