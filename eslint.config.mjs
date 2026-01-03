import nextPlugin from "@next/eslint-plugin-next";
import reactCompiler from "eslint-plugin-react-compiler";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

export default [
  {
    ignores: [".next/**", "node_modules/**"],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "@next/next": nextPlugin,
      "@typescript-eslint": tsPlugin,
      "react-compiler": reactCompiler,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      "react-compiler/react-compiler": "error",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
];
