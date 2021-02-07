import App from './src/App.vue';
import Vue from 'vue';
import VueDebounce from 'vue-debounce';

import { BootstrapVue, IconsPlugin } from 'bootstrap-vue';

import 'bootswatch/dist/cosmo/bootstrap.min.css';
import 'bootstrap-vue/dist/bootstrap-vue.css'

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);
Vue.use(VueDebounce);

new Vue({
    el: '#app',
    render: createElement => createElement(App)
});