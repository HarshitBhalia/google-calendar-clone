import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { login, register, fetchMe } from '../api/eventsApi';
import { useCalendarStore } from '../store/calendarStore';
import toast from 'react-hot-toast';

export function useLogin() {
  const setAuth = useCalendarStore((s) => s.setAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      login(email, password),
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success(`Welcome back, ${data.user.name}!`);
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(message);
    },
  });
}

export function useRegister() {
  const setAuth = useCalendarStore((s) => s.setAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password, name }: { email: string; password: string; name: string }) =>
      register(email, password, name),
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success(`Welcome, ${data.user.name}!`);
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
    },
  });
}

export function useCurrentUser() {
  const token = useCalendarStore((s) => s.token);

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: fetchMe,
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useLogout() {
  const clearAuth = useCalendarStore((s) => s.clearAuth);
  const queryClient = useQueryClient();

  return () => {
    clearAuth();
    queryClient.clear();
    toast.success('Logged out successfully');
  };
}
