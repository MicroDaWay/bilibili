import { createMemoryHistory, createRouter } from 'vue-router'

const routes = [
  { path: '/', redirect: '/manuscript-management' },
  { path: '/login', component: () => import('../views/Login.vue') },
  { path: '/manuscript-management', component: () => import('../views/ManuscriptManagement.vue') },
  { path: '/check-in-challenge', component: () => import('../views/CheckInChallenge.vue') },
  { path: '/popular-events', component: () => import('../views/PopularEvents.vue') },
  { path: '/earnings-center', component: () => import('../views/EarningsCenter.vue') },
  { path: '/update-database', component: () => import('../views/UpdateDatabase.vue') },
  {
    path: '/cancel-event-qualification',
    component: () => import('../views/CancelEventQualification.vue')
  },
  { path: '/view-less-one-hundred', component: () => import('../views/ViewLessOneHundred.vue') }
]

const router = createRouter({
  history: createMemoryHistory(),
  routes
})

export default router
