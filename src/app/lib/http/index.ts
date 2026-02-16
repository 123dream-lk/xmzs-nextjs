import axios from "axios";
import type { AxiosInstance, AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import type { ResultData } from "./interface";
import { ResultEnum } from "./enums/httpEnum";
import { checkStatus } from "./helper/checkStatus";
import { AxiosCanceler } from "./helper/axiosCancel";
import { extractFileName } from "../utils";
import type { GlobalContextType } from '@/app/providers';

export interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  loading?: boolean;
  cancel?: boolean;
}

const config = {
  // 默认地址请求地址，可在 .env.** 文件中修改
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL as string || '/api',
  // 设置超时时间
  timeout: ResultEnum.TIMEOUT as number,
  // 跨域时候允许携带凭证
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json;charset=UTF-8',
  },
};

const axiosCanceler = new AxiosCanceler();

export class RequestHttp {
  service: AxiosInstance;
  private messageApi: GlobalContextType['messageApi'] | null = null;
  private needLoadingRequestCount = 0;
  public constructor(config: AxiosRequestConfig) {
    // instantiation
    this.service = axios.create(config);

    /**
     * @description 请求拦截器
     * 客户端发送请求 -> [请求拦截器] -> 服务器
     * token校验(JWT) : 接受服务器返回的 token,存储到 vuex/pinia/本地储存当中
     */
    this.service.interceptors.request.use(
      (config: CustomAxiosRequestConfig) => {
        // 重复请求不需要取消，在 api 服务中通过指定的第三个参数: { cancel: false } 来控制
        config.cancel ??= true;
        if (config.cancel) {
          axiosCanceler.addPending(config);
        }
        // 当前请求不需要显示 loading，在 api 服务中通过指定的第三个参数: { loading: false } 来控制
        config.loading ??= true;
        if (config.loading) this.showFullScreenLoading();
        if (config.headers && typeof config.headers.set === "function") {
          config.headers.set("token", '123');
        }
        // 如果是 FormData，移除默认的 JSON 头，让浏览器自动设置 multipart/form-data; boundary=...
        if (config.data instanceof FormData) {
          if (config.headers && typeof config.headers.delete === 'function') {
            config.headers.delete('Content-Type')
          }
          else if (config.headers) {
            delete config.headers['Content-Type']
          }
        }
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    /**
     * @description 响应拦截器
     *  服务器换返回信息 -> [拦截统一处理] -> 客户端JS获取到信息
     */
    this.service.interceptors.response.use(
      (response: AxiosResponse & { config: CustomAxiosRequestConfig }) => {
        const { data, config, headers } = response;
        const isBlob = response.config.responseType === 'blob'
        const disposition = headers['content-disposition'] // 获取Content-Disposition
        const fileNameFromHeader = extractFileName(disposition)
        const result = isBlob
          ? {
            blob: data,
            fileName: fileNameFromHeader || 'download',
          }
          : data
        axiosCanceler.removePending(config);
        if (config.loading) this.tryHideFullScreenLoading();
        // 登录失效
        if (data.code == ResultEnum.OVERDUE) {
          return Promise.reject(data);
        }
        // 全局错误信息拦截（防止下载文件的时候返回数据流，没有 code 直接报错）
        if (data.code && data.code !== ResultEnum.SUCCESS) {
          return Promise.reject(data);
        }
        // 成功请求（在页面上除非特殊情况，否则不用处理失败逻辑）
        return result;
      },
      async (error: AxiosError) => {
        const { response } = error;
        this.tryHideFullScreenLoading();
        // 请求超时 && 网络错误单独判断，没有 response
        if (error.message.indexOf("timeout") !== -1) {
          this.showError("请求超时！请您稍后重试");
        }
        if (error.message.indexOf("Network Error") !== -1) {
          this.showError("网络错误！请您稍后重试");
        }
        // 根据服务器响应的错误状态码，做不同的处理
        if (response) this.showError(checkStatus(response.status));
        // 服务器结果都没有返回(可能服务器错误可能客户端断网)，断网处理:可以跳转到断网页面
        if (!window.navigator.onLine) {
          // 断网处理-跳转到断网页面
          window.location.href = '/offline-page';
        }
        return Promise.reject(error);
      }
    );
  }
  /**
   * 设置 messageApi
   */
  public setMessageApi(messageApi: GlobalContextType['messageApi']): void {
    this.messageApi = messageApi;
  }

  /**
   * 显示错误消息
   */
  private showError(message: string): void {
    if (this.messageApi) {
      this.messageApi.error(message);
    } else {
      console.error('API Error:', message);
    }
  }

  /**
   * 显示成功消息
   */
  private showSuccess(message: string): void {
    if (this.messageApi) {
      this.messageApi.success(message);
    }
  }

  private startLoading = (): void => {
    if (this.messageApi) {
      this.messageApi.open({
        type: 'loading',
        content: 'Action in progress..',
        duration: 0,
      });
    }
  };

  /**
   * @description 结束 Loading
   * */
  private endLoading = (): void => {
    if (this.messageApi) {
      this.messageApi.destroy()
    }
  };

  private showFullScreenLoading(): void {
    if (this.needLoadingRequestCount === 0) {
      this.startLoading();
    }
    this.needLoadingRequestCount++;
  }

  private tryHideFullScreenLoading(): void {
    if (this.needLoadingRequestCount <= 0) return;
    this.needLoadingRequestCount--;
    if (this.needLoadingRequestCount === 0) {
      this.endLoading();
    }
  }

  /**
   * @description 常用请求方法封装
   */
  get<T>(url: string, params?: object, _object = {}): Promise<ResultData<T>> {
    return this.service.get(url, { params, ..._object });
  }
  post<T>(url: string, params?: object | string, _object = {}): Promise<ResultData<T>> {
    return this.service.post(url, params, _object);
  }
  put<T>(url: string, params?: object, _object = {}): Promise<ResultData<T>> {
    return this.service.put(url, params, _object);
  }
  delete<T>(url: string, params?: object, _object = {}): Promise<ResultData<T>> {
    return this.service.delete(url, { params, ..._object });
  }
  // download(url: string, params?: object, _object = {}): Promise<BlobPart> {
  //   return this.service.post(url, params, { ..._object, responseType: "blob" });
  // }
  download(url: string, params?: object, _object = {}): Promise<{ blob: BlobPart, fileName: string }> {
    return this.service.post(url, params, { ..._object, responseType: 'blob' })
  }
  downloadGet(
    url: string,
    params?: object,
    _object = {},
  ): Promise<{ blob: BlobPart, fileName: string }> {
    return this.service.get(url, {
      params,
      ..._object,
      responseType: 'blob',
    })
  }
}

const http = new RequestHttp(config);
export default http;
