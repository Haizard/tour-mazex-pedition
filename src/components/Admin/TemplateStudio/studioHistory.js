export function createStudioHistoryState(initialPresent) {
  return {
    past: [],
    present: initialPresent,
    future: [],
  };
}

export function pushStudioHistory(history, nextPresent) {
  return {
    past: [...history.past, history.present],
    present: nextPresent,
    future: [],
  };
}

export function undoStudioHistory(history) {
  if (!history.past.length) {
    return history;
  }

  const previous = history.past[history.past.length - 1];
  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  };
}

export function redoStudioHistory(history) {
  if (!history.future.length) {
    return history;
  }

  const [next, ...remainingFuture] = history.future;
  return {
    past: [...history.past, history.present],
    present: next,
    future: remainingFuture,
  };
}
