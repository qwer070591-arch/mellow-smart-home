import { createRouter, createWebHistory } from "vue-router";
import SchedulesView from '../views/SchedulesView.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: 'home', component: () => import("../views/OverviewView.vue") },
    { path: '/lighting', name: 'lighting', component: () => import('../views/LightingView.vue') },
    { path: '/music', name: 'music', component: () => import('../views/MusicView.vue') },
    { path: '/climate', name: 'climate', component: () => import('../views/ClimateView.vue') },
    { path: '/security', name: 'security', component: () => import('../views/SecurityView.vue') },
    { path: '/notifications', name: 'notifications', component: () => import('../views/NotificationsView.vue') },
    { path: '/schedules', name: 'schedules', component: SchedulesView },
    { path: '/settings', name: 'settings', component: () => import('../views/SettingsView.vue') },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});
