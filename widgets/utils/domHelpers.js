export function createHeadline(text) {
  const h2 = document.createElement('h2');
  h2.textContent = text;
  return h2;
}

export function createSubheadline(text) {
  const p = document.createElement('p');
  p.textContent = text;
  return p;
}

export function createButton(label, className, onClick) {
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.className = className;
  btn.onclick = onClick;
  return btn;
}

export function createSelect(options = []) {
  const select = document.createElement('select');
  options.forEach((opt) => {
    const option = document.createElement('option');
    option.value = opt.value || opt;
    option.textContent = opt.label || `${opt} month${opt > 1 ? 's' : ''}`;
    select.appendChild(option);
  });
  return select;
}
