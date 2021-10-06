import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/login',
      name: 'login-page',
      component: () => import(/* webpackChunkName: "main-widget" */ '@/components/LoginPage.vue')
    },
    {
      path: '/onboarding',
      name: 'onboarding-page',
      component: () => import(/* webpackChunkName: "main-widget" */ '@/components/OnBoarding/OnBoarding')
    },
    {
      path: '/config',
      name: 'config-page',
      component: () => import(/* webpackChunkName: "main-widget" */ '@/components/ConfigPage')
    },
    {
      path: '/xcloud',
      name: 'xcloud-page',
      component: () => import(/* webpackChunkName: "main-widget" */ '@/components/XCloudPage')
    },
    {
      path: '/',
      name: 'landing-page',
      component: () => import(/* webpackChunkName: "main-widget" */ '@/components/LandingPage')
    },
    {
      path: '/settings',
      name: 'settings-page',
      component: () => import(/* webpackChunkName: "settings-widget" */ '@/components/SettingsPage')
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
