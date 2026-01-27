module.exports = {
  root: true,
  env: {
    es2021: true,
    node: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"],
  rules: {},
  overrides: [
    {
      files: ["packages/renderer/**/*.{ts,tsx}"],
      env: { browser: true },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      plugins: ["react", "react-hooks"],
      extends: ["plugin:react/recommended", "plugin:react-hooks/recommended"],
      settings: {
        react: {
          version: "detect",
        },
      },
      rules: {
        "react/react-in-jsx-scope": "off",
        "react/prop-types": "off",
      },
    },
    {
      files: ["packages/main/**/*.{ts,tsx}"],
      env: { node: true },
    },
    {
      files: ["**/*.test.{ts,tsx}", "**/__tests__/**/*.{ts,tsx}"],
      env: { node: true },
    },
  ],
};
