import { createRouter, createWebHistory } from 'vue-router';

const LandingView = () => import('@/views/LandingView.vue');

const router = createRouter({
    history: createWebHistory(),
    linkActiveClass: "active-router-link",
    linkExactActiveClass: "active-exact-router-link",
    routes: [
        { path: "/", component: LandingView, props: true },
        { path: "/:pathMatch(.*)", redirect: "/" },
    ]
});

export default router;
