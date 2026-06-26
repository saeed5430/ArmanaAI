export const MODEL_PRIORITY = [
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek Free',
    free: true
  },
  {
    id: 'qwen/qwen-2.5-72b-instruct',
    name: 'Qwen Free',
    free: true
  },
  {
    id: 'google/gemma-2-27b-it',
    name: 'Gemma Free',
    free: true
  },
  {
    id: 'microsoft/phi-3-mini-128k-instruct',
    name: 'Phi-3 Free',
    free: true
  },
  {
    id: 'meta-llama/llama-3.1-8b-instruct',
    name: 'Llama 3.1 8B',
    free: true
  }
];

let currentModelIndex = 0;

export function getCurrentModel() {
  return MODEL_PRIORITY[currentModelIndex];
}

export function fallbackToNextModel() {
  if (currentModelIndex < MODEL_PRIORITY.length - 1) {
    currentModelIndex++;
    return getCurrentModel();
  }
  return null;
}

export function resetModelIndex() {
  currentModelIndex = 0;
}

export function shouldRetry(status) {
  return [429, 500, 502, 503, 504].includes(status);
}

export function isTimeoutError(error) {
  return error?.name === 'TimeoutError' ||
         error?.message?.includes('timeout') ||
         error?.message?.includes('timed out');
}

export function isUnavailableError(error) {
  return error?.message?.includes('unavailable') ||
         error?.message?.includes('not found') ||
         error?.message?.includes('model not');
}
