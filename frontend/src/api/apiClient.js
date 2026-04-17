// Storage-only stub — no longer uses axios or any backend
// This file is kept to avoid breaking any stale imports during transition.
// All data now comes from ../storage.js

const apiClient = {
  get: () => Promise.reject(new Error('apiClient is disabled — use storage.js')),
  post: () => Promise.reject(new Error('apiClient is disabled — use storage.js')),
  patch: () => Promise.reject(new Error('apiClient is disabled — use storage.js')),
  put: () => Promise.reject(new Error('apiClient is disabled — use storage.js')),
};

export default apiClient;
