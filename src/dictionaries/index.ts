export type Dictionary = {
  title: string
  description: string
  keywords: string
}
export const locales = ['en', 'zh', 'ja', 'ko'] as const// 支持的语言
export const defaultLocale = 'zh' as const
export function getDictionary(locale: typeof locales[number]): Promise<Dictionary> {
  return import(`./${locale}.json`).then(module => module.default)
}