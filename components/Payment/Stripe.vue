<script setup lang="ts">
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import type { StripeCardCvcElement, StripeCardExpiryElement, StripeCardNumberElement, StripeElements } from '@stripe/stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useSubscriptionStore } from '@/stores/subscription';
import { useCarRegistrationSearchStore } from '@/stores/carRegistrationSearch';
import { usePlanStore } from '@/stores/plan';

const auth = useAuthStore();
const plan = usePlanStore();

const subscriptionStore = useSubscriptionStore();
const registrationSearchStore = useCarRegistrationSearchStore();
const { applyPaymentPayload, redirectToReport } = usePaymentSuccess();

const envConfig = useRuntimeConfig();
const stripePromise = loadStripe(envConfig.public.stripe_public_key as string);
const loading = ref(false);
const done = ref(false);
const termsAccepted = ref(false);
const cardholderName = ref('');
const buttonProcess = ref('Get report');

let elements: StripeElements;
let cardNumberElement: StripeCardNumberElement;
let cardExpiryElement: StripeCardExpiryElement;
let cardCvcElement: StripeCardCvcElement;
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);
const formValidationMessage = ref<string | null>(null);
const customerId = ref('');
const paymentMethodId = ref('');

const style = {
    base: {
        color: '#32325D',
        fontSize: '16px',
        '::placeholder': {
            color: '#BEC0C6',
        }
    },
    invalid: {
        color: '#FA755A',
        iconColor: '#FA755A',
    },
};

onMounted(async () => {
    try {
        const stripe = await stripePromise;
        if (!stripe) throw new Error('Unable to load the payment form. Please reload the page.');
        elements = stripe.elements();
        cardNumberElement = elements.create('cardNumber', { placeholder: '0000 0000 0000 0000', style });
        cardNumberElement.mount('#card-number-element');
        cardExpiryElement = elements.create('cardExpiry', { placeholder: '01/25', style });
        cardExpiryElement.mount('#card-expiry-element');
        cardCvcElement = elements.create('cardCvc', { placeholder: '584', style });
        cardCvcElement.mount('#card-cvc-element');

    } catch {
        errorMessage.value = 'Unable to load the payment form. Please reload the page or contact support.';
    }
});
async function handleCheckoutClick() {
    if (loading.value || done.value) return;
    buttonProcess.value = "PROCESSING...";
    try {
        resetError();
        // Validate form inputs
        if (!cardholderName.value) {
            formValidationMessage.value = "Cardholder's name is required.";
            buttonProcess.value = "PROCESS";
            return;
        }
        if (!termsAccepted.value) {
            formValidationMessage.value = "You must accept the terms and conditions.";
            buttonProcess.value = "PROCESS";
            return;
        }
        loading.value = true;
        const stripe = await stripePromise;
        if (!stripe || !elements) {
            console.error('Stripe.js has not yet loaded.');
            buttonProcess.value = "PROCESS";
            return;
        }
        const { error, paymentMethod } = await stripe.createPaymentMethod({
            type: 'card',
            card: cardNumberElement,
            billing_details: {
                name: cardholderName.value,
            },
        });

        if (error) {
            console.error(error);
            (errorMessage.value as any) = error.message;
            buttonProcess.value = "PROCESS";
            return;
        }

        if (plan.getSelectedPlan == null) {
            console.error(error);
            (errorMessage.value as any) = "User don't have any plan";
            buttonProcess.value = "PROCESS";
            return;
        }
        const response = await subscriptionStore.createPaymentIntent(
            paymentMethod.id,
            { name: cardholderName.value },
            plan.getSelectedPlan.id,
        );


        if (response.payload.paymentStatus !== 'succeeded') {
            const { paymentIntent, error: confirmError } = await stripe.confirmCardPayment(response.payload.clientSecret, {
                payment_method: paymentMethod.id,
            });
            if (confirmError) {
                buttonProcess.value = "PROCESS";
                (errorMessage.value as any) = confirmError.message;
                return;
            }
        }
        const customer_id = response.payload.customerId;
        customerId.value = customer_id;
        paymentMethodId.value = paymentMethod.id;

        // handling single offer plan
        if (plan.getSelectedPlan) {
            let selectedPlan = plan.getSelectedPlan;
            if (selectedPlan.plan_code === "single-offer") {
                let payload = response.payload;
                successMessage.value = "Payment successful.";
                if (payload?.hasSubscription) {
                    await subscriptionStore.setHasSubscription(payload.hasSubscription);
                }
                const regNumber = registrationSearchStore.reg_number || localStorage.getItem('reg_number');
                if (regNumber) {
                    await registrationSearchStore.searchCarRegNumber(regNumber);
                }
                done.value = true;
                buttonProcess.value = "DONE!";
                redirectToReport();
            } else {
                await createSubscription(selectedPlan);
            }
        }
    } catch (error) {

        if (!error.data?.success) {
            errorMessage.value = error.data.message;

        }
        console.error({ error });
        buttonProcess.value = "PROCESS";
    } finally {
        if (!done.value) {
            loading.value = false;
            buttonProcess.value = "PROCESS";
        }
    }
}

