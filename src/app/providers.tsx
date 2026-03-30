'use client'
import { createContext, useEffect } from 'react';
import { message,ConfigProvider } from 'antd';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import http from '@/lib/http/index';
import { TooltipProvider } from "@/components/ui/tooltip"

export interface GlobalContextType {
  messageApi?: ReturnType<typeof message.useMessage>[0];
}

export const GlobalContext = createContext<GlobalContextType>({messageApi: undefined});
export function GlobalProvider({ children }: { children: React.ReactNode }) {
  const [messageApi, messageContextHolder] = message.useMessage();
  
  // 初始化 httpClient 的 messageApi
  http.setMessageApi(messageApi);

  // 禁用浏览器自动滚动恢复，避免硬刷新时出现先跳到顶部再跳到底部的闪烁
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
  }, []);
  
  return (
    <GlobalContext.Provider value={{ messageApi }}>
      {messageContextHolder}
      <AntdRegistry>
        <ConfigProvider componentSize="middle">
          <TooltipProvider>{children}</TooltipProvider>
        </ConfigProvider>
      </AntdRegistry>
    </GlobalContext.Provider>
  );
}