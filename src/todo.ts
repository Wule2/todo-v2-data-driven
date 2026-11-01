// ===== V3.0 TypeScript 重构：核心逻辑层（不碰 DOM，可单测）=====
// 由 W8 的 todo3.js 重构而来：逻辑与 DOM 拆开，这一层只依赖类型与 localStorage。

// ---- 类型约束：用 interface 把"约定俗成"的对象结构钉死 ----
export interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

// 筛选状态：联合类型把取值范围钉死，从类型层面杜绝 'alll' 这类脏值
export type Filter = 'all' | 'active' | 'completed';

export interface TodoState {
  todos: Todo[];
  filter: Filter;
}

const STORAGE_KEY = 'todo-app-v2';

function createInitialState(): TodoState {
  return { todos: [], filter: 'all' };
}

// 单一状态源（测试里可直接重置）
export const state: TodoState = createInitialState();

// ---- 脏数据防御：localStorage 与 JSON.parse 的数据一律不可信 ----

// localStorage 在部分环境（隐私模式、禁用 Storage）下访问即抛错，先兜底
function getStorage(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}

// 类型守卫：逐字段校验，替代 JS 时代的 data.todos || []
function isTodo(value: unknown): value is Todo {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'number' &&
    Number.isFinite(record.id) &&
    typeof record.text === 'string' &&
    typeof record.completed === 'boolean'
  );
}

function isFilter(value: unknown): value is Filter {
  return value === 'all' || value === 'active' || value === 'completed';
}

function parseTodos(value: unknown): Todo[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isTodo); // 类型守卫过滤：脏条目直接丢弃
}

export function loadState(): void {
  const storage = getStorage();
  if (storage === null) return; // 没有存储环境时静默跳过，而不是崩溃

  try {
    const saved = storage.getItem(STORAGE_KEY);
    if (saved === null) return;
    // JSON.parse 的返回值是 any：先标成 unknown 再校验，严禁 any 向上流动
    const data: unknown = JSON.parse(saved);
    if (typeof data !== 'object' || data === null) return;
    const record = data as Record<string, unknown>;
    state.todos = parseTodos(record.todos);
    state.filter = isFilter(record.filter) ? record.filter : 'all';
  } catch (err) {
    console.error('读取 localStorage 失败，已重置为初始状态：', err);
    state.todos = [];
    state.filter = 'all';
  }
}

export function save(): void {
  const storage = getStorage();
  if (storage === null) return;
  try {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ todos: state.todos, filter: state.filter })
    );
  } catch (err) {
    console.error('写入 localStorage 失败：', err);
  }
}

// ---- dataset 字符串 → number：DOM 与数据层之间的类型边界 ----
// li.dataset.id 一定是字符串；注意 Number('') 会得到 0，空串必须先拦掉
export function parseTodoId(raw: string | undefined): number | null {
  if (raw === undefined || raw.trim() === '') return null;
  const id = Number(raw);
  return Number.isInteger(id) ? id : null; // NaN、小数一律拒绝
}

export function parseFilter(raw: string | undefined): Filter | null {
  return raw === 'all' || raw === 'active' || raw === 'completed' ? raw : null;
}

// ---- 视图层：按 filter 计算可见列表（纯函数）----
export function getVisibleTodos(): Todo[] {
  if (state.filter === 'active') return state.todos.filter((t) => !t.completed);
  if (state.filter === 'completed') return state.todos.filter((t) => t.completed);
  return state.todos;
}

// ---- 输入净化（业务契约：注入代码不允许原样存入）----
// 移除成对的 <script>...</script>（连内容）以及残留的孤立标签
function stripScriptTags(text: string): string {
  return text
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<\/?script\b[^>]*>/gi, '');
}

// ---- 操作函数：改数据 → save() → 返回结果（渲染交给 DOM 层）----
// 返回值设计成可断言的形态，方便单测验证"数据真的变了"

// 添加：成功返回新条目；空文本与注入代码返回 null
export function addTodo(text: string): Todo | null {
  // TS 类型只是编译期约束，挡不住 JS 调用方在运行时塞进 null 等脏值
  if (typeof text !== 'string') return null;
  const cleaned = stripScriptTags(text).trim();
  if (cleaned === '') return null;
  const maxId = state.todos.reduce((max, t) => Math.max(max, t.id), 0);
  const newTodo: Todo = { id: maxId + 1, text: cleaned, completed: false };
  state.todos = [...state.todos, newTodo];
  save();
  return newTodo;
}

// 切换：成功返回更新后的条目；find 找不到返回 undefined（不是 null）
export function toggleTodo(id: number): Todo | null {
  const target = state.todos.find((t) => t.id === id);
  if (target === undefined) return null;
  const updated: Todo = { ...target, completed: !target.completed };
  state.todos = state.todos.map((t) => (t.id === id ? updated : t));
  save();
  return updated;
}

// 删除：返回是否真的删掉了东西
export function removeTodo(id: number): boolean {
  const next = state.todos.filter((t) => t.id !== id);
  if (next.length === state.todos.length) return false;
  state.todos = next;
  save();
  return true;
}

// 编辑文本：空文本、注入代码与不存在的 id 都返回 null（审查补齐：编辑是另一条注入路径）
export function updateTodoText(id: number, text: string): Todo | null {
  if (typeof text !== 'string') return null;
  const trimmed = stripScriptTags(text).trim();
  if (trimmed === '') return null;
  const target = state.todos.find((t) => t.id === id);
  if (target === undefined) return null;
  const updated: Todo = { ...target, text: trimmed };
  state.todos = state.todos.map((t) => (t.id === id ? updated : t));
  save();
  return updated;
}

// 切换筛选视图
export function setFilter(filter: Filter): void {
  state.filter = filter;
  save();
}

// 清除已完成：返回清除数量
export function clearCompleted(): number {
  const before = state.todos.length;
  state.todos = state.todos.filter((t) => !t.completed);
  const removed = before - state.todos.length;
  if (removed > 0) save();
  return removed;
}
