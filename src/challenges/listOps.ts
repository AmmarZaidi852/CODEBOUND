/**
 * A tiny, deterministic model of the Python list operations Data Sorter
 * teaches. Used to check that challenge answers match what Python would do.
 * This is not a Python interpreter.
 */
export type ListOp =
  | { op: 'set'; index: number; value: number } // items[index] = value
  | { op: 'append'; value: number } // items.append(value)
  | { op: 'pop'; index?: number } // items.pop(index), or items.pop() for the last item

export function applyOp(
  list: readonly number[],
  op: ListOp,
): { list: number[]; removed?: number } {
  const next = [...list]
  switch (op.op) {
    case 'set':
      assertIndex(next, op.index)
      next[op.index] = op.value
      return { list: next }
    case 'append':
      next.push(op.value)
      return { list: next }
    case 'pop': {
      const index = op.index ?? next.length - 1
      assertIndex(next, index)
      const [removed] = next.splice(index, 1)
      return { list: next, removed }
    }
  }
}

export function runOps(list: readonly number[], ops: ListOp[]): number[] {
  return ops.reduce<number[]>(
    (current, op) => applyOp(current, op).list,
    [...list],
  )
}

function assertIndex(list: number[], index: number) {
  if (index < 0 || index >= list.length) {
    throw new RangeError(`IndexError: list index ${index} out of range`)
  }
}
