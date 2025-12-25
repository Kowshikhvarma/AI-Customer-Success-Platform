
import { Client, OnboardingStatus, Task, TaskStatus } from './types';

export const INITIAL_CLIENTS: Client[] = [
  {
    id: '1',
    name: 'Sarah Connor',
    email: 'sarah.c@techmail.com',
    phone: '555-0101',
    planType: 'Premium',
    status: OnboardingStatus.IN_PROGRESS,
    createdAt: '2024-05-10'
  },
  {
    id: '2',
    name: 'John Miller',
    email: 'john.miller@devcorp.com',
    phone: '555-0102',
    planType: 'Basic',
    status: OnboardingStatus.COMPLETED,
    createdAt: '2024-05-12'
  },
  {
    id: '3',
    name: 'Elena Rodriguez',
    email: 'elena.r@agency.net',
    phone: '555-0103',
    planType: 'Enterprise',
    status: OnboardingStatus.PENDING,
    createdAt: '2024-05-15'
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    clientId: '1',
    title: 'Review Initial Resume',
    type: 'Review',
    status: TaskStatus.DONE,
    assignedTo: 'Alex Chen',
    dueDate: '2024-05-18'
  },
  {
    id: 't2',
    clientId: '1',
    title: 'Apply ATS Optimization',
    type: 'Editing',
    status: TaskStatus.IN_PROGRESS,
    assignedTo: 'Alex Chen',
    dueDate: '2024-05-20'
  },
  {
    id: 't3',
    clientId: '2',
    title: 'Final Delivery Prep',
    type: 'Ops',
    status: TaskStatus.TODO,
    assignedTo: 'Sarah Lee',
    dueDate: '2024-05-22'
  }
];
