import { NextRequest, NextResponse } from 'next/server'
import Negotiator from 'negotiator'
import { match } from '@formatjs/intl-localematcher'
import { locales, defaultLocale } from '@dict/index'

export default function proxy(req: NextRequest, res: NextResponse) {
  if (req.nextUrl.pathname === '/') {
    return NextResponse.next()
  }
  if (locales.some(locale => req.nextUrl.pathname.startsWith(`/${locale}`))) {
    return NextResponse.next()
  }
  const headers = {
    'accept-language': req.headers.get('accept-language') || ''
  }
  const negotiator = new Negotiator({ headers })
  const language = negotiator.languages()
  const lang = match(language, locales, defaultLocale)
  const pathname = req.nextUrl.pathname
  req.nextUrl.pathname = `/${lang}${pathname}`
  return NextResponse.redirect(req.nextUrl)
}

// 排除的路径
// /api/... — API 接口路由，不需要国际化处理
// /_next/static/... — Next.js 静态资源文件
// /_next/image/... — Next.js 图片优化服务
// /favicon.ico — 网站图标

export const config = {
  // matcher: [
  //   '/((?!api|prod-api|ai-chat|dashboard|form|offline-page|zustand-demo|_next/static|_next/image|favicon.ico|.well-known).*)', //跳过内部匹配路径
  // ]
  matcher: ['/home'], // 只针对 /home 页面处理
}