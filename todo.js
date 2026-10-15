// ===== 数据层：state 只放 todos 数组和 filter 视图状态 =====
const state = {
  todos: [],        // [{ id, text, completed }]
  filter: 'all'     // 'all' | 'active' | 'completed'
};

// ===== 持久化：localStorage 保存与恢复 =====
const STORAGE_KEY = 'todo-app-v2';

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    const data = JSON.parse(saved);
    state.todos = data.todos || [];
    state.filter = data.filter || 'all';
  }
}

function save() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ todos: state.todos, filter: state.filter })
  );
}

// ===== 渲染层：按 filter 计算可见列表 =====
function getVisibleTodos() {
  if (state.filter === 'active') return state.todos.filter(t => !t.completed);
  if (state.filter === 'completed') return state.todos.filter(t => t.completed);
  return state.todos;
}

function render() {
  const list = document.getElementById('todo-list');
  list.innerHTML = '';

  getVisibleTodos().forEach(todo => {
    const li = document.createElement('li');
    li.textContent = todo.text;
    li.dataset.id = todo.id;
    if (todo.completed) li.classList.add('completed');

    li.addEventListener('click', () => toggleTodo(todo.id)); // 点击切换完成

    const delBtn = document.createElement('button');
    delBtn.textContent = '删除';
    delBtn.className = 'delete-btn';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // 阻止冒泡，避免触发 li 的 toggle
      removeTodo(todo.id);
    });

    li.appendChild(delBtn);
    list.appendChild(li);
  });

  // 高亮当前筛选按钮
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === state.filter);
  });
}

// ===== 操作函数：严格遵循"改数据 → 保存 → 重渲染"三步 =====

// 添加：展开，不改原数组
function addTodo(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  const newTodo = { id: Date.now(), text: trimmed, completed: false };
  state.todos = [...state.todos, newTodo]; // 1. 改数据
  save();                                   // 2. 保存
  render();                                 // 3. 重渲染
}
// 删除：filter，不改原数组
function removeTodo(id) {
  state.todos = state.todos.filter(todo => todo.id !== id); // 1. 改数据
  save();                                                    // 2. 保存
  render();                                                  // 3. 重渲染
}
// 切换状态：map + 展开，不改原数组
function toggleTodo(id) {
  state.todos = state.todos.map(todo =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo
  ); // 1. 改数据
  save();   // 2. 保存
  render(); // 3. 重渲染
}
// 切换筛选视图：同样遵循三步
function setFilter(filter) {
  state.filter = filter; // 1. 改数据
  save();                // 2. 保存
  render();              // 3. 重渲染
}

// ===== 事件绑定 =====
document.getElementById('todo-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = document.getElementById('todo-input');
  addTodo(input.value);
  input.value = '';
});

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => setFilter(btn.dataset.filter));
});

// ===== 初始化：先恢复数据，再首次渲染 =====
loadState();
render();
