// 解析 Content-Disposition 中的文件名（兼容 RFC 5987 的 filename* 与常规 filename）
export function extractFileName(contentDisposition?: string): string {
  if (!contentDisposition)
    return ''
  const trimQuotes = (s: string) => s.trim().replace(/^"|"$/g, '')
  const safeDecode = (s: string) => {
    try {
      return decodeURIComponent(s)
    }
    catch (_) {
      try {
        return decodeURI(s)
      }
      catch (_) {
        return s
      }
    }
  }
  // 优先匹配 filename*
  const starMatch = contentDisposition.match(/filename\*\s*=\s*([^;]+)/i)
  if (starMatch && starMatch[1]) {
    const raw = trimQuotes(starMatch[1])
    // 形如 UTF-8''%E4%B8%AD%E6%96%87.txt 或 utf-8''...
    const parts = raw.split('\'\'')
    const encoded
      = parts.length === 2 ? (parts[1] ?? '') : raw.replace(/^utf-8''/i, '')
    return safeDecode(encoded)
  }
  // 回退匹配常规 filename="..." 或 filename=...
  const normalMatch = contentDisposition.match(
    /filename\s*=\s*("[^"]+"|[^;]+)/i,
  )
  if (normalMatch && normalMatch[1]) {
    return safeDecode(trimQuotes(normalMatch[1]))
  }
  return ''
}