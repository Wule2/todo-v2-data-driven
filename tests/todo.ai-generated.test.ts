// ============================================================
// 任务 3：AI 生成测试（结构化 Prompt 引导，Prompt 全文见作业表）
// 生成方式：按 PPT 模板显式给出业务契约 + 覆盖维度，AI 生成后人工审查
// 运行：npx vitest run tests/todo.ai-generated.test.ts
// ============================================================
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addTodo, loadState, state } from '../src/todo';

beforeEach(() => {
  state.todos = [];
  state.filter = 'all';
});

describe('addTodo（AI 生成）', () => {
  // 【正常路径】合法文本添加
  it('正常路径：合法文本添加成功，返回新条目', () => {
    const todo = addTodo('买牛奶');
    expect(todo).not.toBeNull();
    expect(todo?.text).toBe('买牛奶');
    expect(todo?.completed).toBe(false);
    expect(state.todos).toHaveLength(1);
  });

  // 【维度 1（空值）】传入 null，验证是否拦截
  it('维度1 空值：传入 null 被拦截，返回 null 且列表不变', () => {
    // as unknown as string：故意绕过 TS 类型，模拟 JS 调用方的运行时脏输入
    const todo = addTodo(null as unknown as string);
    expect(todo).toBeNull();
    expect(state.todos).toHaveLength(0);
  });

  // 【维度 2（格式）】空字符串、纯空格，验证是否拦截
  it('维度2 格式：空字符串被拦截', () => {
    expect(addTodo('')).toBeNull();
    expect(state.todos).toHaveLength(0);
  });

  it('维度2 格式：纯空格被拦截', () => {
    expect(addTodo('   ')).toBeNull();
    expect(state.todos).toHaveLength(0);
  });

  // 【维度 6（重复）】契约未禁止重复文本：应各自成为独立条目、id 不同
  it('维度6 重复：连续添加相同文本，各自独立成条目', () => {
    const a = addTodo('买牛奶');
    const b = addTodo('买牛奶');
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    expect(state.todos).toHaveLength(2);
    expect(state.todos[0]?.text).toBe('买牛奶');
    expect(state.todos[1]?.text).toBe('买牛奶');
    expect(b?.id).toBeGreaterThan(a!.id); // 审查修正：去掉 ?? 0 兜底，避免断言被静默弱化
  });

  // 【维度 9（安全）】传入 <script>，断言存入的数据不含原样脚本标签
  it('维度9 安全：纯注入代码清洗后为空，按空文本契约拒绝', () => {
    const todo = addTodo('<script>alert(1)</script>');
    expect(todo).toBeNull();
    expect(state.todos).toHaveLength(0);
  });

  it('维度9 安全：混合内容清洗后不含原样脚本标签，正常部分保留', () => {
    const todo = addTodo('<script>alert(1)</script>买牛奶');
    // 审查修正：原断言 toBe('买牛奶') 把"清洗策略"写死进测试，超出契约范围；
    // 契约只要求"不含原样脚本标签 + 正常部分保留"，按契约断言：
    expect(todo?.text).not.toContain('<script');
    expect(todo?.text).toContain('买牛奶');
  });
});

// ============================================================
// 人工补测（审查报告 ③）：对照 9 大维度查漏后的补充用例
// ============================================================
describe('addTodo（人工补测）', () => {
  // 【类型维度】AI 只测了 null（维度1），漏了其他类型脏值
  it('类型：传入数字、undefined 等非字符串被拦截，而不是存入脏数据', () => {
    expect(addTodo(123 as unknown as string)).toBeNull();
    expect(addTodo(undefined as unknown as string)).toBeNull();
    expect(state.todos).toHaveLength(0);
  });

  // 【依赖维度】localStorage 恢复脏数据时必须被类型守卫过滤——AI 完全没碰 loadState
  it('依赖：localStorage 脏数据恢复被过滤，坏条目不进 state', () => {
    vi.stubGlobal('localStorage', {
      getItem: (key: string) =>
        key === 'todo-app-v2'
          ? JSON.stringify({
              todos: [
                { id: 'x', text: 1, completed: 'yes' },      // 全字段脏
                { id: 2, text: '好条目', completed: false }, // 合法
              ],
              filter: 'nope',
            })
          : null,
      setItem: (key: string, value: string) => undefined,
    });
    try {
      loadState();
      expect(state.todos).toHaveLength(1);
      expect(state.todos[0]?.text).toBe('好条目');
      expect(state.filter).toBe('all'); // 非法 filter 回落默认值
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
