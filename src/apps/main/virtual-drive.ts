if (process.platform === 'win32') {
  import('./background-processes/sync-engine');
}

if (process.platform === 'linux') {
  import('../fuse');
}
