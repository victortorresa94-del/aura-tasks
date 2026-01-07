import { Task, Note, Project, Contact, CustomView, TaskStatus, FileItem } from '../types';

export interface BaseEntity {
    id: string;
    ownerId: string;
    createdAt: number;
    updatedAt: number;
    deletedAt?: number | null; // Soft delete support
}

export type FirestoreTask = Task & BaseEntity;
export type FirestoreNote = Note & BaseEntity;
export type FirestoreProject = Project & BaseEntity;
export type FirestoreContact = Contact & BaseEntity;
export type FirestoreView = CustomView & BaseEntity;
export type FirestoreStatus = TaskStatus & BaseEntity;
export type FirestoreFile = FileItem & BaseEntity;

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    photoURL: string;
    migratedAt?: number; // Flag to check if local data was migrated
    settings?: {
        theme?: 'light' | 'dark';
        language?: string;
    };
    createdAt: number;
    lastLogin: number;
}
