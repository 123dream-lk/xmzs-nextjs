import http from "../index";
import type { getMenuApiResponse } from "../interface";
import { PORT1 } from "../config/servicePort";
/**
 * @name 登录模块
 */
// 用户登录
export const getMenuApi = (params?: Record<string, unknown>) => {
  return http.get<getMenuApiResponse>(
    `${PORT1}/menu/getMenu`, // 使用相对路径，会自动拼接 baseURL
    params,
    { loading: true, cancel: true }
  );
};
