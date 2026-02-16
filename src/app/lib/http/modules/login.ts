import http from "../index";
import { PORT1 } from "../config/servicePort";
import { LoginApiResponse } from "../interface";
/**
 * @name 登录模块
 */
// 用户登录
export const loginApi = (params: Record<string, unknown>) => {
  return http.get<LoginApiResponse>(
    `/demo`,  // 使用相对路径，会自动拼接 baseURL
    params,
    { loading: true, cancel: true }
  )
};
