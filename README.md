# Todo 列表 V2.0（数据驱动版）

数据驱动的 Todo 应用重构练习：所有视图由 `state` 推导，操作统一遵循
**「改数据 → save() 保存 → render() 重渲染」** 三步口决。

## 文件说明

| 文件 | 说明 |
|---|---|
| `index.html` / `todo.js` | V2.0 数据驱动重构版 |
| `index2.html` / `todo2.js` | V2.1 修正版（含 `clearCompleted`，推荐使用） |

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

## 验证方法

1. 添加 / 删除 / 点击条目切换完成状态 / 切换筛选按钮；
2. 控制台执行 `clearCompleted()` 清除所有已完成；
3. DevTools → Application → Local Storage 查看 `todo-app-v2` 数据变化；
4. 刷新页面，验证 `todos` 和 `filter` 均恢复。
