# Todo 列表 V2.0（数据驱动版）

数据驱动的 Todo 应用重构练习：所有视图由 `state` 推导，操作统一遵循
**「改数据 → save() 保存 → render() 重渲染」** 三步口决。

## 文件说明

| 文件 | 说明 |
|---|---|
| `index.html` / `todo.js` | V2.0 数据驱动重构版（每个 li 单独绑事件） |
| `index2.html` / `todo2.js` | V2.1 修正版（含 `clearCompleted`，推荐使用） |
| `index3.html` / `todo3.js` | V2.2 事件委托版（列表交互统一交给父容器 `ul`） |
| `src/todo.ts` | V3.0 TypeScript 核心逻辑层（类型约束 + 脏数据守卫，可单测） |
| `src/main.ts` | V3.0 TypeScript DOM 绑定层（渲染 + 事件委托） |
| `index4.html` | V3.1 Vite 入口页面（直接挂 `/src/main.ts`，dev 免构建） |
| `vite.config.ts` | Vite 配置（构建入口指定为 `index4.html`） |
| `tests/` | 单元测试（`todo.handwritten.test.ts` 手写 + `todo.ai-generated.test.ts` AI 生成与审查补测） |

## 运行方式

方式一：直接用浏览器打开 `index2.html`。

方式二（推荐，localStorage 更稳定）：VSCode 安装 Live Server 插件，
右键 `index2.html` → Open with Live Server。

## 核心设计

- **state**：只放 `todos` 数组和 `filter` 视图状态（`all` / `active` / `completed`）；
- **不可变更新**：添加用展开 `[...todos, newTodo]`、删除用 `filter`、
  切换状态用 `map + {...todo}`，均返回新数组，不修改原数组；
- **持久化**：`save()` 写入、`loadState()` 恢复，键名 `todo-app-v2`；
- **render()**：按 `filter` 筛选可见列表后全量重建 DOM，页面是 state 的投影。

## AI 协作记录

- **AI 生成**：V2.0 数据驱动重构主体（`addTodo` / `removeTodo` / `toggleTodo` /
  `render` / 筛选与持久化）；
- **人工审查后让 AI 修正**：① `loadState` 增加 `try-catch` 容错；
  ② `addTodo` 的 id 由 `Date.now()` 改为自增，避免同毫秒重复；
  ③ 完成态删除线选择器与真实 DOM 结构匹配；
- **脱离 AI 独立完成**：`clearCompleted` 函数（`filter` 留下未完成条目）。

### V2.2 事件委托（W8）

- **AI 生成、人工主导设计**：把 V2.0 的循环绑定重构为 `ul` 容器上的事件委托
  （`e.target.closest('li')` + `[data-action="delete"]`），`render()` 不再
  逐个绑定监听器；删除按钮不再需要 `stopPropagation`，先匹配 delete 分支
  `return` 即可；
- **五步法调试记录**（详见 `todo3.js` 内注释）：
  1. **假设**：`closest('li')` 点不到 li 时返回 null；`dataset.id` 是字符串，
     与 state 的数字 id 比较会静默失效；
  2. **测试（修复前）**：点 `ul` 空白区抛 `TypeError: ... reading 'dataset'`；
     点删除/切换时调用发生了但数据没变（字符串 `'1'` ≠ 数字 `1`）；
  3. **修复**：`if (!li) return;` 空值防御 + `Number(li.dataset.id)` 类型转换；
  4. **测试（修复后）**：空白区点击无报错无操作；删除后剩 0 条；
     toggle 后 `completed=true`，全部通过；
- **独立完成（禁用 AI 写代码）**：「编辑」功能——`render` 加编辑入口
  （`data-action="edit"`）、事件委托加 `edit` 分支（置于 `toggle` 之前）、
  `editTodo`（`find` 取当前条目 → `prompt` 输入 → 取消/空值防御 →
  `map` 更新 `text` → 保存重渲染）。代码逐行手写；实现思路参考过 AI
  讲解，已按作业表要求披露；
- **测试取证**：`tests/delegation-test.js`（V2.2 委托两轮缺陷复现）、
  `tests/defect-test.js`（作业给定缺陷代码诊断），`node tests/xxx.js` 运行。

