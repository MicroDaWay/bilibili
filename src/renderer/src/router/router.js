import { createMemoryHistory, createRouter } from 'vue-router'

const routes = [
  { path: '/', redirect: '/manuscript-management' },
  { path: '/login', component: () => import('@/views/Login.vue') },
  { path: '/manuscript-management', component: () => import('@/views/ManuscriptManagement.vue') },
  { path: '/popular-events', component: () => import('@/views/PopularEvents.vue') },
  { path: '/earnings-center', component: () => import('@/views/EarningsCenter.vue') },
  { path: '/update-database', component: () => import('@/views/UpdateDatabase.vue') },
  {
    path: '/event-disqualification',
    component: () => import('@/views/EventDisqualification.vue')
  },
  { path: '/view-less-one-hundred', component: () => import('@/views/ViewLessOneHundred.vue') },
  { path: '/get-rewards-by-year', component: () => import('@/views/GetRewardsByYear.vue') },
  { path: '/get-rewards-by-month', component: () => import('@/views/GetRewardsByMonth.vue') },
  { path: '/get-rewards-by-tag', component: () => import('@/views/GetRewardsByTag.vue') },
  { path: '/get-manuscript-by-tag', component: () => import('@/views/GetManuscriptByTag.vue') },
  {
    path: '/get-disqualification-by-tag',
    component: () => import('@/views/GetDisqualificationByTag.vue')
  },
  { path: '/get-salary-by-month', component: () => import('@/views/GetSalaryByMonth.vue') },
  { path: '/get-salary-by-year', component: () => import('@/views/GetSalaryByYear.vue') },
  { path: '/get-withdraw-by-month', component: () => import('@/views/GetWithdrawByMonth.vue') },
  { path: '/get-withdraw-by-year', component: () => import('@/views/GetWithdrawByYear.vue') },
  { path: '/get-income-by-month', component: () => import('@/views/GetIncomeByMonth.vue') },
  { path: '/get-income-by-year', component: () => import('@/views/GetIncomeByYear.vue') },
  { path: '/get-outcome-details', component: () => import('@/views/GetOutcomeDetails.vue') },
  { path: '/get-outcome-by-month', component: () => import('@/views/GetOutcomeByMonth.vue') },
  { path: '/get-outcome-by-year', component: () => import('@/views/GetOutcomeByYear.vue') }
]

const router = createRouter({
  history: createMemoryHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  // 如果目标是登录页, 直接放行
  if (to.path === '/login') {
    return next()
  }

  // 检查是否登录
  let isLogin = false
  isLogin = await window.electronAPI.checkLoginStatus()

  if (!isLogin) {
    // 未登录且不是去登录页, 跳转到登录页
    next('/login')
  } else {
    // 已登录, 正常访问
    next()
  }
})

export default router
