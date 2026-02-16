// 请求响应参数（不包含data）
export interface Result {
  code: string;
  message: string;
}

// 请求响应参数（包含data）
export interface ResultData<T = unknown> extends Result {
  data: T;
}

// 定义列表项类型
export type Item = {
  id: string;
  title: string;
  content: string;
  author: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
};

// 定义 API 响应数据类型
export type LoginApiResponse = {
  list: Item[];
  total?: number;
  pageNum?: number;
  pageSize?: number;
};

