import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export function useQueryText(key: string, fallback = '') {
  const route = useRoute();
  const router = useRouter();
  return computed({
    get: () =>
      typeof route.query[key] === 'string'
        ? (route.query[key] as string)
        : fallback,
    set: (value: string) => {
      void router.replace({
        query: {
          ...route.query,
          [key]: value === fallback ? undefined : value,
        },
      });
    },
  });
}
