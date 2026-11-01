// ===== V3.0 TypeScript 重构：DOM 绑定层 =====
// 由 W8 的 todo3.js 重构而来：负责渲染与事件，数据全部委托给 src/todo.ts。

import {
  addTodo,
  clearCompleted,
  getVisibleTodos,
  loadState,
  parseFilter,
  parseTodoId,
  removeTodo,
  setFilter,
  state,
  toggleTodo,
  updateTodoText,
} from './todo';

// ---- 严格 null 处理：DOM 查询可能返回 null，逐个显式判断，不用 ! 断言 ----

function mustGet(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (el === null) throw new Error(`找不到 #${id}，初始化失败`);
  return el;
}

function mustGetInput(id: string): HTMLInputElement {
  const el = document.getElementById(id);
  if (el === null) throw new Error(`找不到 #${id}，初始化失败`);
  if (!(el instanceof HTMLInputElement)) throw new Error(`#${id} 不是输入框`);
  return el;
}

// ---- 渲染层：state 的投影 ----
function render(): void {
  const list = mustGet('todo-list');
  list.replaceChildren();

  for (const todo of getVisibleTodos()) {
    const li = document.createElement('li');
    li.textContent = todo.text;
    li.dataset.id = String(todo.id); // dataset 只接受字符串，必须显式转换
    if (todo.completed) li.classList.add('completed');

    const editBtn = document.createElement('button');
    editBtn.textContent = '编辑';
    editBtn.className = 'edit-btn';
    editBtn.dataset.action = 'edit';

    const delBtn = document.createElement('button');
    delBtn.textContent = '删除';
    delBtn.className = 'delete-btn';
    delBtn.dataset.action = 'delete';

    li.append(editBtn, delBtn);
    list.append(li);
  }

  for (const btn of document.querySelectorAll<HTMLElement>('.filter-btn')) {
    const filter = parseFilter(btn.dataset.filter);
    btn.classList.toggle('active', filter !== null && filter === state.filter);
  }
}

// 编辑交互：DOM 层只负责"问"，数据层负责"改"
function promptEdit(id: number): void {
  const current = state.todos.find((t) => t.id === id);
  if (current === undefined) return;
  const input = prompt('修改任务内容：', current.text);
  if (input === null) return; // 用户取消：prompt 返回 null
  updateTodoText(id, input); // 空文本在数据层被拒绝
}

// ---- 事件绑定 ----
function bindEvents(): void {
  const form = mustGet('todo-form');
  const input = mustGetInput('todo-input');
  const list = mustGet('todo-list');
  const clearBtn = mustGet('clear-completed');

  form.addEventListener('submit', (e: SubmitEvent) => {
    e.preventDefault();
    addTodo(input.value);
    input.value = '';
    render();
  });

  // 事件委托：整个列表只在父容器上绑一个监听器
  list.addEventListener('click', (e: MouseEvent) => {
    const target = e.target;
    if (!(target instanceof Element)) return; // 兜底：非元素节点直接退出

    const li = target.closest('li');
    if (li === null || !list.contains(li)) return; // null 边界防御

    const id = parseTodoId(li.dataset.id); // 字符串 → number，脏值返回 null
    if (id === null) return;

    if (target.closest('[data-action="delete"]') !== null) {
      removeTodo(id);
      render();
      return; // 删除后不再往下走，避免触发 toggle
    }
    if (target.closest('[data-action="edit"]') !== null) {
      promptEdit(id);
      render();
      return;
    }
    toggleTodo(id); // 点 li 其余区域：切换完成状态
    render();
  });

  for (const btn of document.querySelectorAll<HTMLElement>('.filter-btn')) {
    btn.addEventListener('click', () => {
      const filter = parseFilter(btn.dataset.filter);
      if (filter === null) return;
      setFilter(filter);
      render();
    });
  }

  clearBtn.addEventListener('click', () => {
    clearCompleted();
    render();
  });
}

// ---- 初始化：先恢复数据，再绑定事件，最后首次渲染 ----
function init(): void {
  loadState();
  bindEvents();
  render();
}

init();
