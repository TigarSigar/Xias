// Lightweight, robust DOM parser and DOM environment for XIAS tests
// Implements DOM tree, CSS selector matching (tags, classes, IDs, attribute selectors, commas),
// innerText, React controlled input setter descriptors, and synthetic event dispatch.

class DOMEvent {
  constructor(type, options = {}) {
    this.type = type;
    this.bubbles = options.bubbles ?? false;
    this.cancelable = options.cancelable ?? false;
    this.target = null;
    this.currentTarget = null;
    this.defaultPrevented = false;
  }
  preventDefault() {
    if (this.cancelable) this.defaultPrevented = true;
  }
  stopPropagation() {}
}

class DOMNode {
  constructor(nodeType, nodeName) {
    this.nodeType = nodeType; // 1 = ELEMENT_NODE, 3 = TEXT_NODE
    this.nodeName = nodeName;
    this.parentNode = null;
    this.childNodes = [];
  }

  remove() {
    if (this.parentNode) {
      const idx = this.parentNode.childNodes.indexOf(this);
      if (idx !== -1) {
        this.parentNode.childNodes.splice(idx, 1);
      }
      this.parentNode = null;
    }
  }
}

class DOMTextNode extends DOMNode {
  constructor(text) {
    super(3, '#text');
    this.text = text;
  }
  get textContent() {
    return this.text;
  }
  set textContent(val) {
    this.text = String(val);
  }
  get innerText() {
    return this.text;
  }
}

class DOMElement extends DOMNode {
  constructor(tagName) {
    super(1, tagName.toUpperCase());
    this.tagName = tagName.toUpperCase();
    this.attributes = {};
    this.style = {};
    this.eventListeners = {};
    this._value = '';
    this.form = null;
  }

  getAttribute(name) {
    return this.attributes[name.toLowerCase()] ?? null;
  }

  setAttribute(name, value) {
    const lower = name.toLowerCase();
    this.attributes[lower] = String(value);
    if (lower === 'id') this.id = String(value);
    if (lower === 'class') this.className = String(value);
    if (lower === 'type') this.type = String(value);
    if (lower === 'name') this.name = String(value);
    if (lower === 'value') this._value = String(value);
    if (lower === 'href') this.href = String(value);
    if (lower === 'src') this.src = String(value);
  }

  hasAttribute(name) {
    return Object.prototype.hasOwnProperty.call(this.attributes, name.toLowerCase());
  }

  removeAttribute(name) {
    delete this.attributes[name.toLowerCase()];
  }

  get id() {
    return this.attributes['id'] || '';
  }
  set id(val) {
    this.attributes['id'] = val;
  }

  get className() {
    return this.attributes['class'] || '';
  }
  set className(val) {
    this.attributes['class'] = val;
  }

  get classList() {
    const self = this;
    const tokens = (this.className || '').trim().split(/\s+/).filter(Boolean);
    return {
      contains(c) {
        return tokens.includes(c);
      },
      add(c) {
        if (!tokens.includes(c)) tokens.push(c);
        self.className = tokens.join(' ');
      },
      remove(c) {
        const idx = tokens.indexOf(c);
        if (idx !== -1) tokens.splice(idx, 1);
        self.className = tokens.join(' ');
      }
    };
  }

  get type() {
    return this.attributes['type'] || '';
  }
  set type(val) {
    this.attributes['type'] = val;
  }

  get name() {
    return this.attributes['name'] || '';
  }
  set name(val) {
    this.attributes['name'] = val;
  }

  get href() {
    return this.attributes['href'] || '';
  }
  set href(val) {
    this.attributes['href'] = val;
  }

  get src() {
    return this.attributes['src'] || '';
  }
  set src(val) {
    this.attributes['src'] = val;
  }

  get value() {
    return this._value;
  }
  set value(val) {
    this._value = String(val);
  }

  get checked() {
    return this.hasAttribute('checked');
  }
  set checked(val) {
    if (val) this.setAttribute('checked', 'checked');
    else this.removeAttribute('checked');
  }

