import { createRouter, createWebHistory } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import HomeView from '@/views/HomeView.vue'
import ConfiguracoesView from '@/views/ConfiguracoesView.vue'
import ContainersView from '@/views/ContainersView.vue'
import AppsView from '@/views/AppsView.vue'
import AppDetailView from '@/views/AppDetailView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: DefaultLayout,
      children: [
        { path: '', component: HomeView },
        { path: 'configuracoes', component: ConfiguracoesView },
        { path: 'containers', component: ContainersView },
        { path: 'apps', component: AppsView },
        { path: 'apps/:name', component: AppDetailView },
      ],
    },
  ],
})

export default router
