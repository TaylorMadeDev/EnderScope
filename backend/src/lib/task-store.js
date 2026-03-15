import crypto from 'node:crypto';

const tasks = new Map();

export function createTask(type) {
  const id = crypto.randomBytes(4).toString('hex');
  const task = {
    id,
    type,
    status: 'running',
    progress: 0,
    results: [],
    error: '',
  };
  tasks.set(id, task);
  return task;
}

export function getTask(id) {
  return tasks.get(id) || null;
}

export function updateTask(id, updates) {
  const existing = tasks.get(id);
  if (!existing) return null;
  Object.assign(existing, updates);
  return existing;
}

export function cancelTask(id) {
  const task = tasks.get(id);
  if (!task) return null;
  task.status = 'cancelled';
  return task;
}

export function getTaskStats() {
  const allTasks = [...tasks.values()];
  const allResults = allTasks.flatMap((task) => task.results || []);
  const openServers = allResults.filter(
    (result) => result.status === 'open' || result.status === 'not_whitelisted'
  ).length;
  const whitelisted = allResults.filter((result) => result.status === 'whitelisted').length;

  return {
    servers_discovered: allResults.length,
    open_servers: openServers,
    whitelisted,
    scans_completed: allTasks.filter((task) => task.status === 'completed').length,
    tasks: allTasks.slice(-20).map(({ id, type, status, progress }) => ({
      id,
      type,
      status,
      progress,
    })),
  };
}
