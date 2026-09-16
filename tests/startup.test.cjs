const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const script = fs.readFileSync(path.join(__dirname, '../gui/script.js'), 'utf8');

function launch(initialApi) {
  const elements = new Map();
  const listeners = {};
  const timers = new Map();
  let timerId = 0;
  const window = {
    addEventListener(name, callback) { listeners[name] = callback; },
  };
  if (initialApi) window.pywebview = { api: initialApi };
  const document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, {
        value: id === 'font-size' ? '11' : '# Test CV',
        style: {},
        events: {},
        addEventListener(name, callback) { this.events[name] = callback; },
      });
      return elements.get(id);
    },
  };
  const schedule = (callback, delay) => {
    timers.set(++timerId, { callback, delay });
    return timerId;
  };
  vm.runInNewContext(script, {
    window, document, setTimeout: schedule, setInterval: schedule,
    clearTimeout: id => timers.delete(id), clearInterval: id => timers.delete(id),
  });
  return {
    window, elements, timers,
    fire(delay) {
      for (const timer of [...timers.values()]) {
        if (timer.delay === delay) timer.callback();
      }
    },
    ready(api) {
      window.pywebview = { api };
      listeners.pywebviewready();
    },
  };
}

function makeApi() {
  return {
    previews: 0, checks: 0,
    async render_preview() { this.previews++; return { ok: true, html: '<h1>Test CV</h1>' }; },
    async generate_pdf() { return { ok: true, path: '/tmp/test.pdf' }; },
    async check_dependencies() { this.checks++; return { ok: true }; },
  };
}

test('missing bridge stops waiting and explains how to launch the desktop app', () => {
  const app = launch();
  app.fire(10000);
  assert.match(app.elements.get('status').textContent, /Open run.command/);
  assert.equal(app.elements.get('dep-banner').style.display, 'block');
  assert.equal(app.elements.get('btn-accept').disabled, true);
  assert.equal([...app.timers.values()].some(timer => timer.delay === 100), false);
});

test('delayed readiness coalesces preview requests and ignores duplicate events', async () => {
  const app = launch();
  for (let i = 0; i < 3; i++) {
    app.elements.get('font-size').events.input();
    app.fire(300);
  }
  const api = makeApi();
  app.ready(api);
  app.ready(api);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(api.previews, 1);
  assert.equal(api.checks, 1);
  assert.equal(app.elements.get('preview-frame').srcdoc, '<h1>Test CV</h1>');
});

test('polling recovers a missed event and requires actual API methods', () => {
  const app = launch({});
  assert.equal(app.elements.get('btn-preview').disabled, true);
  app.window.pywebview.api = makeApi();
  app.fire(100);
  assert.equal(app.elements.get('status').textContent, 'Ready.');
  assert.equal(app.timers.size, 0);
});

test('bridge available before the script starts initializes immediately', () => {
  const app = launch(makeApi());
  assert.equal(app.elements.get('status').textContent, 'Ready.');
  assert.equal(app.elements.get('btn-preview').disabled, false);
});

test('late readiness recovers after timeout without executing stale saves', () => {
  const app = launch();
  app.elements.get('btn-accept').events.click();
  app.fire(10000);
  const api = makeApi();
  api.generate_pdf = () => assert.fail('Stale save must not run');
  app.ready(api);
  assert.equal(app.elements.get('status').textContent, 'Ready.');
  assert.equal(app.elements.get('dep-banner').style.display, 'none');
  assert.equal(app.elements.get('btn-accept').disabled, false);
});
