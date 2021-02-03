import 'bootswatch/dist/cosmo/bootstrap.min.css';

import App from './src/App.vue';
import Vue from 'vue';

new Vue({
    el: '#app',
    render: createElement => createElement(App)
});