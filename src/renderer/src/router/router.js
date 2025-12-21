import { createMemoryHistory, createRouter } from 'vue-router'

const routes = [
  { path: '/', redirect: '/manuscript-management' },
  { path: '/login', component: () => import('../views/Login.vue') },
  { path: '/manuscript-management', component: () => import('../views/ManuscriptManagement.vue') },
  { path: '/popular-events', component: () => import('../views/PopularEvents.vue') },
  { path: '/earnings-center', component: () => import('../views/EarningsCenter.vue') },
  { path: '/update-database', component: () => import('../views/UpdateDatabase.vue') },
  {
    path: '/cancel-event-qualification',
    component: () => import('../views/CancelEventQualification.vue')
  },
  { path: '/view-less-one-hundred', component: () => import('../views/ViewLessOneHundred.vue') },
  { path: '/get-money-by-year', component: () => import('../views/GetMoneyByYear.vue') },
  { path: '/get-money-by-month', component: () => import('../views/GetMoneyByMonth.vue') },
  { path: '/get-money-by-tag', component: () => import('../views/GetMoneyByTag.vue') },
  { path: '/get-manuscript-by-tag', component: () => import('../views/GetManuscriptByTag.vue') },
  {
    path: '/get-disqualified-by-tag',
    component: () => import('../views/GetDisqualifiedByTag.vue')
  },
  { path: '/get-salary-by-month', component: () => import('../views/GetSalaryByMonth.vue') },
  { path: '/get-salary-by-year', component: () => import('../views/GetSalaryByYear.vue') },
  { path: '/get-withdraw-by-month', component: () => import('../views/GetWithdrawByMonth.vue') },
  { path: '/get-withdraw-by-year', component: () => import('../views/GetWithdrawByYear.vue') }
]

const router = createRouter({
  history: createMemoryHistory(),
  routes
})

export default router
