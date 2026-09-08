import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { parse } from '@vue/compiler-sfc';
import { ref, computed } from 'vue';

const deferred = () => Promise.withResolvers();
const flush = async () => { for (let i = 0; i < 10; i++) await Promise.resolve(); };

function mount(name, store = {}, sdk = {}, apply = async () => {}) {
  const timers = [];
  const plan = { id: 1, plan_code: '48h-basic-subscription' };
  const globals = {
    ref, computed, useSubscriptionStore: () => store,
    useCarRegistrationSearchStore: () => ({ reg_number: 'TEST' }),
    usePlanStore: () => ({ getSelectedPlan: plan }),
    useAuthStore: () => ({ getCurrentUser: { email: 'test@example.com' } }),
    usePaymentSuccess: () => ({ applyPaymentPayload: apply, redirectToReport() {} }),
    useRuntimeConfig: () => ({ public: {} }), loadStripe: () => Promise.resolve(sdk),
    useHead() {}, onMounted() {}, onBeforeUnmount() {}, watch() {},
    setTimeout: callback => { timers.push(callback); return timers.length; },
    clearTimeout() {}, console: { error() {} },
  };
  const source = readFileSync(new URL(`./${name}.vue`, import.meta.url), 'utf8');
  const script = parse(source).descriptor.scriptSetup.content.replace(/^import[\s\S]*?;\n/gm, '');
  const expose = name === 'Stripe'
    ? `elements = {}; cardNumberElement = {};
       return { loading, done, paymentStarted, termsAccepted, cardholderName, errorMessage,
         submit: handleCheckoutClick, resetError };`
    : `cardPaymentId = 'card'; expressPaymentId = 'wallet'; cardWidget = sdkHandle;
       return { loading, done, submitting, termsAccepted, needsRestart, errorMessage, canSubmit,
         submit: handleSubmit, sharedCallbacks, dismissError };`;
  globals.sdkHandle = sdk;
  const state = new Function(...Object.keys(globals), stripTypeScriptTypes(script) + expose)(...Object.values(globals));
  state.loading.value = false;
  state.termsAccepted.value = true;
  if (state.cardholderName) state.cardholderName.value = 'Test Customer';
  return { ...state, timers, plan };
}

let submits = 0;
let polls = 0;
const status = deferred();
const ecomm = mount('EcommPayMicroframe', {
  checkEcommPayStatus: () => { polls++; return status.promise; },
}, { trySubmit: () => { submits++; } });
const card = ecomm.sharedCallbacks('card');
const wallet = ecomm.sharedCallbacks('wallet');
ecomm.submit(); ecomm.submit();
assert.equal(submits, 1);
assert.equal(ecomm.canSubmit.value, false);
let approvals = 0;
let rejections = 0;
const approve = () => { approvals++; };
const reject = () => { rejections++; };
await card.onCheckSubmit({}, approve, reject);
await card.onCheckSubmit({}, approve, reject);
await wallet.onCheckSubmit({}, approve, reject);
assert.equal(approvals, 1);
assert.equal(rejections, 2);
card.onShowLoader(); card.onHideLoader(); card.onValidationError();
wallet.onError({ messages: ['Unrelated wallet error'] });
ecomm.submit();
assert.equal(ecomm.canSubmit.value, false);
assert.equal(submits, 1);
card.onPaymentSuccess(); card.onHideLoader(); card.onPaymentSuccess();
assert.equal(polls, 1, 'Repeated success callbacks must not start concurrent confirmation polls');
assert.equal(ecomm.submitting.value, true);
status.resolve({ payload: { status: 'success' } });
await flush();
assert.equal(ecomm.done.value, true);
card.onPaymentFail(); ecomm.submit();
assert.equal(ecomm.canSubmit.value, false);
assert.equal(submits, 1);

let retries = 0;
const retry = mount('EcommPayMicroframe', {
  checkEcommPayStatus: async () => ({ payload: { status: 'pending' } }),
}, { trySubmit: () => { retries++; } });
const retryCard = retry.sharedCallbacks('card');
retry.submit(); retryCard.onValidationError();
assert.equal(retry.canSubmit.value, true);
retry.submit();
assert.equal(retries, 2);
await retryCard.onCheckSubmit({}, () => {}, reject);
retryCard.onError({ messages: ['Connection lost'] });
await flush();
assert.equal(retry.canSubmit.value, false, 'An ambiguous payment error must stay locked');
retryCard.onHideLoader(); retry.submit();
assert.equal(retries, 2);
retryCard.onPaymentFail();
assert.equal(retry.needsRestart.value, true);
assert.equal(retry.canSubmit.value, false, 'Declines require a fresh widget before another charge');

