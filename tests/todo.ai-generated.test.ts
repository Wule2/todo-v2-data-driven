// ============================================================
// 任务 3：AI 生成测试（结构化 Prompt 引导，Prompt 全文见作业表）
// 生成方式：按 PPT 模板显式给出业务契约 + 覆盖维度，AI 生成后人工审查
// 运行：npx vitest run tests/todo.ai-generated.test.ts
// ============================================================
import { beforeEach, describe, expect, it } from 'vitest';
import { addTodo, state } from '../src/todo';

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
    expect(b?.id).toBeGreaterThan(a?.id ?? 0);
  });

  // 【维度 9（安全）】传入 <script>，断言存入的数据不含原样脚本标签
  it('维度9 安全：纯注入代码清洗后为空，按空文本契约拒绝', () => {
    const todo = addTodo('<script>alert(1)</script>');
    expect(todo).toBeNull();
    expect(state.todos).toHaveLength(0);
  });

  it('维度9 安全：混合内容中的 script 标签被清除，正常部分保留', () => {
    const todo = addTodo('<script>alert(1)</script>买牛奶');
    expect(todo?.text).toBe('买牛奶');
    expect(todo?.text).not.toContain('<script');
  });
});
