
const routes = [
  {
    path: '/',
    component: () => import('layouts/MyLayout.vue'),
    children: [
      // { path: 'bar', component: () => import('pages/BarChart.vue') },
      // { path: 'table', component: () => import('pages/TableChart.vue') },
      // { path: 'test', component: () => import('pages/Test.vue') },
      { path: 'bartest', component: () => import('pages/BarChartTest.vue') },
      { path: 'tabletest', component: () => import('pages/TableChartTest.vue') }
    ]
  }
]

// Always leave this as last one
if (process.env.MODE !== 'ssr') {
  routes.push({
    path: '*',
    component: () => import('pages/Error404.vue')
  })
}

export default routes
