'use client';
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { ResumeData } from './types';
import { createDefaultData, initVisibility, normalizeResumeData } from './defaults';
import { nanoid } from 'nanoid';

interface SavedResume {
  id: string;
  name: string;
  templateId: string;
  updatedAt: string;
  data: ResumeData;
}

interface StoreState {
  resumes: SavedResume[];
  currentId: string;
  data: ResumeData;
  activeModule: string;
  view: 'home' | 'dashboard' | 'editor';
  zoom: number;
  saved: boolean;
  darkMode: boolean;
}

type StoreAction =
  | { type: 'SET_DARK_MODE'; value: boolean }
  | { type: 'LOAD_RESUMES' }
  | { type: 'NEW_RESUME' }
  | { type: 'SELECT_RESUME'; id: string }
  | { type: 'DELETE_RESUME'; id: string }
  | { type: 'DUPLICATE_RESUME'; id: string }
  | { type: 'RENAME_RESUME'; id: string; name: string }
  | { type: 'IMPORT_RESUME'; data: ResumeData }
  | { type: 'SET_VIEW'; view: 'home' | 'dashboard' | 'editor' }
  | { type: 'UPDATE_MODULE'; moduleId: string; value: any }
  | { type: 'SET_TEMPLATE'; templateId: string }
  | { type: 'SET_THEME_COLOR'; color: string }
  | { type: 'SET_FONT'; font: string }
  | { type: 'SET_MARGIN'; value: string }
  | { type: 'SET_SPACING'; value: string }
  | { type: 'SET_LINE_HEIGHT'; value: string }
  | { type: 'TOGGLE_COMPRESS'; value: boolean }
  | { type: 'SET_ACTIVE_MODULE'; id: string }
  | { type: 'TOGGLE_MODULE_VISIBILITY'; id: string }
  | { type: 'SET_MODULE_TITLE'; id: string; title: string }
  | { type: 'MOVE_MODULE'; from: number; to: number }
  | { type: 'SET_ZOOM'; zoom: number }
  | { type: 'RESET' };

function saveResumesToStorage(resumes: SavedResume[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('resume_jade_list', JSON.stringify(resumes));
  }
}

function loadResumesFromStorage(): SavedResume[] {
  if (typeof window === 'undefined') return [];
  try {
    const s = localStorage.getItem('resume_jade_list');
    const resumes: SavedResume[] = s ? JSON.parse(s) : [];
    return resumes.map(r => ({ ...r, data: normalizeResumeData(r.data) }));
  } catch { return []; }
}

