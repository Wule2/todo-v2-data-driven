// ============================================================
// 任务 2：手写单测（严禁依赖 AI）
// 目标：为 addTodo 和 toggleTodo 手写基础单测，覆盖正常情况与边界拦截
// 运行：npm test（写完前此文件会报 "No test suite found"，属正常）
// ============================================================
import { beforeEach, describe, expect, it } from 'vitest';
import { addTodo, state, toggleTodo } from '../src/todo';

// 每条用例前重置状态，防止上一条用例的数据污染下一条
beforeEach(() => {
  state.todos = [];
  state.filter = 'all';
});

describe('addTodo', () => {
  // 正常：输入 '写作业' → 返回新条目；state.todos 长度 0 → 1；字段值正确
  it('正常：输入 `写作业`，返回新条目，列表长度 0->1', () => {
    const todo = addTodo('写作业');
    expect(todo).not.toBeNull();
    expect(state.todos.length).toBe(1);
    // 提示：断言"条目内容"时想清楚 toBe 和 toEqual 的区别（对象用哪个？）
    // 对象应该用 toEqual
    expect(state.todos[0]).toEqual({
      id: expect.any(Number), // 假设 id 是数字
      text: '写作业',
      completed: false
    });
  });

  // 正常：输入 ' 写作业 ' → text 被 trim 成 '写作业'
  it('正常：首尾空格被 trim', () => {
    const todo = addTodo(' 写作业 ');
    expect(todo).not.toBeNull();
    expect(todo?.text).toBe('写作业');
    expect(state.todos[0].text).toBe('写作业');
  });

  // 边界：输入 '' → 返回 null，state.todos 长度不变
  it('边界：空字符串返回 null，列表不变', () => {
    const todo = addTodo('');
    expect(todo).toBeNull();
    expect(state.todos.length).toBe(0);
  });

  // 边界：输入 '   '（纯空格）→ 返回 null
  it('边界：纯空格返回 null', () => {
    const todo = addTodo('   ');
    expect(todo).toBeNull();
    expect(state.todos.length).toBe(0);
  });

  // 边界：连续添加两条 → id 自增且不重复
  it('边界：连续添加两条，id 自增且不重复', () => {
    const todo1 = addTodo('任务1');
    const todo2 = addTodo('任务2');
    
    expect(todo1).not.toBeNull();
    expect(todo2).not.toBeNull();
    expect(state.todos.length).toBe(2);
    expect(todo1?.id).not.toBe(todo2?.id); // 验证不重复
    expect(todo2!.id).toBeGreaterThan(todo1!.id); // 验证自增
  });
});

describe('toggleTodo', () => {
  // 正常：先 addTodo 造一条，切换后 completed 由 false -> true
  it('正常：切换后 completed 由 false -> true', () => {
    const todo = addTodo('写作业');
    expect(todo?.completed).toBe(false);

    const toggledTodo = toggleTodo(todo!.id);
    expect(toggledTodo).not.toBeNull();
    expect(toggledTodo?.completed).toBe(true);
    expect(state.todos[0].completed).toBe(true); // 验证 state 中的数据也被更改
  });

  // 正常：再切换一次 → true -> false
  it('正常：再切换一次，completed 由 true -> false', () => {
    const todo = addTodo('写作业');
    toggleTodo(todo!.id); // 第一次切，变 true
    const toggledTodo = toggleTodo(todo!.id); // 第二次切，变 false

    expect(toggledTodo).not.toBeNull();
    expect(toggledTodo?.completed).toBe(false);
    expect(state.todos[0].completed).toBe(false);
  });

  // 边界：切换不存在的 id（如 999）→ 返回 null，state.todos 不变
  it('边界：切换不存在的 id，返回 null，state.todos 不变', () => {
    addTodo('写作业'); // 先添加一条，保证列表不为空

    // 提示：toggleTodo 找不到条目时，内部 find 返回的是 undefined 不是 null
    const result = toggleTodo(999); 
    expect(result).toBeNull(); // 虽然 find 返回 undefined，但根据注释要求，函数对外应返回 null
    expect(state.todos.length).toBe(1); // 长度未变
  });

  // 边界：造两条，只切换其中一条 → 另一条的 completed 不受影响
  it('边界：造两条，只切换其中一条，另一条不受影响', () => {
    const todo1 = addTodo('任务1');
    const todo2 = addTodo('任务2');

    toggleTodo(todo1!.id); // 只切换第一条

    // 验证第一条变了
    expect(state.todos.find(t => t.id === todo1!.id)?.completed).toBe(true);
    // 验证第二条没变
    expect(state.todos.find(t => t.id === todo2!.id)?.completed).toBe(false);
  });
});