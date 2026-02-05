export function identifyElement(element: Element): string {
  return element.tagName.toLowerCase();
}

export function getElementPath(element: Element): string {
  const path: string[] = [];
  let current: Element | null = element;

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();

    // Add ID if present
    if (current.id) {
      selector += `#${current.id}`;
      path.unshift(selector);
      break; // ID is unique, stop here
    }

    // Add first class if present
    if (current.classList.length > 0) {
      selector += `.${current.classList[0]}`;
    }

    path.unshift(selector);
    current = current.parentElement;
  }

  return path.length > 0 ? path.join(' > ') : 'unknown';
}

export function getFullElementPath(element: Element): string {
  const path: string[] = [];
  let current: Element | null = element;

  while (current) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      selector += `#${current.id}`;
    }

    if (current.classList.length > 0) {
      selector += `.${Array.from(current.classList).join('.')}`;
    }

    path.unshift(selector);

    if (current === document.documentElement) break;
    current = current.parentElement;
  }

  return path.join(' > ');
}

export function getNearbyText(element: Element): string {
  const text = element.textContent?.trim() || '';
  return text.slice(0, 100);
}

export function getElementClasses(element: Element): string {
  return Array.from(element.classList).join(' ');
}

export function getAccessibilityInfo(element: Element): string {
  const info: string[] = [];

  const role = element.getAttribute('role');
  if (role) info.push(`role=${role}`);

  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) info.push(`aria-label=${ariaLabel}`);

  const ariaDescribedBy = element.getAttribute('aria-describedby');
  if (ariaDescribedBy) info.push(`aria-describedby=${ariaDescribedBy}`);

  return info.join(', ');
}

export function getNearbyElements(element: Element): string {
  const nearby: string[] = [];

  // Previous sibling
  if (element.previousElementSibling) {
    nearby.push(`<${identifyElement(element.previousElementSibling)}>`);
  }

  // Next sibling
  if (element.nextElementSibling) {
    nearby.push(`<${identifyElement(element.nextElementSibling)}>`);
  }

  return nearby.join(', ');
}

export function getDetailedComputedStyles(element: Element): string {
  const computed = window.getComputedStyle(element);
  const important = [
    'display',
    'position',
    'width',
    'height',
    'background-color',
    'color',
    'font-size',
    'padding',
    'margin',
  ];

  return important
    .map(prop => `${prop}: ${computed.getPropertyValue(prop)}`)
    .join('; ');
}

export function getForensicComputedStyles(element: Element): string {
  const computed = window.getComputedStyle(element);
  const allProps: string[] = [];

  for (let i = 0; i < computed.length; i++) {
    const prop = computed[i];
    allProps.push(`${prop}: ${computed.getPropertyValue(prop)}`);
  }

  return allProps.join('; ');
}
