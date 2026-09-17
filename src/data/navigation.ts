import type { SubpageConfig, TodoSectionId } from '../types';

export const SUBPAGES: SubpageConfig[] = [
  {
    id: 'home',
    label: 'Home',
    description: 'Executive overview, daily nexus, and personal cognitive dashboard.',
    iconName: 'LayoutDashboard'
  },
  {
    id: 'calendar',
    label: 'Calendar',
    description: 'Time architecture, schedule alignment, and chronological planning.',
    iconName: 'Calendar'
  },
  {
    id: 'reminisce',
    label: 'Reminisce',
    description: 'Archive of personal memories, milestones, reflections, and life experiences.',
    iconName: 'Compass'
  },
  {
    id: 'quotes',
    label: 'Quotes',
    description: 'Curated wisdom, philosophy, spark thoughts, and inspirational maxims.',
    iconName: 'Quote'
  },
  {
    id: 'notes',
    label: 'Notes',
    description: 'Knowledge capture, distilled insights, and interconnected thoughts.',
    iconName: 'BookOpen'
  },
  {
    id: 'habits',
    label: 'Habit Tracker',
    description: 'Daily disciplines, consistency streaks, and behavioral optimization.',
    iconName: 'Activity'
  },
  {
    id: 'finances',
    label: 'Finance Tracker',
    description: 'Capital flow, wealth metrics, resource allocation, and expense tracking.',
    iconName: 'Coins'
  },
  {
    id: 'todo',
    label: 'To-do',
    description: 'Actionable execution center categorized across Tasks, Events, and Goals.',
    iconName: 'CheckSquare'
  }
];

export const TODO_SECTIONS: { id: TodoSectionId; label: string; description: string; iconName: string }[] = [
  {
    id: 'task',
    label: 'Tasks',
    description: 'Actionable items, daily to-dos, and prioritized micro-deliverables.',
    iconName: 'CheckCircle2'
  },
  {
    id: 'event',
    label: 'Events',
    description: 'Fixed-time engagements, appointments, milestones, and gatherings.',
    iconName: 'Clock'
  },
  {
    id: 'goal',
    label: 'Goals',
    description: 'Quarterly and annual objectives, strategic milestones, and vision targets.',
    iconName: 'Target'
  }
];
