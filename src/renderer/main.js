import Vue from 'vue'
import axios from 'axios'
import App from './App'
import router from './router'
import store from './store'
import dotenv from 'dotenv'
import VueContentPlaceholders from 'vue-content-placeholders'

// import '../index.css'
import 'bootstrap/dist/css/bootstrap-grid.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'jquery/dist/jquery.min.js'
import 'bootstrap/dist/js/bootstrap.min.js'
import './assets/tailwind/tailwind_cdn.min'
import '../index.scss'
import '../../scss/internxt-design-system.scss'
import './assets/scss/fonts.scss'

dotenv.config()

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false

Vue.use(VueContentPlaceholders)

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>'
}).$mount('#app')
