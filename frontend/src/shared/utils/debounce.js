// shared/utils/debounce.js

export default function debounce(fn, delay = 300) {
  let timer;

  return (...args) => {
    // clear previous timer
    if (timer) {
      clearTimeout(timer);
    }

    // set new timer
    timer = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}