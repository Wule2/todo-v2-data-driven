// ESLint 传统配置（ESLint 8）。项目 package.json 是 "type": "module"，
// 因此这里必须用 .cjs 后缀，否则 module.exports 会报 "module is not defined"。
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],

  // ==== 作业要求的三条规则 ====
  rules: {
    // 圈复杂度上限 10：超标说明函数分支太多，应抽函数
    complexity: ['error', 10],
    // 嵌套深度上限 3：避免层层 if 套娃
    'max-depth': ['error', 3],
    // 严禁显式 any（TS 重构的硬性要求）
    '@typescript-eslint/no-explicit-any': 'error',
  },

  // ESLint 8 对目录参数默认只遍历 .js；这个 overrides 会让 .ts 也被纳入
  // `npx eslint src/` 的扫描范围（否则提示 No files matching the pattern）。
  overrides: [
    {
      files: ['**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'error',
      },
    },
  ],

  ignorePatterns: ['dist/', 'node_modules/'],
};
