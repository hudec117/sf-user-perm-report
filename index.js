import App from './src/App.vue';
import Vue from 'vue';

import { BootstrapVue } from 'bootstrap-vue';

import 'bootswatch/dist/cosmo/bootstrap.min.css';
import 'bootstrap-vue/dist/bootstrap-vue.css'

Vue.use(BootstrapVue);

new Vue({
    el: '#app',
    render: createElement => createElement(App)
});