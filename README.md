# Todo 列表 V2.0（数据驱动版）

数据驱动的 Todo 应用重构练习：所有视图由 `state` 推导，操作统一遵循
**「改数据 → save() 保存 → render() 重渲染」** 三步口决。

## 文件说明

| 文件 | 说明 |
|---|---|
| `index.html` / `todo.js` | V2.0 数据驱动重构版（每个 li 单独绑事件） |
| `index2.html` / `todo2.js` | V2.1 修正版（含 `clearCompleted`，推荐使用） |
| `index3.html` / `todo3.js` | V2.2 事件委托版（列表交互统一交给父容器 `ul`） |

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
- **待独立完成（禁用 AI）**：「编辑」分支——在 `todo3.js` 末尾标记处由本人
  自行补充（render 加编辑入口、委托加分支、新增 `updateTodo`）。

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