const walletFirst = mount('EcommPayMicroframe', {}, { trySubmit: () => assert.fail('Card submitted during wallet payment') });
await walletFirst.sharedCallbacks('wallet').onCheckSubmit({}, () => {}, reject);
walletFirst.sharedCallbacks('wallet').onHideLoader();
walletFirst.submit();
assert.equal(walletFirst.canSubmit.value, false);

let acceptedCallback;
let acceptedSubmits = 0;
const acceptedError = mount('EcommPayMicroframe', {
  checkEcommPayStatus: async () => ({ payload: { status: 'pending' } }),
}, { trySubmit: () => {
  acceptedSubmits++;
  acceptedCallback.onCheckSubmit({}, () => {}, reject);
  throw new Error('SDK failed after acceptance');
} });
acceptedCallback = acceptedError.sharedCallbacks('card');
acceptedError.submit(); acceptedError.submit();
assert.equal(acceptedSubmits, 1);
assert.equal(acceptedError.canSubmit.value, false);

const method = deferred(), intent = deferred(), confirmation = deferred(), subscription = deferred(), report = deferred();
const calls = { method: 0, intent: 0, confirmation: 0, subscription: 0 };
const stripe = mount('Stripe', {
  createPaymentIntent: () => { calls.intent++; return intent.promise; },
  processPayment: () => { calls.subscription++; return subscription.promise; },
}, {
  createPaymentMethod: () => { calls.method++; return method.promise; },
  confirmCardPayment: () => { calls.confirmation++; return confirmation.promise; },
}, () => report.promise);
const first = stripe.submit();
await stripe.submit(); await flush();
assert.equal(calls.method, 1);
method.resolve({ paymentMethod: { id: 'pm_test' } }); await flush();
await stripe.submit();
assert.equal(calls.intent, 1);
intent.resolve({ payload: { paymentStatus: 'requires_action', clientSecret: 'test', customerId: 'cus_test' } }); await flush();
await stripe.submit();
assert.equal(calls.confirmation, 1);
confirmation.resolve({ paymentIntent: { status: 'succeeded' } }); await flush();
await stripe.submit();
assert.equal(calls.subscription, 1);
subscription.resolve({ payload: {} }); await flush();
assert.equal(stripe.done.value, true);
await stripe.submit();
report.resolve(); await first; await stripe.submit();
assert.deepEqual(calls, { method: 1, intent: 1, confirmation: 1, subscription: 1 });

for (const failure of ['intent', 'subscription', 'report']) {
  let charges = 0;
  const checkout = mount('Stripe', {
    createPaymentIntent: async () => {
      charges++;
      if (failure === 'intent') throw new Error('Lost response');
      return { payload: { paymentStatus: 'succeeded', customerId: 'cus_test' } };
    },
    processPayment: async () => { throw new Error('Lost subscription response'); },
  }, { createPaymentMethod: async () => ({ paymentMethod: { id: 'pm_test' } }) },
  async () => { throw new Error('Local storage failed'); });
  if (failure === 'report') checkout.plan.plan_code = 'single-offer';
  await checkout.submit();
  assert.equal(checkout.paymentStarted.value, true, failure);
  checkout.resetError();
  await checkout.submit();
  assert.equal(charges, 1, failure);
}

for (const paymentStatus of ['requires_payment_method', 'processing']) {
  const checkout = mount('Stripe', {
    createPaymentIntent: async () => ({ payload: { paymentStatus: 'requires_action' } }),
  }, {
    createPaymentMethod: async () => ({ paymentMethod: { id: 'pm_test' } }),
    confirmCardPayment: async () => ({ error: { message: 'Not completed', payment_intent: { status: paymentStatus } } }),
  });
  await checkout.submit();
  assert.equal(checkout.paymentStarted.value, paymentStatus === 'processing');
}
const invalid = mount('Stripe', {}, {
  createPaymentMethod: async () => ({ error: { message: 'Invalid card number' } }),
});
await invalid.submit();
assert.equal(invalid.loading.value, false);
assert.equal(invalid.paymentStarted.value, false);
console.log('Both checkout submission locks passed repeat-click, callback, confirmation and failure checks.');
