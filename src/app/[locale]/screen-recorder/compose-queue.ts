export type ComposeQueueState = {
  current: string | null;
  waiting: string[];
  generation: number;
};

export function createComposeQueue(): ComposeQueueState {
  return { current: null, waiting: [], generation: 0 };
}

export function enqueueCompose(state: ComposeQueueState, ids: string[]): ComposeQueueState {
  const waiting = [...state.waiting];
  let added = false;
  for (const id of ids) {
    if (!id || id === state.current || waiting.includes(id)) continue;
    waiting.push(id);
    added = true;
  }
  if (!state.current && waiting.length > 0) {
    const [current, ...rest] = waiting;
    return { current, waiting: rest, generation: state.generation + 1 };
  }
  if (!added) return state;
  return { ...state, waiting };
}

export function dropCompose(state: ComposeQueueState, ids: ReadonlySet<string>): ComposeQueueState {
  if (ids.size === 0) return state;
  const waiting = state.waiting.filter((id) => !ids.has(id));
  if (state.current && ids.has(state.current)) {
    const [current, ...rest] = waiting;
    return {
      current: current ?? null,
      waiting: rest,
      generation: state.generation + 1,
    };
  }
  if (waiting.length === state.waiting.length) return state;
  return { ...state, waiting };
}

export function prioritizeCompose(state: ComposeQueueState, id: string): ComposeQueueState {
  if (!id || state.current === id) return state;
  const waiting = state.waiting.filter((item) => item !== id);
  if (state.current) waiting.unshift(state.current);
  return { current: id, waiting, generation: state.generation + 1 };
}

export function finishCompose(state: ComposeQueueState, generation: number): ComposeQueueState {
  if (generation !== state.generation) return state;
  const [current, ...waiting] = state.waiting;
  return {
    current: current ?? null,
    waiting,
    generation: current ? state.generation + 1 : state.generation,
  };
}

export function hasPendingCompose(state: ComposeQueueState) {
  return state.current !== null || state.waiting.length > 0;
}
