// Run with: node components/Payment/EcommPayMicroframe.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compile, parse } from '@vue/compiler-dom';
import { parse as parseSfc } from '@vue/compiler-sfc';
import * as Vue from 'vue';
import { renderToString } from 'vue/server-renderer';
import { stripTypeScriptTypes } from 'node:module';

const source = readFileSync(new URL('./EcommPayMicroframe.vue', import.meta.url), 'utf8');
const { descriptor } = parseSfc(source);
const render = new Function('Vue', compile(descriptor.template.content, { prefixIdentifiers: true }).code)(Vue);

async function checkout(overrides = {}) {
  return renderToString(Vue.createSSRApp({
    render,
    components: { NuxtLink: { template: '<a><slot /></a>' } },
    data: () => ({
      loading: false, done: false, submitting: false, termsAccepted: false, canSubmit: false,
      expressAvailable: false, buttonLabel: 'Get report', errorMessage: null,
      successMessage: null, pendingNotice: null, cardTargetId: 'card', expressTargetId: 'express',
      handleSubmit() {}, dismissError() {}, ...overrides,
    }),
  }));
}

const button = html => html.match(/<button\b[^>]*>/)[0];
assert.match(button(await checkout()), / disabled(?:[ =>])/);
assert.doesNotMatch(button(await checkout({ termsAccepted: true, canSubmit: true })), / disabled(?:[ =>])/);
const loading = await checkout({ loading: true });
assert.match(loading, /role="status"/);
assert.match(loading, /class="[^"]*invisible/);
assert.match(loading, / inert/);
assert.match(loading, /id="card"/);
assert.match(button(loading), / disabled(?:[ =>])/);
const submitting = await checkout({ termsAccepted: true, submitting: true, buttonLabel: 'PROCESSING...' });
assert.match(button(submitting), / disabled(?:[ =>])/);
assert.match(button(submitting), /aria-busy="true"/);
assert.match(submitting, /animate-spin/);
assert.match(submitting, /PROCESSING/);
assert.equal((submitting.match(/href="\/terms"/g) || []).length, 2);
const done = await checkout({ done: true, successMessage: 'Payment successful.' });
assert.match(done, /id="card"/);
assert.match(done, /class="[^"]*invisible/);
assert.match(done, /Payment successful/);

// Let the SDK size its fields without artificial minimums or a resize feedback loop.
assert.doesNotMatch(descriptor.scriptSetup.content, /ResizeObserver|\.style\.minHeight/);
assert.doesNotMatch(loading, /min-h-\[(?:320|96)px\]/);

const widgetFunction = descriptor.scriptSetup.content.match(/function runWidget\([\s\S]*?\n\}/)[0];
const loadResults = [];
const runWidget = new Function('sharedCallbacks', 'cardTargetId', 'finishLoading',
  `${stripTypeScriptTypes(widgetFunction)}; return runWidget;`)(
  () => ({}), { value: 'card' }, failed => loadResults.push(failed === true),
);
const api = { runEmbedded: options => options };
const cardOptions = runWidget(api, { target_element: 'card', payment_id: 'test' });
cardOptions.onLoaded();
cardOptions.onFailLoading();
assert.deepEqual(loadResults, [false, true]);
const expressOptions = runWidget(api, { target_element: 'express', payment_id: 'test-express' });
assert.equal(expressOptions.onLoaded, undefined, 'Wallet loading must not reveal an unfinished card form');

// Both providers use Stripe's fixed card size without scrolling or clipping payment fields.
const page = readFileSync(new URL('../../pages/Payment/Checkout.vue', import.meta.url), 'utf8');
const tree = parse(parseSfc(page).descriptor.template.content);
function findCard(node) {
  if (node.tag === 'div' && node.props.some(p => p.name === 'class' && p.value?.content.includes('bg-white'))) return node;
  return node.children?.map(findCard).find(Boolean);
}
const classes = findCard(tree).props.find(p => p.name === 'class').value.content;
assert.match(classes, /(?:^|\s)h-\[393px\]/);
assert.match(classes, /lg:h-\[32\.5rem\]/);
assert.doesNotMatch(descriptor.template.content, /overflow-(?:y-)?(?:auto|scroll|hidden|clip)/);
console.log('Checkout loading, submit, consent links and fixed card checks passed.');
