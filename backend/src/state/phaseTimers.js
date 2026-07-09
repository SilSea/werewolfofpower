const timers = new Map();

export function schedulePhaseTimer(roomId, seconds, callback) {
  clearPhaseTimer(roomId);
  const handle = setTimeout(() => {
    timers.delete(roomId);
    callback();
  }, seconds * 1000);
  timers.set(roomId, handle);
}

export function clearPhaseTimer(roomId) {
  const handle = timers.get(roomId);
  if (handle) {
    clearTimeout(handle);
    timers.delete(roomId);
  }
}
