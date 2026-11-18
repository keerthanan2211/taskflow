export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type ProjectRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  updatedAt: string;
  role: ProjectRole;
  _count: { tasks: number; members: number };
}

export interface ProjectMember {
  projectId: string;
  userId: string;
  role: ProjectRole;
  user: User;
}

export interface ProjectDetail {
  id: string;
  name: string;
  description: string | null;
  role: ProjectRole;
  members: ProjectMember[];
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  position: number;
  dueDate: string | null;
  assigneeId: string | null;
  createdById: string;
  assignee: User | null;
  _count: { comments: number };
}

export interface Comment {
  id: string;
  taskId: string;
  body: string;
  createdAt: string;
  author: User;
}

export const STATUSES: { id: TaskStatus; label: string }[] = [
  { id: 'TODO', label: 'To do' },
  { id: 'IN_PROGRESS', label: 'In progress' },
  { id: 'IN_REVIEW', label: 'In review' },
  { id: 'DONE', label: 'Done' },
];

export const PRIORITIES: { id: TaskPriority; label: string }[] = [
  { id: 'LOW', label: 'Low' },
  { id: 'MEDIUM', label: 'Medium' },
  { id: 'HIGH', label: 'High' },
  { id: 'URGENT', label: 'Urgent' },
];