  get innerText() {
    let text = '';
    for (const child of this.childNodes) {
      if (child.nodeType === 3) {
        text += child.text;
      } else if (child.nodeType === 1) {
        const tag = child.tagName;
        if (tag === 'BR') text += '\n';
        else if (tag === 'TR' || tag === 'DIV' || tag === 'P' || tag === 'H1' || tag === 'H2' || tag === 'H3' || tag === 'HR') {
          text += '\n' + child.innerText + '\n';
        } else if (tag === 'TD' || tag === 'TH') {
          text += ' ' + child.innerText + ' ';
        } else {
          text += child.innerText;
        }
      }
    }
    return text.replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n\s+\n/g, '\n\n').trim();
  }

  set innerText(val) {
    this.childNodes = [new DOMTextNode(String(val))];
    this.childNodes[0].parentNode = this;
  }

  get textContent() {
    let text = '';
    for (const child of this.childNodes) {
      if (child.nodeType === 3) {
        text += child.text;
      } else if (child.nodeType === 1) {
        text += child.textContent;
      }
    }
    return text;
  }

  set textContent(val) {
    this.childNodes = [new DOMTextNode(String(val))];
    this.childNodes[0].parentNode = this;
  }

  get cells() {
    if (this.tagName === 'TR') {
      return this.childNodes.filter(c => c.nodeType === 1 && (c.tagName === 'TD' || c.tagName === 'TH'));
    }
    return [];
  }

  get innerHTML() {
    return serializeHTML(this.childNodes);
  }

  set innerHTML(html) {
    this.childNodes = [];
    const parsedNodes = parseHTMLFragment(html);
    for (const node of [...parsedNodes]) {
      this.appendChild(node);
    }
  }

  appendChild(child) {
    if (!child) return null;
    if (child.parentNode) {
      child.remove();
    }
    child.parentNode = this;
    this.childNodes.push(child);
    return child;
  }

  prepend(child) {
    if (!child) return null;
    if (child.parentNode) {
      child.remove();
    }
    child.parentNode = this;
    this.childNodes.unshift(child);
    return child;
  }

  remove() {
    if (this.parentNode) {
      const idx = this.parentNode.childNodes.indexOf(this);
      if (idx !== -1) {
        this.parentNode.childNodes.splice(idx, 1);
      }
      this.parentNode = null;
    }
  }

  addEventListener(type, handler) {
    if (!this.eventListeners[type]) this.eventListeners[type] = [];
    this.eventListeners[type].push(handler);
  }

  removeEventListener(type, handler) {
    if (!this.eventListeners[type]) return;
    this.eventListeners[type] = this.eventListeners[type].filter(h => h !== handler);
  }

  dispatchEvent(event) {
    event.target = this;
    let cur = this;
    while (cur) {
      event.currentTarget = cur;
      if (typeof cur['on' + event.type] === 'function') {
        try {
          cur['on' + event.type].call(cur, event);
        } catch (e) {
          console.error(e);
        }
      }
      const handlers = cur.eventListeners[event.type] || [];
      for (const h of handlers) {
        try {
          h.call(cur, event);
        } catch (e) {
          console.error(e);
        }
      }
      if (!event.bubbles) break;
      cur = cur.parentNode;
    }
    return !event.defaultPrevented;
  }

  click() {
    const ev = new DOMEvent('click', { bubbles: true, cancelable: true });
    this.dispatchEvent(ev);
    if (!ev.defaultPrevented && this.type === 'submit' && this.form) {
      this.form.submit();
    }
  }

  submit() {
    const ev = new DOMEvent('submit', { bubbles: true, cancelable: true });
    this.dispatchEvent(ev);
  }

  closest(selector) {
    let cur = this;
    while (cur && cur.nodeType === 1) {
      if (typeof matchesSingle === 'function' && matchesSingle(cur, selector)) return cur;
      cur = cur.parentNode;
    }
    return null;
  }

  querySelector(selector) {
    const results = this.querySelectorAll(selector);
    return results.length > 0 ? results[0] : null;
  }

  querySelectorAll(selector) {
    const commaParts = selector.split(',').map(s => s.trim()).filter(Boolean);
    const set = new Set();
    for (const part of commaParts) {
      collectMatches(this, part, set);
    }
    return Array.from(set);
  }
}

class HTMLInputElement extends DOMElement {
  constructor() {
    super('INPUT');
  }
}

