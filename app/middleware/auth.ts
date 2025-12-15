export default defineNuxtRouteMiddleware((to, from) => {
  // التحقق من وجود بيانات المستخدم
  if (to.path !== "/") {
    const userRole = localStorage.getItem("userRole");
    const userName = localStorage.getItem("userName");

    if (!userRole || !userName) {
      return navigateTo("/");
    }
  }
});