async function createSubscription(selectedPlan) {
    const user = auth.getCurrentUser;
    buttonProcess.value = "ALMOST THERE!";
    try {
        const response = await subscriptionStore.processPayment({
            customerId: customerId.value,
            paymentMethodId: paymentMethodId.value,
            email: user.email,
            billingDetails: { name: cardholderName.value },
            planId: selectedPlan.id,
            regNumber: registrationSearchStore.reg_number,
        });
        // if (response.success) {
        //     successMessage.value = "Payment done successfully.";
        //     buttonProcess.value = "DONE!";
        // }
        // Shared with the ECOMMPAY checkout so both providers settle identically.
        await applyPaymentPayload(response.payload);

        // if (selectedPlan.plan_code === '48h-basic-subscription') {
        //     navigateTo('/vehicle/basic-report');
        // } else if (selectedPlan.plan_code === '48h-export-subscription') {
        //     navigateTo('/vehicle/export-report');
        // } else {
        //     navigateTo('/vehicle/single-offer-report');
        // }
        done.value = true;
        successMessage.value = "Payment successful.";
        redirectToReport();
        buttonProcess.value = "REDIRECTING!";

    } catch (error) {
        buttonProcess.value = "FAILED!";
        console.error("Error creating subscription: ", error);
        if (error.data && error.data.success === false) {
            errorMessage.value = error.data.message;
        } else {
            errorMessage.value = "An unexpected error occurred while creating the subscription.";
        }
    }
}

function resetError() {
    errorMessage.value = null;
    formValidationMessage.value = null;
}

watch(errorMessage, (newErrorMessage) => {
    if (newErrorMessage) {
        setTimeout(() => {
            errorMessage.value = null;
        }, 5000);
    }
});



