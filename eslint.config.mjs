import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Custom rules
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off", // 允许使用 any 类型
      "@typescript-eslint/no-unused-vars": "off", // 允许定义但未使用的变量
      "react-hooks/exhaustive-deps": "off", // 关闭 hooks 依赖项检查
      "react-hooks/set-state-in-effect": "off", // 允许在 useLayoutEffect 中同步初始化 state
    },
  },
]);

export default eslintConfig;
