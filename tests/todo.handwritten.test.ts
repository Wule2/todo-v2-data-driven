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
  // 正常：输入 '  写作业  ' → text 被 trim 成 '写作业'
  // 边界：输入 '' → 返回 null，state.todos 长度不变
  // 边界：输入 '   '（纯空格）→ 返回 null
  // 边界：连续添加两条 → id 自增且不重复
  //
  // 提示：断言"条目内容"时想清楚 toBe 和 toEqual 的区别（对象用哪个？）
});

describe('toggleTodo', () => {
  // 正常：先 addTodo 造一条，切换后 completed 由 false → true
  // 正常：再切换一次 → true → false
  // 边界：切换不存在的 id（如 999）→ 返回 null，state.todos 不变
  // 边界：造两条，只切换其中一条 → 另一条的 completed 不受影响
  //
  // 提示：toggleTodo 找不到条目时，内部 find 返回的是 undefined 不是 null
});