// React controlled input setter emulation on HTMLInputElement prototype
Object.defineProperty(HTMLInputElement.prototype, 'value', {
  get() {
    return this._value;
  },
  set(v) {
    this._value = String(v);
  },
  configurable: true,
  enumerable: true
});

function serializeHTML(nodes) {
  let html = '';
  for (const node of nodes) {
    if (node.nodeType === 3) {
      html += node.text;
    } else if (node.nodeType === 1) {
      const tag = node.tagName.toLowerCase();
      html += `<${tag}`;
      for (const [k, v] of Object.entries(node.attributes)) {
        html += ` ${k}="${String(v).replace(/"/g, '&quot;')}"`;
      }
      html += '>';
      if (!['input', 'img', 'br', 'hr', 'meta', 'link'].includes(tag)) {
        html += serializeHTML(node.childNodes);
        html += `</${tag}>`;
      }
    }
  }
  return html;
}

// Simple selector matcher
function matchesSingle(element, token) {
  if (element.nodeType !== 1) return false;
  token = token.trim();
  if (token === '*') return true;

  // Attribute selector like input[type="password"] or input[name*="login" i] or a[href*="tasks"]
  const attrMatch = token.match(/^([a-zA-Z0-9_-]+)?\[([a-zA-Z0-9_-]+)([~|^$*]?=)?['"]?([^'"\]]*)['"]?(\s+i)?\]$/i);
  if (attrMatch) {
    const [, tag, attrName, op, expectedVal, flag] = attrMatch;
    if (tag && element.tagName.toLowerCase() !== tag.toLowerCase()) return false;
    const actualVal = element.getAttribute(attrName);
    if (actualVal === null) return false;
    if (!op) return true; // existence

    const isCaseInsensitive = !!flag;
    const a = isCaseInsensitive ? actualVal.toLowerCase() : actualVal;
    const e = isCaseInsensitive ? expectedVal.toLowerCase() : expectedVal;

    if (op === '=') return a === e;
    if (op === '*=') return a.includes(e);
    if (op === '^=') return a.startsWith(e);
    if (op === '$=') return a.endsWith(e);
    return false;
  }

  // ID selector
  if (token.startsWith('#')) {
    return element.id === token.slice(1);
  }

  // Class selector
  if (token.startsWith('.')) {
    return element.classList.contains(token.slice(1));
  }

  // Tag with class, e.g. div.xias-badge
  const tagClassMatch = token.match(/^([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_-]+)$/);
  if (tagClassMatch) {
    return element.tagName.toLowerCase() === tagClassMatch[1].toLowerCase() &&
           element.classList.contains(tagClassMatch[2]);
  }

  // Pure Tag
  return element.tagName.toLowerCase() === token.toLowerCase();
}

function collectMatches(root, selector, resultSet) {
  const parts = selector.trim().split(/\s+/);
  if (parts.length === 1) {
    findDescendants(root, (el) => {
      if (el !== root && matchesSingle(el, parts[0])) {
        resultSet.add(el);
      }
    });
  } else if (parts.length === 2) {
    // Parent descendant
    const [ancestorSel, descendantSel] = parts;
    findDescendants(root, (el) => {
      if (el !== root && matchesSingle(el, descendantSel)) {
        let p = el.parentNode;
        while (p && p !== root) {
          if (matchesSingle(p, ancestorSel)) {
            resultSet.add(el);
            break;
          }
          p = p.parentNode;
        }
      }
    });
  }
}

function findDescendants(node, callback) {
  if (node.nodeType === 1) {
    callback(node);
  }
  for (const child of node.childNodes) {
    if (child.nodeType === 1) {
      findDescendants(child, callback);
    }
  }
}

