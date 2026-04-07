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
  useEffect(() => {
    http.setMessageApi(messageApi);
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