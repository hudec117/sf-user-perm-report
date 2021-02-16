import App from './App.vue';
import Vue from 'vue';

import { BootstrapVue, IconsPlugin } from 'bootstrap-vue';

import 'bootswatch/dist/darkly/bootstrap.min.css';
import 'bootstrap-vue/dist/bootstrap-vue.css'

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

new Vue({
    el: '#app',
    render: createElement => createElement(App)
});