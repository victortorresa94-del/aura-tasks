
import React from 'react';
import {
    Type, Calendar, CheckCircle, Flag, Link, Paperclip,
    Clock, User, Tag, FileText, CheckSquare, PieChart
} from 'lucide-react';
import { Task, Priority } from '../types';

export interface ColumnDef {
    id: string;
    label: string;
    icon: React.ReactNode;
    type: 'text' | 'date' | 'select' | 'status' | 'priority' | 'user' | 'number' | 'link' | 'tags' | 'percentage';
    minWidth: number;
    fixed?: boolean; // If true, cannot be removed (e.g. Title)
}

export const AVAILABLE_COLUMNS: ColumnDef[] = [
    { id: 'title', label: 'Nombre', icon: <Type size={16} />, type: 'text', minWidth: 200, fixed: true },
    { id: 'status', label: 'Estado', icon: <CheckCircle size={16} />, type: 'status', minWidth: 120 },
    { id: 'priority', label: 'Prioridad', icon: <Flag size={16} />, type: 'priority', minWidth: 100 },
    { id: 'date', label: 'Fecha Límite', icon: <Calendar size={16} />, type: 'date', minWidth: 120 },
    { id: 'startDate', label: 'Fecha Inicio', icon: <Calendar size={16} className="text-gray-400" />, type: 'date', minWidth: 120 },
    { id: 'tags', label: 'Etiquetas', icon: <Tag size={16} />, type: 'tags', minWidth: 150 },
    { id: 'link', label: 'Enlace', icon: <Link size={16} />, type: 'link', minWidth: 150 },
    { id: 'timeEstimate', label: 'Estimación', icon: <Clock size={16} />, type: 'text', minWidth: 100 },
    { id: 'assignee', label: 'Asignado', icon: <User size={16} />, type: 'user', minWidth: 120 },
    { id: 'notes', label: 'Notas', icon: <FileText size={16} />, type: 'text', minWidth: 200 },
    { id: 'attachments', label: 'Adjuntos', icon: <Paperclip size={16} />, type: 'text', minWidth: 100 },
    { id: 'progress', label: 'Progreso', icon: <PieChart size={16} />, type: 'percentage', minWidth: 100 },
    { id: 'custom_checkbox', label: 'Revisado', icon: <CheckSquare size={16} />, type: 'select', minWidth: 80 }
];

export const DEFAULT_VISIBLE_COLUMNS = ['title', 'status', 'priority', 'date'];

export const getColumnDef = (id: string) => AVAILABLE_COLUMNS.find(c => c.id === id);