// Lightweight HTML Parser
function parseHTMLFragment(html) {
  const root = new DOMElement('CONTAINER');
  let current = root;
  const tagRegex = /<!--[\s\S]*?-->|<(\/)?([a-zA-Z0-9_-]+)((?:\s+[a-zA-Z0-9_:-]+(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/)?>|([^<]+)/g;

  let match;
  while ((match = tagRegex.exec(html)) !== null) {
    const [full, isClose, tagName, rawAttrs, isSelfClosing, textContent] = match;

    if (full.startsWith('<!--')) {
      continue;
    }

    if (textContent) {
      const textNode = new DOMTextNode(textContent);
      current.appendChild(textNode);
      continue;
    }

    const tag = tagName.toLowerCase();

    if (isClose) {
      if (current.parentNode && current !== root) {
        current = current.parentNode;
      }
      continue;
    }

    const el = tag === 'input' ? new HTMLInputElement() : new DOMElement(tag);

    // Parse attributes
    if (rawAttrs) {
      const attrRegex = /([a-zA-Z0-9_:-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
      let am;
      while ((am = attrRegex.exec(rawAttrs)) !== null) {
        const attrName = am[1];
        const attrVal = am[2] ?? am[3] ?? am[4] ?? '';
        el.setAttribute(attrName, attrVal);
      }
    }

    current.appendChild(el);

    const voidTags = ['input', 'img', 'br', 'hr', 'meta', 'link'];
    if (!isSelfClosing && !voidTags.includes(tag)) {
      current = el;
    }
  }

  // Link inputs to form if inside form
  findDescendants(root, (el) => {
    if (el.tagName === 'FORM') {
      findDescendants(el, (child) => {
        if (child.tagName === 'INPUT' || child.tagName === 'BUTTON') {
          child.form = el;
        }
      });
    }
  });

  return [...root.childNodes];
}

class DOMDocument extends DOMElement {
  constructor() {
    super('#document');
    this.body = new DOMElement('BODY');
    this.head = new DOMElement('HEAD');
    this.appendChild(this.head);
    this.appendChild(this.body);
  }

  getElementById(id) {
    const matches = this.querySelectorAll(`#${id}`);
    return matches.length > 0 ? matches[0] : null;
  }

  createElement(tagName) {
    const tag = tagName.toLowerCase();
    return tag === 'input' ? new HTMLInputElement() : new DOMElement(tag);
  }
}

function createStorage() {
  const store = {};
  return {
    getItem(key) {
      return store[key] ?? null;
    },
    setItem(key, val) {
      store[key] = String(val);
    },
    removeItem(key) {
      delete store[key];
    },
    clear() {
      for (const k of Object.keys(store)) delete store[k];
    },
    _getStore() {
      return store;
    }
  };
}

class DOMParser {
  parseFromString(html) {
    const { document } = createDOMEnvironment(html);
    return document;
  }
}

function createDOMEnvironment(html = '', url = 'https://xiais.kemsu.ru/proc/stud/index.shtm') {
  const doc = new DOMDocument();
  const parsedNodes = parseHTMLFragment(html);

  // If there's an HTML/BODY in parsedNodes, extract body contents
  let bodyFound = null;
  for (const n of parsedNodes) {
    if (n.tagName === 'HTML') {
      for (const c of n.childNodes) {
        if (c.tagName === 'BODY') bodyFound = c;
      }
    } else if (n.tagName === 'BODY') {
      bodyFound = n;
    }
  }

  if (bodyFound) {
    const oldIdx = doc.childNodes.indexOf(doc.body);
    if (oldIdx !== -1) {
      doc.childNodes[oldIdx] = bodyFound;
    } else {
      doc.appendChild(bodyFound);
    }
    bodyFound.parentNode = doc;
    doc.body = bodyFound;
  } else {
    for (const n of parsedNodes) {
      doc.body.appendChild(n);
    }
  }

  const parsedUrl = new URL(url);

  const win = {
    location: {
      href: url,
      origin: parsedUrl.origin,
      pathname: parsedUrl.pathname,
      search: parsedUrl.search,
      assign(newHref) { this.href = newHref; }
    },
    document: doc,
    Event: DOMEvent,
    CustomEvent: DOMEvent,
    sessionStorage: createStorage(),
    localStorage: createStorage(),
    HTMLInputElement,
    DOMParser,
    __XIAS_TEST__: true,
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    clearTimeout: (id) => clearTimeout(id),
    console
  };

  return { window: win, document: doc };
}

module.exports = {
  createDOMEnvironment,
  DOMEvent,
  DOMElement,
  HTMLInputElement,
  DOMParser
};
