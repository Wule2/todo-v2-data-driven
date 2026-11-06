// ============================================================
// 任务 3 审查验证：AI 改造后，原有业务规则是否仍成立？
// 这些用例是「人终审」时补的，专门锁住 diff 中被改写的判断
// ============================================================
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addTodo, loadState, state, toggleTodo } from '../src/todo';

beforeEach(() => {
  state.todos = [];
  state.filter = 'all';
});

function stubStorage(payload: Record<string, unknown>): void {
  vi.stubGlobal('localStorage', {
    getItem: (key: string) =>
      key === 'todo-app-v2' ? JSON.stringify(payload) : null,
    setItem: () => undefined,
  });
}

describe('AI 改造后的业务行为验证', () => {
  // 业务规则 1：纯空白不能添加（作业要求的具体业务规则）
  it('纯空白不能添加，返回 null 且列表不变', () => {
    expect(addTodo('   ')).toBeNull();
    expect(state.todos).toHaveLength(0);
  });

  it('空字符串不能添加', () => {
    expect(addTodo('')).toBeNull();
    expect(state.todos).toHaveLength(0);
  });

  // 业务规则 2：来回切换仍成立（false -> true -> false）
  it('同一条目可来回切换完成状态', () => {
    const todo = addTodo('写作业');
    expect(toggleTodo(todo!.id)?.completed).toBe(true);
    expect(toggleTodo(todo!.id)?.completed).toBe(false);
  });

  // 业务规则 3（审查补测）：completed 必须是 boolean，字符串脏值必须被过滤
  // 对应 diff 中被 AI 改写的判断 typeof completed === 'boolean'
  it('localStorage 恢复时，completed 非 boolean 的脏条目必须被丢弃', () => {
    stubStorage({
      todos: [
        { id: 1, text: '合法条目', completed: false },
        { id: 2, text: '脏条目', completed: 'false' },
      ],
      filter: 'all',
    });
    try {
      loadState();
      expect(state.todos).toHaveLength(1);
      expect(state.todos[0]?.text).toBe('合法条目');
      expect(state.todos[0]?.completed).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
