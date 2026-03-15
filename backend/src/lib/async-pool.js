export async function asyncPool(items, limit, worker) {
  const results = [];
  const executing = new Set();

  for (const item of items) {
    const promise = Promise.resolve().then(() => worker(item));
    results.push(promise);
    executing.add(promise);

    const cleanup = () => executing.delete(promise);
    promise.then(cleanup, cleanup);

    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }

  return Promise.all(results);
}
