'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, json } from '@/lib/api';
import type { ProjectDetail, ProjectMember, ProjectRole, ProjectSummary } from '@/lib/types';

export const projectKeys = {
  all: ['projects'] as const,
  detail: (id: string) => ['projects', id] as const,
};

export function useProjects() {
  return useQuery({ queryKey: projectKeys.all, queryFn: () => api<ProjectSummary[]>('/projects') });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      api<ProjectSummary>('/projects', { method: 'POST', body: json(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
  });
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: () => api<ProjectDetail>(`/projects/${projectId}`),
  });
}

export function useAddMember(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { email: string; role: Exclude<ProjectRole, 'OWNER'> }) =>
      api<ProjectMember>(`/projects/${projectId}/members`, { method: 'POST', body: json(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) }),
  });
}

export function useRemoveMember(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api(`/projects/${projectId}/members/${userId}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      qc.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });
}
