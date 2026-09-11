// In plugins/fontawesome.js (ensure this file is correctly imported in your nuxt.config.js)

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

export default defineNuxtPlugin(nuxtApp => {
    nuxtApp.vueApp.component('FontAwesomeIcon', FontAwesomeIcon)
})
