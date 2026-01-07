export type Priority = 'alta' | 'media' | 'baja';
// Status is now dynamic, so we use string IDs, but keep these for legacy/defaults if needed
export type LegacyStatus = 'pendiente' | 'en_progreso' | 'completada';

export type TaskType = 'normal' | 'call' | 'shopping' | 'music' | 'payment' | 'email' | 'location' | 'event';

export type EntityType = 'task' | 'note' | 'contact' | 'file';

export interface TaskStatus {
  id: string;
  name: string;
  color: string; // Tailwind color class e.g. 'bg-blue-500'
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

export interface Tab {
  id: string;
  label: string;
  type: 'view' | 'entity' | 'project' | 'note' | 'task' | 'contact';
  data: any; // Context data (e.g., view ID, entity object or ID)
  path: string; // Identifier for navigation restoration (e.g. 'tasks', 'project:123')
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

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  description: string;
}

export interface Habit {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly';
  streak: number;
  completedDays: string[];
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

export interface ChatSession {
  id: string;
  title: string; // e.g., "Conversation about Marketing" (or first message summary)
  messages: ChatMessage[];
  lastActive: number;
}

// Firestore Entity Wrappers
export interface FirestoreTask extends Task, BaseEntity { }
export interface FirestoreNote extends Note, BaseEntity { }
export interface FirestoreProject extends Project, BaseEntity { }
export interface FirestoreContact extends Contact, BaseEntity { }
export interface FirestoreFile extends FileItem, BaseEntity { }
export interface FirestoreView extends CustomView, BaseEntity { }
export interface FirestoreStatus extends TaskStatus, BaseEntity { }

export interface Subscription {
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

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  category: string;
  frequency: string;
  payDay?: number;
}