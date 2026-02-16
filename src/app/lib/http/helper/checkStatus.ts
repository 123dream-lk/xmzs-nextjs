/**
 * @description: 校验网络请求状态码
 * @param {Number} status
 * @return void
 */

// 定义支持的 HTTP 状态码类型
type HttpStatusCode = 400 | 401 | 403 | 404 | 405 | 408 | 500 | 502 | 503 | 504;

// 状态码与错误信息的映射表
const map: Record<HttpStatusCode, string> = {
  400: "请求失败！请您稍后重试",
  401: "登录失效！请您重新登录",
  403: "当前账号无权限访问！",
  404: "你所访问的资源不存在！",
  405: "请求方式错误！请您稍后重试",
  408: "请求超时！请您稍后重试",
  500: "服务异常！",
  502: "网关错误！",
  503: "服务不可用！",
  504: "网关超时！",
};

export const checkStatus = (status: number): string => {
  return map[status as HttpStatusCode] || "服务异常！";
};
