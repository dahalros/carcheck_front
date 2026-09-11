import { useCarRegistrationSearchStore } from '@/stores/carRegistrationSearch';

export default defineNuxtRouteMiddleware(async () => {
  if (!import.meta.client) return;

  const carRegistrationSearchStore = useCarRegistrationSearchStore();

  if (!carRegistrationSearchStore.reg_number || !localStorage.getItem('reg_number')) {
    return navigateTo({ path: '/', query: { message: 'Please enter Car registration number' } });
  }

  await carRegistrationSearchStore.hydrateFromStorage();
});