## V3.0 TypeScript 重构（W9）/ V3.1 Vite 工程（W10）

```bash
npm install        # 首次使用
npm run dev        # Vite 开发服务器：打开 http://localhost:5173/index4.html
npm run build      # tsc --noEmit && vite build（作业固定脚本）
npm run preview    # 预览构建产物
npm test           # vitest run（作业固定脚本）
```

> **重要：Vite 页面不能双击打开，也不能用 Live Server 直接开 `index4.html`。**
> `index4.html` 引用的是 `/src/main.ts`，只有 Vite dev server 会把它编译成 JS；
> `file://` 或普通静态服务器下脚本加载失败，页面能显示但按钮全部没反应
> （Console 会报 `ERR_FILE_NOT_FOUND` 或 `Unexpected token ':'`）。
> 必须走 `npm run dev` 或 `npm run preview` 给出的 http 地址，且路径带 `/index4.html`
> （根目录 `index.html` 是 W8 的历史页面，不是 Vite 入口）。

- **V3.1 迁移到真实 Vite 工程**：`index4.html` 直接挂 `/src/main.ts`，dev 阶段无需
  预构建；`vite.config.ts` 把构建入口指向 `index4.html`（根目录其余历史页面不参与）；
  `package.json` 按要求固定 `build` / `test` 两条脚本，`tsconfig.json` 维持 `strict: true`；
  - **`tsconfig.json` 严格模式**：`strict: true` + `noUncheckedIndexedAccess` 等，
  `build` 里先跑 `tsc --noEmit` 把类型错误挡在构建之前；
  - **vitest 共用 Vite 配置**：测试无需单独转换器，18 条用例在 Vite 工程内直接跑；

- **逻辑/DOM 分层**：`src/todo.ts` 只放类型、状态与操作函数（不碰 DOM，可单测）；
  `src/main.ts` 负责渲染与事件，数据全部委托给逻辑层；
- **类型约束**：`interface Todo` 钉死条目结构；`Filter` 联合类型钉死筛选取值；
- **脏数据防御**：`JSON.parse` 返回值先标 `unknown` 再逐字段校验（`isTodo` / `isFilter`
  类型守卫），坏条目直接丢弃，不让脏数据流进 `state`；
- **dataset.id 转换**：`parseTodoId()` 把字符串转 `number`，空串 / `NaN` / 小数
  一律返回 `null`（注意 `Number('') === 0` 的陷阱）；
- **null 处理**：DOM 查询逐个显式判空（`mustGet` / `instanceof` 收窄），
  全程无 `any`、无 `!` 断言；`find` 找不到返回 `undefined` 也显式处理；
- **AI 协作记录**：TS 重构主体由 AI 生成，人工审查并验证（typecheck/build/test
  全过）；手写单测由本人独立完成（见 `tests/todo.handwritten.test.ts`）。

## 验证方法

1. 添加 / 删除 / 点击条目切换完成状态 / 切换筛选按钮；
2. 控制台执行 `clearCompleted()` 清除所有已完成；
3. DevTools → Application → Local Storage 查看 `todo-app-v2` 数据变化；
4. 刷新页面，验证 `todos` 和 `filter` 均恢复。

### V2.2 事件委托专项验证

1. 打开 `index3.html`（建议 Live Server），DevTools Console 应无报错；
2. 点 li 文字 → 切换完成态（出现删除线）；点「删除」→ 只删除、不切换；
3. **边界用例**：点列表空白处（`ul` 的 padding 区域）→ 无报错、无任何操作；
4. 连续快速添加多条，逐条删除/切换，确认互不影响（自增 id 生效）；
5. 刷新页面，确认委托交互与持久化数据均正常。

### V3.0 TypeScript / V3.1 Vite 专项验证

1. `npm run build` 先 `tsc --noEmit` 零类型错误、再由 `vite build` 产出
   `dist/index4.html` + `dist/assets/todo-*.js`；
2. `npm run dev`（或构建后 `npm run preview`）打开 `index4.html`：添加 / 编辑 /
   删除 / 筛选 / 清除已完成逐项正常，刷新后数据恢复；
3. `npm test` 全绿（手写 9 条 + AI 生成与审查补测 9 条，共 18 条）。
