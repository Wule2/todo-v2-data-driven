// ============================================================
// 测试 1：V2.2 事件委托 · 五步法调试取证（W8 任务 1 证据）
// 运行：node tests/delegation-test.js
// 说明：不依赖浏览器，用最小 DOM 模拟验证委托处理器的三个版本：
//   版本 A = AI 首版朴素委托（两轮修复前）
//   版本 B = 第 1 轮修复后（补 null 防御）
//   版本 C = 第 2 轮修复后（dataset 字符串 id 转数字）
// ============================================================

// ---- 最小 DOM 模拟：只实现 tag / dataset / parent / closest ----
class FakeEl {
  constructor(tag, dataset, parent) {
    this.tag = tag.toUpperCase();
    this.dataset = dataset || {};
    this.parent = parent || null;
  }
  closest(sel) {
    let el = this;
    while (el) {
      if (matchSel(el, sel)) return el;
      el = el.parent;
    }
    return null;
  }
}
function matchSel(el, sel) {
  if (sel === 'li') return el.tag === 'LI';
  if (sel === '[data-action="delete"]') return el.dataset.action === 'delete';
  throw new Error('未知选择器: ' + sel);
}

// DOM 树：ul > li[data-id=1] > button[data-action="delete"]
// 注意：真实 DOM 中 dataset 的值一定是字符串
function buildDom() {
  const ul = new FakeEl('ul', {}, null);
  const li = new FakeEl('li', { id: '1' }, ul);
  const btn = new FakeEl('button', { action: 'delete' }, li);
  return { ul, li, btn };
}

// ---- 模拟数据层（state.todos 里 id 是数字）----
function makeStore() {
  const todos = [{ id: 1, text: '写作业', completed: false }];
  return {
    todos,
    removeTodo: (id) => todos.filter(t => t.id !== id),
    toggleTodo: (id) => todos.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)),
  };
}
function makeActions(store) {
  const calls = [];
  return {
    calls,
    // 模拟真实操作函数：state.todos = 新数组（赋值写回）
    onToggle: (id) => { calls.push(['toggle', id]); store.todos = store.toggleTodo(id); },
    onDelete: (id) => { calls.push(['delete', id]); store.todos = store.removeTodo(id); },
  };
}

// ---- 版本 A：AI 首版朴素委托（两轮修复前）----
function onListClickBuggy(e, actions) {
  const li = e.target.closest('li'); // 没判 null
  const id = li.dataset.id;          // 且直接用了字符串 id
  if (e.target.closest('[data-action="delete"]')) {
    actions.onDelete(id);
    return;
  }
  actions.onToggle(id);
}

// ---- 版本 B：第 1 轮修复后（补 null 防御，id 仍是字符串）----
function onListClickFixed(e, actions) {
  const li = e.target.closest('li');
  if (!li) return;
  const id = li.dataset.id;
  if (e.target.closest('[data-action="delete"]')) {
    actions.onDelete(id);
    return;
  }
  actions.onToggle(id);
}

// ---- 版本 C：第 2 轮修复后（id 转回数字，即 todo3.js 采用的写法）----
function onListClickFinal(e, actions) {
  const li = e.target.closest('li');
  if (!li) return;
  const id = Number(li.dataset.id); // dataset 是字符串，转回数字再进数据层
  if (e.target.closest('[data-action="delete"]')) {
    actions.onDelete(id);
    return;
  }
  actions.onToggle(id);
}

// ---- 跑统一测试表的 5 个场景 ----
function runCases(handler, label) {
  console.log(`\n===== ${label} =====`);
  const cases = [
    ['点击 li 文本区（期望 toggle，completed 变 true）', 'li', 'toggle'],
    ['点击删除按钮（期望只 delete，列表剩 0 条）', 'btn', 'delete'],
    ['点击 ul 空白区（期望无操作）', 'ul', null],
  ];
  for (const [name, targetKey, expectedOp] of cases) {
    const dom = buildDom();
    const store = makeStore();
    const actions = makeActions(store);
    try {
      handler({ target: dom[targetKey] }, actions);
      const op = actions.calls[0] ? actions.calls[0][0] : null;
      const effectOk =
        expectedOp === null
          ? actions.calls.length === 0
          : op === expectedOp &&
            (expectedOp === 'delete'
              ? store.todos.length === 0
              : store.todos[0] && store.todos[0].completed === true);
      console.log(
        `${effectOk ? 'PASS' : 'FAIL'} | ${name} | 调用: ${JSON.stringify(actions.calls)} | 剩余: ${store.todos.length} | completed: ${store.todos[0] ? store.todos[0].completed : '-'}`
      );
    } catch (err) {
      console.log(`THROW | ${name} | ${err.constructor.name}: ${err.message}`);
    }
  }
}

runCases(onListClickBuggy, '版本 A：朴素委托版（两轮修复前）');
runCases(onListClickFixed, '版本 B：第 1 轮修复后（补 null 防御）');
runCases(onListClickFinal, '版本 C：第 2 轮修复后（id 转数字）');

// ---- 预期结论 ----
// 版本 A：toggle/delete 静默失效（字符串 id 与数字 id 比较恒不等）+ 点 ul 空白区 THROW TypeError
// 版本 B：空白区不再报错，但 toggle/delete 仍静默失效
// 版本 C：三项全部 PASS（todo3.js 采用此写法）
