import { BaseRepository } from './base';
import { FirestoreTask, FirestoreNote, FirestoreProject, FirestoreContact, FirestoreFile, FirestoreView, FirestoreStatus } from '../types';

export const tasksRepo = new BaseRepository<FirestoreTask>('tasks');
export const notesRepo = new BaseRepository<FirestoreNote>('notes');
export const projectsRepo = new BaseRepository<FirestoreProject>('projects');
export const contactsRepo = new BaseRepository<FirestoreContact>('contacts');
export const filesRepo = new BaseRepository<FirestoreFile>('files');
export const customViewsRepo = new BaseRepository<FirestoreView>('views');
export const statusesRepo = new BaseRepository<FirestoreStatus>('statuses');
