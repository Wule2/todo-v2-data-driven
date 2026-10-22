// ============================================================
// 测试 2：任务 2 缺陷代码 · 五步法诊断取证（W8 任务 2 证据）
// 运行：node tests/defect-test.js
// 说明：用最小 DOM 模拟运行作业给定的缺陷代码，取证两个问题：
//   ① 控制台/函数调用日志实际打印了什么（答案：什么都没有）
//   ② 修复后同样的输入是否恢复预期行为
// ============================================================

// ---- 最小 DOM 模拟 ----
class FakeEl {
  constructor(tag, dataset, parent) {
    this.tag = tag.toUpperCase();
    this.dataset = dataset || {};
    this.parent = parent || null;
    this.children = [];
  }
  append(child) { this.children.push(child); child.parent = this; }
  contains(el) {
    let cur = el;
    while (cur) { if (cur === this) return true; cur = cur.parent; }
    return false;
  }
  closest(sel) {
    let el = this;
    while (el) {
      if (el.tag === 'LI' && sel === 'li') return el;
      if (el.dataset.action === 'delete' && sel === '[data-action="delete"]') return el;
      el = el.parent;
    }
    return null;
  }
}
globalThis.Element = FakeEl; // 让 instanceof Element 判断可用

// DOM：list(ul) > li[data-id=1] > button[data-action="delete"]
function buildDom() {
  const list = new FakeEl('ul', {}, null);
  const li = new FakeEl('li', { id: '1' }, list);
  const btn = new FakeEl('button', { action: 'delete' }, li);
  list.append(li);
  li.append(btn);
  return { list, li, btn };
}

// 记录操作函数的调用（相当于在 deleteTodo / toggleTodo 里加的 console.log）
const calls = [];
function deleteTodo(id) { calls.push(['delete', id]); }
function toggleTodo(id) { calls.push(['toggle', id]); }

// ---- 作业给定的缺陷代码（原样照抄，仅包成函数便于测试）----
function buggyHandler(e, list) {
  if (!(e.target instanceof Element)) return;
  const item = e.target.closest('li');
  if (item || !list.contains(item)) return;   // 缺陷 1：条件写反，恒为真
  const id = item.dataset.id;
  if (id) return;                              // 缺陷 2：条件写反，有 id 也退出
  const delBtn = e.target.closest('[data-action="delete"]');
  if (delBtn && item.contains(delBtn)) {
    deleteTodo(id);                            // 缺陷 3：删除后缺少 return
  }
  toggleTodo(id);
}

// ---- 修复版（三处改动，见五步法记录第 ④ 步）----
function fixedHandler(e, list) {
  if (!(e.target instanceof Element)) return;
  const item = e.target.closest('li');
  if (!item || !list.contains(item)) return;   // 修复 1：取不到 li 才退出
  const id = item.dataset.id;
  if (!id) return;                             // 修复 2：取不到 id 才退出
  const delBtn = e.target.closest('[data-action="delete"]');
  if (delBtn && item.contains(delBtn)) {
    deleteTodo(id);
    return;                                    // 修复 3：删除后不再往下走
  }
  toggleTodo(id);
}

function run(handler, label) {
  console.log(`\n===== ${label} =====`);
  const cases = [
    ['点击 li 文字区', 'li'],
    ['点击删除按钮', 'btn'],
    ['点击 ul 空白区', 'list'],
  ];
  for (const [name, key] of cases) {
    calls.length = 0;
    const dom = buildDom();
    try {
      handler({ target: dom[key] }, dom.list);
      console.log(`${name} → 函数调用: ${JSON.stringify(calls)}`);
    } catch (err) {
      console.log(`${name} → THROW ${err.constructor.name}: ${err.message}`);
    }
  }
}

run(buggyHandler, '缺陷代码（原样）');
run(fixedHandler, '修复后');

// ---- 预期结论 ----
// 缺陷代码：三种点击全部零调用、零报错 —— 功能静默失效（对应五步法第 ① 步"什么也没打印"）
// 修复后：li → toggle；删除按钮 → 只 delete；ul 空白区 → 无调用