function reducer(state: StoreState, action: StoreAction): StoreState {
  switch (action.type) {
    case 'SET_DARK_MODE': {
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', action.value);
        localStorage.setItem('resume_jade_dark', action.value ? '1' : '0');
      }
      return { ...state, darkMode: action.value };
    }
    case 'LOAD_RESUMES': {
      const resumes = loadResumesFromStorage();
      if (resumes.length === 0) {
        const d = createDefaultData(); initVisibility(d);
        const newResume: SavedResume = { id: nanoid(8), name: '我的简历', templateId: 'simple', updatedAt: new Date().toISOString(), data: d };
        saveResumesToStorage([newResume]);
        return { ...state, resumes: [newResume], currentId: newResume.id, data: d };
      }
      saveResumesToStorage(resumes);
      return { ...state, resumes, currentId: resumes[0].id, data: resumes[0].data };
    }
    case 'NEW_RESUME': {
      const d = createDefaultData(); initVisibility(d);
      const newResume: SavedResume = { id: nanoid(8), name: '新建简历', templateId: 'simple', updatedAt: new Date().toISOString(), data: d };
      const resumes = [newResume, ...state.resumes];
      saveResumesToStorage(resumes);
      return { ...state, resumes, currentId: newResume.id, data: d, view: 'editor', activeModule: 'basicInfo' };
    }
    case 'SELECT_RESUME': {
      const r = state.resumes.find(x => x.id === action.id);
      if (!r) return state;
      const data = normalizeResumeData(r.data);
      return { ...state, currentId: action.id, data, view: 'editor', activeModule: 'basicInfo' };
    }
    case 'DELETE_RESUME': {
      const resumes = state.resumes.filter(r => r.id !== action.id);
      saveResumesToStorage(resumes);
      if (state.currentId === action.id && resumes.length > 0) {
        return { ...state, resumes, currentId: resumes[0].id, data: resumes[0].data, view: 'dashboard' };
      }
      return { ...state, resumes, view: resumes.length === 0 ? 'home' : 'dashboard' };
    }
    case 'DUPLICATE_RESUME': {
      const src = state.resumes.find(r => r.id === action.id);
      if (!src) return state;
      const d = JSON.parse(JSON.stringify(src.data));
      const newResume: SavedResume = { id: nanoid(8), name: src.name + ' (副本)', templateId: src.templateId, updatedAt: new Date().toISOString(), data: d };
      const resumes = [newResume, ...state.resumes];
      saveResumesToStorage(resumes);
      return { ...state, resumes, currentId: newResume.id, data: d, view: 'editor' };
    }
    case 'RENAME_RESUME': {
      const resumes = state.resumes.map(r => r.id === action.id ? { ...r, name: action.name } : r);
      saveResumesToStorage(resumes);
      return { ...state, resumes };
    }
    case 'IMPORT_RESUME': {
      initVisibility(action.data);
      const newResume: SavedResume = { id: nanoid(8), name: '导入的简历', templateId: action.data.templateId || 'simple', updatedAt: new Date().toISOString(), data: action.data };
      const resumes = [newResume, ...state.resumes];
      saveResumesToStorage(resumes);
      return { ...state, resumes, currentId: newResume.id, data: action.data, view: 'editor' };
    }
    // --- Editor actions ---
    case 'SET_VIEW':
      return { ...state, view: action.view };
    case 'UPDATE_MODULE': {
      const data = { ...state.data, modules: { ...state.data.modules, [action.moduleId]: action.value } };
      const resumes = state.resumes.map(r => r.id === state.currentId ? { ...r, data, updatedAt: new Date().toISOString() } : r);
      saveResumesToStorage(resumes);
      return { ...state, data, resumes, saved: false };
    }
    case 'SET_TEMPLATE': {
      const data = { ...state.data, templateId: action.templateId };
      const resumes = state.resumes.map(r => r.id === state.currentId ? { ...r, data, templateId: action.templateId, updatedAt: new Date().toISOString() } : r);
      saveResumesToStorage(resumes);
      return { ...state, data, resumes, saved: false };
    }
    case 'SET_THEME_COLOR': {
      const data = { ...state.data, themeColor: action.color };
      const resumes = state.resumes.map(r => r.id === state.currentId ? { ...r, data, updatedAt: new Date().toISOString() } : r);
      saveResumesToStorage(resumes);
      return { ...state, data, resumes, saved: false };
    }
    case 'SET_FONT': {
      const data = { ...state.data, fontFamily: action.font };
      const resumes = state.resumes.map(r => r.id === state.currentId ? { ...r, data, updatedAt: new Date().toISOString() } : r);
      saveResumesToStorage(resumes);
      return { ...state, data, resumes, saved: false };
    }
    case 'SET_MARGIN':
    case 'SET_SPACING':
    case 'SET_LINE_HEIGHT':
    case 'TOGGLE_COMPRESS': {
      let data = state.data;
      if (action.type === 'SET_MARGIN') data = { ...data, pageMargin: action.value as any };
      if (action.type === 'SET_SPACING') data = { ...data, moduleSpacing: action.value as any };
      if (action.type === 'SET_LINE_HEIGHT') data = { ...data, lineHeight: action.value as any };
      if (action.type === 'TOGGLE_COMPRESS') data = { ...data, compressOnePage: action.value };
      const resumes = state.resumes.map(r => r.id === state.currentId ? { ...r, data, updatedAt: new Date().toISOString() } : r);
      saveResumesToStorage(resumes);
      return { ...state, data, resumes, saved: false };
    }
    case 'SET_ACTIVE_MODULE':
      return { ...state, activeModule: action.id };
    case 'TOGGLE_MODULE_VISIBILITY': {
      const vis = { ...state.data.moduleVisibility, [action.id]: !state.data.moduleVisibility[action.id] };
      const data = { ...state.data, moduleVisibility: vis };
      const resumes = state.resumes.map(r => r.id === state.currentId ? { ...r, data, updatedAt: new Date().toISOString() } : r);
      saveResumesToStorage(resumes);
      return { ...state, data, resumes, saved: false };
    }
    case 'SET_MODULE_TITLE': {
      const titles = { ...state.data.moduleTitles };
      const title = action.title.trim();
      if (title) titles[action.id] = title;
      else delete titles[action.id];
      const data = { ...state.data, moduleTitles: titles };
      const resumes = state.resumes.map(r => r.id === state.currentId ? { ...r, data, updatedAt: new Date().toISOString() } : r);
      saveResumesToStorage(resumes);
      return { ...state, data, resumes, saved: false };
    }
    case 'MOVE_MODULE': {
      const order = [...state.data.moduleOrder];
      const [moved] = order.splice(action.from, 1);
      order.splice(action.to, 0, moved);
      const data = { ...state.data, moduleOrder: order };
      const resumes = state.resumes.map(r => r.id === state.currentId ? { ...r, data, updatedAt: new Date().toISOString() } : r);
      saveResumesToStorage(resumes);
      return { ...state, data, resumes, saved: false };
    }
    case 'SET_ZOOM':
      return { ...state, zoom: action.zoom };
    case 'RESET': {
      const d = createDefaultData(); initVisibility(d);
      const resumes = state.resumes.map(r => r.id === state.currentId ? { ...r, data: d, updatedAt: new Date().toISOString() } : r);
      saveResumesToStorage(resumes);
      return { ...state, data: d, resumes, activeModule: 'basicInfo', saved: false };
    }
    default:
      return state;
  }
}

const StoreContext = createContext<{ state: StoreState; dispatch: React.Dispatch<StoreAction> } | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    resumes: [], currentId: '', data: createDefaultData(),
    activeModule: 'basicInfo', view: 'home', zoom: 1, saved: true, darkMode: false,
  });

  // Load resumes on mount
  useEffect(() => {
    dispatch({ type: 'LOAD_RESUMES' });
    // Load dark mode preference
    const dm = localStorage.getItem('resume_jade_dark');
    if (dm === '1') dispatch({ type: 'SET_DARK_MODE', value: true });
  }, []);

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
