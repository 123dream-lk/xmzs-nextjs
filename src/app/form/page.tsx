"use client";
import { useActionState, useEffect, useState } from "react";

type LoginState = {
  success: boolean;
  error: string | null;
  message: string;
};

// 模拟登录 API
async function loginUser(formData: FormData): Promise<LoginState> {
  const username = formData.get("username");
  const password = formData.get("password");
  console.log(username, password);

  // 模拟网络请求
  await new Promise((resolve) => setTimeout(resolve, 1000));

  if (username === "admin" && password === "123456") {
    return { success: true, message: "登录成功", error: null };
  } else {
    return { success: false, error: "用户名或密码错误", message: "" };
  }
}

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [state, submitAction, isPending] = useActionState<LoginState, FormData>(
    async (_prevState, formData) => {
      console.log(_prevState, Object.fromEntries(formData));
      const result = await loginUser(formData);
      return result;
    },
    { success: false, error: null, message: "" }
  );

  useEffect(() => {
    if (state.success) {
      window.location.href = "/dashboard";
    }
  }, [state.success]);

  return (
    <form action={submitAction}>
      <div>
        <label>用户名:</label>
        <input
          name="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />
      </div>
      <div>
        <label>密码:</label>
        <input
          type="password"
          name="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
      </div>

      {/* 自动显示错误信息 */}
      {state.error && <p style={{ color: "red" }}>{state.error}</p>}

      <button type="submit" disabled={isPending}>
        {isPending ? "登录中..." : "登录"}
      </button>
    </form>
  );
}
