// ===== 数据层：state 只放 todos 数组和 filter 视图状态 =====
const state = {
  todos: [],        // [{ id, text, completed }]
  filter: 'all'     // 'all' | 'active' | 'completed'
};

// ===== 持久化：localStorage 保存与恢复 =====
const STORAGE_KEY = 'todo-app-v2';

// ┌──────────────────────────────────────────────────────────────┐
// │ 沿用 V2.1 修正 1：loadState 增加 try-catch 容错                  │
// │ 原因：localStorage 数据损坏时 JSON.parse 抛异常，页面脚本中断     │
// └──────────────────────────────────────────────────────────────┘
function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      state.todos = data.todos || [];
      state.filter = data.filter || 'all';
    }
  } catch (err) {
    // 数据损坏时回退到初始状态，而不是让页面白屏
    console.error('读取 localStorage 失败，已重置为初始状态：', err);
    state.todos = [];
    state.filter = 'all';
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

// ┌──────────────────────────────────────────────────────────────┐
// │ 修改：render 不再给每个 li / 删除按钮单独绑事件                  │
// │ 原因：V2.0/V2.1 在 forEach 里 addEventListener，每次重渲染都要     │
// │       解绑旧节点、绑定新节点，N 个条目就是 N 对监听器；           │
// │       事件委托后 render 只负责"画" DOM，交互全部交给父容器 ul      │
// │ 做法：li.dataset.id 携带数据，删除按钮加 data-action="delete"     │
// └──────────────────────────────────────────────────────────────┘
function render() {
  const list = document.getElementById('todo-list');
  list.innerHTML = '';

  getVisibleTodos().forEach(todo => {
    const li = document.createElement('li');
    li.textContent = todo.text;
    li.dataset.id = todo.id; // 委托时靠这个属性反查数据
    if (todo.completed) li.classList.add('completed');

    const delBtn = document.createElement('button');
    delBtn.textContent = '删除';
    delBtn.className = 'delete-btn';
    delBtn.dataset.action = 'delete'; // 委托时靠这个属性识别"删除"操作

    li.appendChild(delBtn);
    list.appendChild(li);
  });

  // 高亮当前筛选按钮
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === state.filter);
  });
}

// ===== 操作函数：严格遵循"改数据 → 保存 → 重渲染"三步 =====

// ┌──────────────────────────────────────────────────────────────┐
// │ 沿用 V2.1 修正 2：addTodo 的 id 改为自增                          │
// │ 原因：Date.now() 在同一毫秒内连续添加会生成重复 id，              │
// │       导致 toggleTodo / removeTodo 误操作多条数据                │
// └──────────────────────────────────────────────────────────────┘
function addTodo(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  const maxId = state.todos.reduce((max, t) => Math.max(max, t.id), 0);
  const newTodo = { id: maxId + 1, text: trimmed, completed: false };
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

// 清除所有已完成：filter 决定留下谁
function clearCompleted() {
  state.todos = state.todos.filter(todo => !todo.completed);
  save();   // 1. 保存
  render(); // 2. 重渲染
}

// ┌──────────────────────────────────────────────────────────────┐
// │ 事件委托：整个列表的点击/删除只在 ul 上绑一个监听器                │
// │                                                               │
// │ 五步法调试记录（AI-2 调试挑战）                                 │
// │                                                               │
// │ 第 1 轮 —— null 边界                                          │
// │   现象：AI 首版委托代码点击列表空白处（ul 的 padding 区）时，     │
// │         控制台报 TypeError: Cannot read properties of null     │
// │         (reading 'dataset')，且报错后脚本中断，后续点击全失效。   │
// │   假设：e.target.closest('li') 在点不到任何 li 时返回 null，      │
// │         首版没判空就直接读 li.dataset.id。                       │
// │   测试（修复前）：模拟点击 ul 本体 → THROW TypeError（已复现）。   │
// │   修复：加 if (!li) return; 空值防御。                           │
// │   测试（修复后）：点 ul 空白区 → 无调用、无报错，PASS。            │
// │                                                               │
// │ 第 2 轮 —— dataset 的字符串陷阱                                 │
// │   现象：修好空值后，点"删除"条目没被删掉、点文字也不切换完成态，   │
// │         但控制台没有任何报错（静默失效）。                        │
// │   假设：DOM 的 dataset 值一定是字符串，li.dataset.id 拿到 '1'，    │
// │         而 state 里 id 是数字 1，removeTodo 里 1 !== '1' 恒为    │
// │         真、toggleTodo 里 1 === '1' 恒为假，过滤/映射全部落空。   │
// │         V2.0/V2.1 用闭包直接捕获数字 id，所以没有这个问题；        │
// │         改成委托后 id 从 DOM 上"读"回来，类型就变了。              │
// │   测试（修复前）：点删除 → 调用记录里有 delete '1'，但数据层       │
// │         还剩 1 条；点文字 → toggle '1' 发生了，completed 仍 false。│
// │   修复：const id = Number(li.dataset.id); 读出来先转回数字。       │
// │   测试（修复后）：删除后剩 0 条、toggle 后 completed=true，PASS。  │
// │                                                               │
// │ 另一个委托特有收益：删除不再需要 e.stopPropagation()——            │
// │ 先判断 data-action="delete" 并 return，天然不会触发 toggle。      │
// └──────────────────────────────────────────────────────────────┘
document.getElementById('todo-list').addEventListener('click', (e) => {
  const li = e.target.closest('li');
  if (!li) return; // 第 1 轮修复：点不到 li 直接退出

  const id = Number(li.dataset.id); // 第 2 轮修复：dataset 是字符串，转回数字

  if (e.target.closest('[data-action="delete"]')) {
    removeTodo(id);
    return; // 删除后不再往下走，避免顺手触发 toggle
  }
  toggleTodo(id); // 点 li 其余区域：切换完成状态
});

// ===== 表单与筛选：按钮数量固定，直接绑即可（无需委托）=====
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

// ┌──────────────────────────────────────────────────────────────┐
// │ 「编辑」功能（下一分支计划）                                     │
// │ 状态：由本人独立完成，全程未使用 AI。                            │
// │ 落点：render() 中为每个 li 增加编辑入口（data-action="edit"）、   │
// │      上方事件委托中增加对应分支、并新增一个 updateTodo 操作函数。  │
// └──────────────────────────────────────────────────────────────┘
