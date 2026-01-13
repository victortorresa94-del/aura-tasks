export type Priority = 'alta' | 'media' | 'baja';
// Status is now dynamic, so we use string IDs, but keep these for legacy/defaults if needed
export type LegacyStatus = 'pendiente' | 'en_progreso' | 'completada';

export type TaskType = 'normal' | 'call' | 'shopping' | 'music' | 'payment' | 'email' | 'location' | 'event';

export type EntityType = 'task' | 'note' | 'contact' | 'file';

export interface TaskStatus extends BaseEntity {
  id: string;
  name: string;
  color: string;
  isCompleted?: boolean;
}

export interface LinkedItem {
  id: string;
  type: EntityType;
  title: string;
  subtitle?: string;
}

export interface FileItem extends BaseEntity {
  id: string;
  parentId: string | null;
  name: string;
  type: 'image' | 'pdf' | 'doc' | 'folder' | 'drive' | 'sheet' | 'slide' | 'video';
  source: 'local' | 'google_drive';
  size?: string;
  url?: string;
  thumbnail?: string;
  links?: LinkedItem[];
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface BaseEntity {
  id: string;
  ownerId: string;
  createdAt: number;
  updatedAt: number;
}

export interface Task extends BaseEntity {
  title: string;
  priority: Priority;
  date: string;
  status: string; // Changed from enum to string (Status ID)
  type: TaskType;
  listId: string;
  projectId?: string; // Linked Project
  notes?: string;
  noteId?: string;
  tags: string[];
  links?: LinkedItem[];
  contactName?: string;
  phoneNumber?: string;
  // Event-specific fields
  description?: string;
  isAllDay?: boolean;
  startTime?: string;
  endTime?: string;
  locationName?: string;
  eventDate?: string;
  url?: string;
  spotifyUrl?: string;
  amount?: number;
  currency?: string;
  isRecurring?: boolean;
  frequency?: string;
  subtasks?: SubTask[];
  customValues?: Record<string, any>;
}

export interface SubTask {
  id: string;
  title: string;
  isCompleted: boolean;
}



export type ViewLayout = 'list' | 'compact' | 'kanban' | 'grid';
export type GroupBy = 'none' | 'status' | 'priority' | 'project';
export type SortBy = 'date' | 'priority' | 'title';

export interface CustomView extends BaseEntity {
  id: string;
  name: string;
  icon: string;
  layout: ViewLayout;
  groupBy: GroupBy;
  sortBy?: SortBy;    // Added sort preference
  filters: {
    projectIds?: string[];
    priority?: Priority[];
    status?: string[];     // Array of Status IDs
    tags?: string[];
  };
  visibleColumns?: string[];
}

export type BlockType = 'text' | 'h1' | 'h2' | 'h3' | 'bullet' | 'number' | 'checkbox' | 'toggle' | 'image' | 'divider' | 'quote' | 'callout';

export interface NoteBlock {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
  isOpen?: boolean;
  children?: NoteBlock[];
  props?: Record<string, any>;
}

// ... (NoteBlock ends above)

export interface ChatMessage {
  id: string;
  role: 'user' | 'aura';
  text: string;
  timestamp: number;
  attachments?: ChatAttachment[];
}

export interface ChatAttachment {
  id: string;
  type: 'image' | 'document';
  name: string;
  size: number;
  mimeType: string;
  data: string; // base64-encoded data
  extractedText?: string; // for documents (PDF, Word, Excel)
}

export interface Tab extends BaseEntity {
  id: string;
  label: string;
  type: 'view' | 'entity' | 'project' | 'note' | 'task' | 'contact';
  data: any;
  path: string;
  color?: string;
  isPinned?: boolean;
}

// Extended Project Interface
export interface Project extends BaseEntity {
  id: string; // BaseEntity has id, but keeping for clarity or just remove
  name: string;
  icon: string;
  color: string;
  description?: string;
  isFavorite?: boolean;
}

export interface Note extends BaseEntity {
  id: string;
  parentId?: string | null;
  projectId?: string; // Linked Project
  title: string;
  content: string;
  blocks: NoteBlock[];
  coverImage?: string;
  icon?: string;
  expanded?: boolean;
  links?: LinkedItem[];
}

export interface Contact extends BaseEntity {
  id: string;
  name: string;
  projectId?: string; // Linked Project
  role?: string;
  company?: string;
  email: string;
  phone: string;
  avatar?: string;
  linkedin?: string;
  location?: string;
  tags: string[];
  notes: string;
  links?: LinkedItem[];
  lastContact?: number;
}

export interface Transaction extends BaseEntity {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  description: string;
}

export type HabitContext = 'mañana' | 'tarde' | 'noche' | 'cuerpo' | 'mente' | 'trabajo' | 'otro';

export interface Habit extends BaseEntity {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly';
  streak: number;
  completedDays: string[];
  // Extended fields
  intention?: string;
  rhythm?: string;
  context: HabitContext;
  emoji?: string;
  status: 'active' | 'archived';
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  completedTasks: number;
  onboardingCompleted?: boolean;
}

export interface Email {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
  isRead: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
  isAllDay: boolean;
}

export interface ChatSession extends BaseEntity {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastActive: number;
}

// Firestore Entity Wrappers
export interface FirestoreTask extends Task { }
export interface FirestoreNote extends Note { }
export interface FirestoreProject extends Project { }
export interface FirestoreContact extends Contact { }
export interface FirestoreFile extends FileItem { }
export interface FirestoreView extends CustomView { }
export interface FirestoreStatus extends TaskStatus { }
export interface FirestoreTab extends Tab { }
export interface FirestoreTransaction extends Transaction { }
export interface FirestoreHabit extends Habit { }
export interface FirestoreChatSession extends ChatSession { }
export interface FirestoreSubscription extends Subscription { }
export interface FirestoreRecurringExpense extends RecurringExpense { }

export interface Subscription extends BaseEntity {
  id: string;
  name: string;
  amount: number;
  currency: string;
  frequency: 'monthly' | 'yearly';
  nextPaymentDate: string;
  category: string;
  status: 'active' | 'cancelled';
  logo?: string;
}

export interface RecurringExpense extends BaseEntity {
  id: string;
  name: string;
  amount: number;
  category: string;
  frequency: string;
  payDay?: number;
}

// --- ROUTINES ---

export type RoutineStepType = 'action' | 'break' | 'reflection';

export interface RoutineStep {
  id: string;
  name: string;
  type: RoutineStepType;
  durationMinutes?: number;
  description?: string;
  imageUrl?: string;
}

export interface Routine extends BaseEntity {
  id: string;
  // userId handled by BaseEntity ownerId
  name: string;
  context: HabitContext;
  emoji?: string;
  description?: string;
  steps: RoutineStep[];
  estimatedDurationMinutes: number;
  linkedHabitId?: string;
}

export interface RoutineSession extends BaseEntity {
  id: string;
  // userId handled by BaseEntity ownerId
  routineId: string;
  routineName: string;
  status: 'started' | 'completed' | 'partial' | 'abandoned';
  startedAt: number;
  endedAt?: number;
  completedSteps: string[];
  notes?: string;
}

export interface HabitLog extends BaseEntity {
  // id, ownerId, createdAt, updatedAt from BaseEntity
  habitId: string;
  completedAt: number;
  note?: string;
}

export interface FirestoreRoutine extends Routine { }
export interface FirestoreRoutine extends Routine { }
export interface FirestoreRoutineSession extends RoutineSession { }
export interface FirestoreHabitLog extends HabitLog { }