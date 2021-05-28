import Vue from 'vue'
import axios from 'axios'
import App from './App'
import router from './router'
import store from './store'
import dotenv from 'dotenv'
// import '../index.css'
import '../../scss/internxt-design-system.scss'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'jquery/dist/jquery.min.js'
import 'bootstrap/dist/js/bootstrap.min.js'

dotenv.config()

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>'
}).$mount('#app')