</script>
<template>
    <form @submit.prevent="handleCheckoutClick" class="w-full h-full p-0 m-0">
        <div class="alert alert-danger" v-if="errorMessage">
            <span class="alert alert-danger">{{ errorMessage }}</span>
        </div>

        <div class="w-full mb-3 lg:mb-4">
            <label for="cardholder-name" class="block mb-0.5 text-[13px] leading-5 lg:mb-1 lg:text-[17.5px] lg:leading-6">Cardholder’s Name</label>
            <div class="flex items-center h-[45px] border-2 border-[#0F1829] rounded-[7px] w-full overflow-hidden lg:h-[60px] lg:rounded-lg">
                <div class="flex items-center justify-center w-14 h-[23px] border-r border-black shrink-0 lg:w-16 lg:h-[30px]">
                    <img src="/assets/svg/cardName.svg" class="object-contain w-[30px] h-[23px] lg:w-10 lg:h-[30px]" alt="" />
                </div>
                <input v-model="cardholderName" type="text" id="cardholder-name" placeholder="John Doe"
                    class="w-full p-2 bg-transparent placeholder:text-[#BEC0C6] md:p-3 focus:border-none focus:outline-none active:border-none active:outline-none focus:ring-0 focus:ring-offset-0" />
            </div>
        </div>
        <div class="w-full mb-3 lg:mb-4">
            <label for="card-number-element" class="block mb-0.5 text-[13px] leading-5 lg:mb-1 lg:text-[17.5px] lg:leading-6">Card Number</label>
            <div class="flex items-center h-[45px] border-2 border-[#0F1829] rounded-[7px] overflow-hidden lg:h-[60px] lg:rounded-lg">
                <div class="flex items-center justify-center w-14 h-6 border-r border-black shrink-0 lg:w-16 lg:h-8">
                    <img src="/assets/svg/cardNumber.svg" class="object-contain w-[30px] h-6 lg:w-10 lg:h-8" alt="" />
                </div>
                <div id="card-number-element" class="w-full p-2 border-none md:p-3">
                </div>
            </div>
        </div>
        <div class="grid w-full grid-cols-[142px_1fr] gap-[15px] mb-4 lg:grid-cols-[188px_1fr] lg:gap-6">
            <div>
                <label for="card-expiry-element" class="block text-[13px] leading-5 lg:text-[17.5px] lg:leading-6">Expiry</label>
                <div class="flex items-center h-[45px] border-2 border-[#0F1829] rounded-[7px] overflow-hidden lg:h-[60px] lg:rounded-lg">
                    <div class="flex items-center justify-center w-14 h-[26px] border-r border-black shrink-0 lg:w-16 lg:h-[34px]">
                        <img src="/assets/svg/cardExpiry.svg" alt="" class="object-contain w-[25px] h-[26px] lg:w-[33px] lg:h-[34px]" />
                    </div>
                    <div id="card-expiry-element" class="w-full p-2 border-none md:p-3">
                    </div>
                </div>
            </div>

            <div>
                <label for="card-cvc-element" class="block text-[13px] leading-5 lg:text-[17.5px] lg:leading-6">CVV</label>
                <div class="flex items-center h-[45px] border-2 border-[#0F1829] rounded-[7px] overflow-hidden lg:h-[60px] lg:rounded-lg">
                    <!-- <div class="px-3 border-r border-black">
                        <img src="/assets/svg/cardCvv.svg" alt="" />

                    </div> -->
                    <div id="card-cvc-element" class="w-full p-2 border-none md:p-3">
                    </div>
                </div>
            </div>
        </div>
        <div class="flex items-center justify-center w-full space-x-2">
            <input type="checkbox" v-model="termsAccepted" id="agree-terms" class="mr-2 w-4 h-4 lg:w-[1.35rem] lg:h-[1.35rem]"
                style="border:1px solid #0F1829 !important; border-radius: 30% !important;" />
            <label for="agree-terms" class="flex-1 text-[15px] font-thin leading-[1.15] lg:text-[20px]">
                I agree to the
                <a href="/terms" target="_blank" class="text-brand"> privacy policy</a>
                and
                <a href="/terms" target="_blank" class="text-brand"> terms & conditions</a> of
                service.
            </label>
        </div>

        <div v-if="formValidationMessage" class="mt-2 text-red-500">
            {{ formValidationMessage }}
        </div>

        <div class="flex items-center justify-center h-[35px] mt-5 lg:h-[46px]">
            <div v-if="successMessage"
                class="relative px-4 py-3 text-green-700 bg-green-100 border border-green-400 rounded" role="alert">
                <span class="block sm:inline">{{ successMessage }}</span>
                <br>
            </div>
            <button v-else type="submit" :disabled="loading || done" :aria-busy="loading"
                class="flex items-center justify-center w-full h-[35px] gap-2 px-3 text-[15px] font-bold text-center text-white rounded-[6px] hover:bg-brand/90 focus:ring-4 focus:outline-none focus:ring-blue-300 bg-brand disabled:cursor-not-allowed lg:h-[46px] lg:text-[20px] lg:rounded-lg"
                :class="loading ? 'opacity-70' : ''">
                <span v-if="loading" class="w-5 h-5 border-2 rounded-full border-white/40 border-t-white animate-spin"
                    aria-hidden="true"></span>
                {{ loading ? 'PROCESSING...' : buttonProcess }}
            </button>
        </div>

        <div v-show="errorMessage"
            class="absolute w-[25.5rem] h-[30.5rem] top-80 bg-white z-10 flex items-center justify-center p-5">
            <p class="text-red-500 ">{{ errorMessage }}</p>
            <span
                class="absolute flex items-center justify-center bg-red-500 rounded-full cursor-pointer top-5 right-5 h-7 w-7 hover:bg-red-600"
                @click="resetError">
                <font-awesome-icon :icon="faTimes" class="text-white" />
            </span>
        </div>
    </form>
</template>
<style scoped>
/* Add your styles here */
#card-number-element>div,
#card-expiry-element div,
#card-cvc-element>div {
    background-color: transparent;
    border: none;
    outline: none;
    width: 100% !important;
    padding: 0 10px;
    color: #000 !important;
}

input {
    background: none;
    border: none;
    outline: none;
}

input:focus {
    outline: none;
    border: none;
}
</style>
