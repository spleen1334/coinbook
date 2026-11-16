import { beforeEach, describe, expect, it, vi } from 'vitest';

const hooks = vi.hoisted(() => ({ states: [], refs: [], effects: [], stateIndex: 0, refIndex: 0 }));

vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal()),
  useState: (initial) => {
    const index = hooks.stateIndex++;
    if (!(index in hooks.states)) hooks.states[index] = initial;
    return [hooks.states[index], (value) => (hooks.states[index] = value)];
  },
  useRef: (initial) => {
    const index = hooks.refIndex++;
    if (!(index in hooks.refs)) hooks.refs[index] = { current: initial };
    return hooks.refs[index];
  },
  useEffect: (effect) => hooks.effects.push(effect)
}));

import { AddSheet } from './AddSheet.jsx';

function find(node, predicate) {
  if (!node || typeof node !== 'object') return undefined;
  if (predicate(node)) return node;
  for (const child of Array.isArray(node.props?.children) ? node.props.children : [node.props?.children]) {
    const match = find(child, predicate);
    if (match) return match;
  }
  return undefined;
}

describe('AddSheet note suggestions', () => {
  let props;
  let listeners;

  function render() {
    hooks.stateIndex = 0;
    hooks.refIndex = 0;
    hooks.effects = [];
    return AddSheet(props);
  }

  beforeEach(() => {
    hooks.states = [];
    hooks.refs = [];
    listeners = {};
    vi.stubGlobal('document', {
      addEventListener: (name, listener) => (listeners[name] = listener),
      removeEventListener: (name) => delete listeners[name]
    });
    props = {
      t: {},
      selectedCategoryLabel: 'Food',
      categoriesForPicker: [],
      noteSuggestions: ['Coffee'],
      onSelectNoteSuggestion: vi.fn(),
      onNoteChange: vi.fn()
    };
  });

  it('dismisses on an outside pointer, including non-focusable content, and reopens when typing', () => {
    let tree = render();
    const wrap = find(tree, (node) => node.props?.className === 'cb-memo-wrap');
    wrap.props.ref.current = { contains: (target) => target === 'inside' };
    const cleanup = hooks.effects[0]();
    listeners.pointerdown({ target: 'inside' });
    expect(find(render(), (node) => node.props?.role === 'listbox')).toBeDefined();
    listeners.pointerdown({ target: 'outside' });
    tree = render();
    expect(find(tree, (node) => node.props?.role === 'listbox')).toBeUndefined();
    const input = find(tree, (node) => node.props?.['aria-autocomplete'] === 'list');
    expect(input.props['aria-controls']).toBeUndefined();
    input.props.onChange({ target: { value: 'Co' } });
    expect(find(render(), (node) => node.props?.role === 'listbox')).toBeDefined();
    cleanup();
    expect(listeners.pointerdown).toBeUndefined();
  });

  it('preserves suggestion selection when focus moves into the list and dismisses on keyboard blur elsewhere', () => {
    let tree = render();
    const wrap = find(tree, (node) => node.props?.className === 'cb-memo-wrap');
    wrap.props.ref.current = { contains: (target) => target === 'option' };
    const input = find(tree, (node) => node.props?.['aria-autocomplete'] === 'list');
    input.props.onBlur({ relatedTarget: 'option' });
    tree = render();
    find(tree, (node) => node.props?.role === 'option').props.onClick();
    expect(props.onSelectNoteSuggestion).toHaveBeenCalledWith('Coffee');
    input.props.onBlur({ relatedTarget: null });
    expect(find(render(), (node) => node.props?.role === 'listbox')).toBeUndefined();
  });
});
