const DEFAULT_MODE = 'token-coherent';
const VALID_MODES = ['per-letter', 'per-token', 'token-coherent'];
const onEl = document.getElementById('on');

chrome.storage.local.get({ on: false, mode: DEFAULT_MODE }, ({ on, mode }) => {
  onEl.checked = !!on;
  const value = VALID_MODES.includes(mode) ? mode : DEFAULT_MODE;
  const radio = document.querySelector(`input[name="mode"][value="${value}"]`);
  if (radio) radio.checked = true;
});

onEl.addEventListener('change', () => {
  chrome.storage.local.set({ on: onEl.checked });
});

document.querySelectorAll('input[name="mode"]').forEach((el) => {
  el.addEventListener('change', () => {
    if (el.checked) chrome.storage.local.set({ mode: el.value });
  });
});
