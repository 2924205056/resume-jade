'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { TEMPLATES } from '@/lib/templates';
import { MODULE_DEFS } from '@/lib/modules';
import { renderResumeHTML } from '@/lib/renderer';
import { createDefaultData, initVisibility } from '@/lib/defaults';
import { nanoid } from 'nanoid';
import Galaxy from '@/components/Galaxy';

const id = () => nanoid(8);
function esc(s: string) { return s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : ''; }
function showToast(msg: string) { const e = document.querySelector('.toast'); if (e) e.remove(); const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2500); }

function formatDate(ym: string) {
  if (!ym) return '';
  const match = String(ym).trim().match(/^(\d{4})[-/.年\s]*(\d{1,2})/);
  return match ? `${match[1]}.${match[2].padStart(2, '0')}` : ym;
}

function HomeIcon({ name }: { name: string }) {
  return <span className={`home-symbol home-symbol-${name}`} aria-hidden="true" />;
}

function UiIcon({ name, size = 18 }: { name: 'copy' | 'download' | 'file' | 'template' | 'pencil' | 'plus' | 'trash'; size?: number }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      {name === 'plus' && <path {...common} d="M12 5v14M5 12h14" />}
      {name === 'download' && <><path {...common} d="M12 4v11" /><path {...common} d="m7 10 5 5 5-5" /><path {...common} d="M5 20h14" /></>}
      {name === 'template' && <><rect {...common} x="4" y="4" width="16" height="16" rx="3" /><path {...common} d="M4 10h16M10 10v10" /></>}
      {name === 'file' && <><path {...common} d="M7 3h7l4 4v14H7z" /><path {...common} d="M14 3v5h5M9 13h6M9 17h6" /></>}
      {name === 'pencil' && <><path {...common} d="M4 20h4l11-11a2.6 2.6 0 0 0-4-4L4 16z" /><path {...common} d="m13.5 6.5 4 4" /></>}
      {name === 'copy' && <><rect {...common} x="8" y="8" width="11" height="11" rx="2" /><path {...common} d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" /></>}
      {name === 'trash' && <><path {...common} d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" /></>}
    </svg>
  );
}

function stripHtml(html: string) {
  if (!html) return '';
  const el = document.createElement('div');
  el.innerHTML = html;
  return el.textContent || el.innerText || '';
}

function RichTextEditor({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (document.activeElement !== editor && editor.innerHTML !== (value || '')) {
      editor.innerHTML = value || '';
    }
  }, [value]);

  const emitChange = () => {
    const editor = editorRef.current;
    if (!editor) return;
    onChange(editor.innerHTML);
  };

  const saveSelection = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range.cloneRange();
    }
  };

  const getEditorRange = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor) return null;
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (editor.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
        return range;
      }
    }
    if (savedRangeRef.current && editor.contains(savedRangeRef.current.commonAncestorContainer)) {
      const range = savedRangeRef.current.cloneRange();
      selection?.removeAllRanges();
      selection?.addRange(range);
      return range;
    }
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
    savedRangeRef.current = range.cloneRange();
    return range;
  };

  const selectAfter = (node: Node) => {
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.setStartAfter(node);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    savedRangeRef.current = range.cloneRange();
  };

  const insertNode = (node: Node) => {
    const editor = editorRef.current;
    const range = getEditorRange();
    if (!editor || !range) return;
    range.deleteContents();
    range.insertNode(node);
    selectAfter(node);
    editor.focus();
    emitChange();
  };

  const wrapSelection = (tag: string, attrs: Record<string, string> = {}) => {
    const editor = editorRef.current;
    const range = getEditorRange();
    if (!editor || !range || range.collapsed) return;
    const wrapper = document.createElement(tag);
    Object.entries(attrs).forEach(([key, attrValue]) => wrapper.setAttribute(key, attrValue));
    try {
      range.surroundContents(wrapper);
    } catch {
      const fragment = range.extractContents();
      wrapper.appendChild(fragment);
      range.insertNode(wrapper);
    }
    selectAfter(wrapper);
    editor.focus();
    emitChange();
  };

  const runCommand = (command: string, commandValue?: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    document.execCommand(command, false, commandValue);
    emitChange();
  };

  const makeList = (ordered: boolean) => {
    const editor = editorRef.current;
    const range = getEditorRange();
    if (!editor || !range) return;
    const selectedText = range.toString().trim();
    const sourceText = selectedText || editor.innerText.trim();
    const lines = sourceText ? sourceText.split(/\r?\n/).map(line => line.trim()).filter(Boolean) : [''];
    const fragment = document.createDocumentFragment();
    const insertedNodes: HTMLElement[] = [];
    lines.forEach((line, index) => {
      const div = document.createElement('div');
      div.className = ordered ? 'rich-manual-list rich-manual-ordered' : 'rich-manual-list rich-manual-bullet';
      const marker = document.createElement('span');
      marker.className = 'rich-manual-marker';
      marker.contentEditable = 'false';
      marker.textContent = ordered ? `${index + 1}.` : '•';
      const body = document.createElement('span');
      body.className = 'rich-manual-body';
      body.textContent = line || '\u200B';
      div.append(marker, body);
      fragment.appendChild(div);
      insertedNodes.push(div);
    });
    if (selectedText) {
      range.deleteContents();
      range.insertNode(fragment);
    } else {
      editor.replaceChildren(fragment);
    }
    const selection = window.getSelection();
    const firstLine = insertedNodes[0];
    if (selection && firstLine) {
      const nextRange = document.createRange();
      nextRange.selectNodeContents(firstLine.querySelector('.rich-manual-body') || firstLine);
      nextRange.collapse(false);
      selection.removeAllRanges();
      selection.addRange(nextRange);
      savedRangeRef.current = nextRange.cloneRange();
    }
    editor.focus();
    emitChange();
  };

  const addLink = () => {
    const url = window.prompt('请输入链接地址，例如 https://example.com');
    if (!url) return;
    const normalized = /^https?:\/\//i.test(url) || /^mailto:/i.test(url) || /^tel:/i.test(url) ? url : `https://${url}`;
    wrapSelection('a', { href: normalized, target: '_blank', rel: 'noopener noreferrer' });
  };

  const addImage = () => {
    const url = window.prompt('请输入图片链接');
    if (!url) return;
    runCommand('insertImage', url);
  };

  return (
    <div className="rich-editor-shell">
      <div className="rich-editor-toolbar" onMouseDown={e => e.preventDefault()}>
        <button type="button" className="rich-tool rich-tool-bold" aria-label="加粗" onClick={() => wrapSelection('strong')}><span>B</span><em className="rich-tooltip">加粗</em></button>
        <button type="button" className="rich-tool rich-tool-italic" aria-label="斜体" onClick={() => wrapSelection('em')}><span>I</span><em className="rich-tooltip">斜体</em></button>
        <button type="button" className="rich-tool rich-tool-underline" aria-label="下划线" onClick={() => wrapSelection('u')}><span>U</span><em className="rich-tooltip">下划线</em></button>
        <button type="button" className="rich-tool" aria-label="插入链接" onClick={addLink}><span className="rich-icon rich-icon-link" aria-hidden="true" /><em className="rich-tooltip">插入链接</em></button>
        <button type="button" className="rich-tool" aria-label="编号列表" onMouseDown={e => { e.preventDefault(); makeList(true); }}><span className="rich-icon rich-icon-ordered" aria-hidden="true" /><em className="rich-tooltip">编号列表</em></button>
        <button type="button" className="rich-tool" aria-label="项目符号列表" onMouseDown={e => { e.preventDefault(); makeList(false); }}><span className="rich-icon rich-icon-bullets" aria-hidden="true" /><em className="rich-tooltip">项目符号列表</em></button>
        <button type="button" className="rich-tool" aria-label="插入图片" onClick={addImage}><span className="rich-icon rich-icon-image" aria-hidden="true" /><em className="rich-tooltip">插入图片</em></button>
        <button type="button" className="rich-tool" aria-label="清除格式" onClick={() => runCommand('removeFormat')}><span className="rich-icon rich-icon-clear" aria-hidden="true" /><em className="rich-tooltip">清除格式</em></button>
      </div>
      <div
        ref={editorRef}
        className="single-textarea compact rich-text-input"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder || ''}
        onInput={() => { saveSelection(); emitChange(); }}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        onBlur={() => { saveSelection(); emitChange(); }}
      />
    </div>
  );
}

export default function Home() {
  const { state, dispatch } = useStore();
  const { data, activeModule, view, zoom, resumes, currentId } = state;
  const [showCompare, setShowCompare] = useState(false);
  const [showATS, setShowATS] = useState(false);
  const [atsResults, setATSResults] = useState<{ score: number; items: { status: string; text: string }[] }>({ score: 0, items: [] });
  const [editingName, setEditingName] = useState('');
  const [renamingModule, setRenamingModule] = useState('');
  const [renameValue, setRenameValue] = useState('');
  const [previewCache, setPreviewCache] = useState<Record<string, string>>({});

  const previewRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  
  // Drag resize handler for controls area
  useEffect(() => {
    const divider = document.querySelector('.drag-divider') as HTMLElement | null;
    const controls = controlsRef.current;
    if (!divider || !controls) return;
    let dragging = false, startY = 0, startH = 0;
    const onDown = (e: PointerEvent) => {
      dragging = true;
      divider.classList.add('dragging');
      divider.setPointerCapture?.(e.pointerId);
      startY = e.clientY;
      startH = controls.offsetHeight;
      document.body.classList.add('resizing-controls');
      e.preventDefault();
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dy = startY - e.clientY;
      const newH = Math.max(180, Math.min(window.innerHeight * 0.74, startH + dy));
      controls.style.height = newH + 'px';
      e.preventDefault();
    };
    const onUp = (e: PointerEvent) => {
      dragging = false;
      divider.classList.remove('dragging');
      divider.releasePointerCapture?.(e.pointerId);
      document.body.classList.remove('resizing-controls');
    };
    divider.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      divider.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      document.body.classList.remove('resizing-controls');
    };
  }, [view]);


  const def = MODULE_DEFS.find(m => m.id === activeModule);
  const modData = (data.modules as any)[activeModule];
  const currentResume = resumes.find(r => r.id === currentId);
  const moduleTitle = (moduleId: string, fallback = '') => data.moduleTitles?.[moduleId]?.trim() || fallback;
  const activeModuleTitle = def ? moduleTitle(activeModule, def.name) : '';

  useEffect(() => { if (previewRef.current) previewRef.current.innerHTML = renderResumeHTML(data); }, [data]);

  useEffect(() => {
    if (view !== 'editor') return;
    const scroller = mainContentRef.current;
    const preview = previewRef.current;
    if (!scroller || !preview || !activeModule) return;
    const target = preview.querySelector(`[data-module-id="${activeModule}"]`) as HTMLElement | null;
    if (!target) return;

    preview.querySelectorAll('.preview-module-highlight').forEach(el => el.classList.remove('preview-module-highlight'));
    target.classList.add('preview-module-highlight');

    requestAnimationFrame(() => {
      const targetTop = target.offsetTop * zoom;
      const targetHeight = target.offsetHeight * zoom;
      const nextTop = Math.max(0, targetTop - (scroller.clientHeight - targetHeight) / 2);
      scroller.scrollTo({ top: nextTop, behavior: 'smooth' });
    });
  }, [activeModule, data, view, zoom]);

  // Apply spacing config to preview after render
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const pm = data.pageMargin || 'normal';
    const ms = data.moduleSpacing || 'normal';
    const lh = data.lineHeight || 'normal';
    const c = data.compressOnePage;
    
    const margins: Record<string, string> = { compact: '12mm 14mm', normal: '20mm 18mm', loose: '25mm 22mm' };
    const gaps: Record<string, string> = { compact: '8px', normal: '16px', loose: '24px' };
    const heights: Record<string, string> = { compact: '1.35', normal: '1.6', loose: '1.85' };
    
    const inner = el.querySelector('.resume-inner') as HTMLElement;
    const sidebar = el.querySelector('.resume-sidebar') as HTMLElement;
    const main = el.querySelector('.resume-main') as HTMLElement;
    
    if (data.templateId === 'business' && sidebar && main) {
      const p = c ? '10mm 6mm 10mm 8mm' : `${margins[pm].split(' ')[0]} 6mm ${margins[pm].split(' ')[0]} 8mm`;
      const m = c ? '10mm 10mm 10mm 12px' : `${margins[pm].split(' ')[0]} 10mm ${margins[pm].split(' ')[0]} 12px`;
      sidebar.style.padding = p; main.style.padding = m;
      sidebar.style.setProperty('--module-gap', c ? '6px' : gaps[ms]);
      sidebar.style.lineHeight = c ? '1.25' : heights[lh];
      main.style.setProperty('--module-gap', c ? '6px' : gaps[ms]);
      main.style.lineHeight = c ? '1.25' : heights[lh];
    } else if (inner) {
      inner.style.padding = c ? '10mm 12mm' : margins[pm];
      inner.style.setProperty('--module-gap', c ? '6px' : gaps[ms]);
      inner.style.lineHeight = c ? '1.25' : heights[lh];
    }
    if (c) (el.querySelector('.resume') as HTMLElement).style.fontSize = '10pt';
  }, [data]);

  // Pre-compute template previews for home page
  useEffect(() => {
    if (view === 'home') {
      const cache: Record<string, string> = {};
      TEMPLATES.forEach(t => {
        const d = createDefaultData(); initVisibility(d); d.templateId = t.id;
        cache[t.id] = renderResumeHTML(d);
      });
      setPreviewCache(cache);
    }
  }, [view]);

  const saveAndUpdate = (moduleId: string, value: any) => { dispatch({ type: 'UPDATE_MODULE', moduleId, value }); };
  const renameCurrentResume = useCallback((name: string) => {
    if (!currentId) return;
    dispatch({ type: 'RENAME_RESUME', id: currentId, name: name.trim() || '未命名简历' });
  }, [currentId, dispatch]);
  const scrollToTemplates = useCallback(() => {
    document.getElementById('template-picker')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);
  const goTemplatePicker = useCallback(() => {
    dispatch({ type: 'SET_VIEW', view: 'home' });
    window.setTimeout(() => {
      document.getElementById('template-picker')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 40);
  }, [dispatch]);

  const startRenameModule = (moduleId: string, title: string) => {
    setRenamingModule(moduleId);
    setRenameValue(title);
  };

  const commitRenameModule = () => {
    if (!renamingModule) return;
    dispatch({ type: 'SET_MODULE_TITLE', id: renamingModule, title: renameValue });
    setRenamingModule('');
    setRenameValue('');
  };

  const jumpToModuleEditor = useCallback((moduleId: string) => {
    if (!MODULE_DEFS.some(m => m.id === moduleId)) return;
    dispatch({ type: 'SET_ACTIVE_MODULE', id: moduleId });
    requestAnimationFrame(() => {
      document.querySelector(`.mod-tab[data-module-id="${moduleId}"]`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
      controlsRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }, [dispatch]);

  const handlePreviewClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const section = target.closest('[data-module-id]') as HTMLElement | null;
    const moduleId = section?.dataset.moduleId;
    if (moduleId) jumpToModuleEditor(moduleId);
  }, [jumpToModuleEditor]);

  
// Wrap resume HTML into a complete document for iframe preview
function wrapPreviewDoc(html: string, tid: string): string {
  const css = `
.resume{width:210mm;min-height:297mm;font-size:11pt;line-height:1.6;color:#1e293b;background:white;font-family:"Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif}
.resume-inner{padding:20mm 18mm}
.resume-name{font-size:24pt;font-weight:700;letter-spacing:2px;margin-bottom:4px}
.resume-header{text-align:center;margin-bottom:12px}
.resume-header-avatar{justify-content:center;margin-bottom:12px}
.resume-header-avatar .header-text{flex:1;text-align:center}
.info-line,.job-target{text-align:center;font-size:10.5pt;line-height:1.55;color:#475569}
.info-line{margin-top:2px}.job-target{margin-top:2px;margin-bottom:4px}
.resume-contact{display:flex;justify-content:center;flex-wrap:wrap;gap:4px 16px;font-size:10pt;color:#475569}
.resume-section{margin-top:16px}
.section-title{font-size:13pt;font-weight:700;padding-bottom:4px;border-bottom:1.5px solid #111827;margin-bottom:10px;letter-spacing:1px}
.resume-header-avatar{display:flex;align-items:flex-start;gap:14px}
.avatar-img{width:25mm;height:33mm;object-fit:cover;border-radius:3px;flex-shrink:0}
.entry{margin-bottom:10px}.entry-header{display:flex;justify-content:space-between;flex-wrap:wrap}
.entry-title{font-weight:600;font-size:11pt}.entry-subtitle{font-size:10.5pt;color:#475569}
.entry-date{font-size:10pt;color:#64748b;white-space:nowrap}.entry-desc{font-size:10pt;margin-top:4px;color:#334155;white-space:pre-wrap}
.rich-text{white-space:normal}.rich-text p,.rich-text div{margin:0 0 3px}.rich-text ul,.rich-text ol{margin:3px 0 3px 16px;padding:0}.rich-text li{margin:1px 0}.rich-text a{color:var(--accent);text-decoration:underline}.rich-text img{max-width:42mm;max-height:28mm;object-fit:contain;display:block;margin:4px 0}.entry-bullets{padding-left:16px}
.rich-text .rich-manual-list{display:grid;grid-template-columns:15px minmax(0,1fr);align-items:start;column-gap:3px;margin:1px 0}.rich-text .rich-manual-marker{color:inherit;font-weight:600;text-align:right}.rich-text .rich-manual-body{min-width:0}
.skills-tags{display:flex;flex-wrap:wrap;gap:6px}.skill-tag-resume{font-size:10pt;padding:2px 10px;background:#f1f5f9;border-radius:100px}
.cert-item{font-size:10pt;padding:2px 0;display:flex;justify-content:space-between}.single-text{font-size:10pt;color:#334155;white-space:pre-wrap}
.c-date{font-size:10pt;color:#64748b}
.info-line{font-size:10.5pt;color:#475569}
.job-target{font-size:10.5pt;color:#475569;margin-bottom:4px}
.sep{opacity:0.3;margin:0 2px}
.biz-layout{display:flex;padding:0;min-height:297mm;align-items:stretch}
.resume-sidebar{width:32%;background:#1e3a5f;color:#e2e8f0;padding:12mm 6mm;min-height:297mm}
.resume-sidebar .section-title{color:white;border-bottom-color:rgba(255,255,255,0.2)}
.resume-sidebar .skill-tag-resume{background:rgba(255,255,255,0.15)}
.resume-sidebar .sidebar-name{font-size:20pt;font-weight:700;color:white;margin-bottom:4px}
.sidebar-profile{margin-bottom:12px}.sidebar-avatar{width:24mm;height:30mm;object-fit:cover;border-radius:4px;display:block;margin:0 0 8px;border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.12)}
.resume-sidebar .contact-item{font-size:9pt;margin-bottom:2px}
.resume-main{flex:1;padding:12mm 10mm;min-height:297mm}
.resume-main .section-title{color:#1e3a5f;border-bottom-color:#1e3a5f}
.mod-header{background:#1e293b;color:white;padding:18px 20px;display:flex;align-items:center;gap:14px}
.mod-header .mod-name,.mod-header .resume-name{color:white}
.mod-info,.mod-job{font-size:10pt;opacity:0.8}
.mod-contact{font-size:9.5pt;opacity:0.85;justify-content:flex-start}
.mod-avatar{width:22mm;height:28mm;border-radius:50%;border:2px solid rgba(255,255,255,0.3);flex-shrink:0}
.creative-resume{color:#24333a;background:#fff}
.creative-inner{padding:14mm 16mm 18mm}
.creative-topline{display:flex;align-items:flex-end;justify-content:space-between;padding-top:2mm}
.creative-cn{display:inline-block;font-size:31pt;line-height:1;font-weight:900;color:#314b55;letter-spacing:1px;margin-right:10px}
.creative-en{display:inline-block;font-size:13pt;color:#9a875d;font-weight:700;letter-spacing:0;text-transform:capitalize}
.creative-icons{display:flex;align-items:center;gap:8px;padding-bottom:5px}
.creative-icons span{display:block;width:24px;height:24px;border-radius:50%;background:#405f6b;position:relative}
.creative-icons span:nth-child(2){background:#b99a50}
.creative-icons span::after{content:"";position:absolute;inset:7px;border:2px solid rgba(255,255,255,0.88);border-radius:50%}
.creative-gold-line{height:2px;background:#b99a50;margin:8px 0 14px}
.creative-basic{position:relative;display:grid;grid-template-columns:minmax(0,1fr) 28mm;gap:10mm;min-height:34mm;margin-bottom:14px}
.creative-ribbon,.creative-ttl{display:inline-flex;align-items:center;justify-content:center;min-width:34mm;min-height:9mm;padding:0 11px;background:#111827;color:white;border:none;border-radius:0;font-size:12pt;font-weight:800;letter-spacing:1px}
.creative-ribbon{position:absolute;left:0;top:0}
.creative-ribbon::after,.creative-ttl::after{content:"";width:0;height:0;border-top:4.5mm solid transparent;border-bottom:4.5mm solid transparent;border-left:5.5mm solid #111827;margin-right:-16.5px;margin-left:10px}
.creative-basic-grid{grid-column:1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 18px;padding-top:12mm;font-size:9.6pt;color:#34464d}
.creative-basic-grid div{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.creative-basic-grid span{color:#111827;font-weight:800}
.creative-avatar{grid-column:2;align-self:start;justify-self:end;width:27mm;height:33mm;object-fit:cover;border-radius:0;border:1px solid #d8dee2;background:#f8fafc;flex-shrink:0}
.creative-section{margin-top:12px}
.creative-section .entry{margin-bottom:8px}
.creative-section .entry-title{color:#21343c}
.creative-section .entry-date{color:#6e7f86}
.creative-section .entry-desc,.creative-section .single-text{color:#3f5057}
.creative-ttl{margin-bottom:8px}
.academic-header{position:relative;text-align:center;padding:0 30mm 14px;min-height:30mm;border-bottom:2px solid #1e293b;margin-bottom:18px;display:flex;align-items:center;justify-content:center}.academic-header-text{min-width:0}.academic-avatar{width:23mm;height:29mm;object-fit:cover;border-radius:4px;position:absolute;right:0;top:0;border:1px solid #d1d5db;background:#f8fafc}
.minimal-header{position:relative;text-align:center;min-height:29mm;padding-right:28mm;display:flex;align-items:center;justify-content:center}.minimal-header-text{min-width:0}.minimal-avatar{width:22mm;height:28mm;object-fit:cover;border-radius:4px;position:absolute;right:0;top:0;border:1px solid #d1d5db;background:#f8fafc}
.tech-header{position:relative;min-height:29mm;padding-right:30mm!important;display:flex;align-items:center}.tech-header-text{min-width:0}.tech-avatar{width:22mm;height:28mm;object-fit:cover;border-radius:4px;position:absolute;right:0;top:0;border:1px solid #d1d5db;background:#f8fafc}
.bold-header{position:relative;min-height:38mm;padding-right:34mm!important}.bold-avatar{width:26mm;height:32mm;object-fit:cover;border-radius:5px;position:absolute;right:18mm;top:16mm;border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.12)}
`;
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>' + css + '</style></head><body style="margin:0;display:flex;justify-content:center;background:white">' + html + '</body></html>';
}


  // Avatar file resize handler
  const handleAvatarFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        const max = 200;
        if (w > max) { h = h * max / w; w = max; }
        if (h > max) { w = w * max / h; h = max; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        saveAndUpdate(activeModule, { ...modData, avatar: dataUrl });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };


  // ========== DASHBOARD ==========
  if (view === 'dashboard') {
    return (
      <div className="dashboard-page">
        <Galaxy
          className="dashboard-galaxy-bg"
          density={1.25}
          glowIntensity={0.48}
          hueShift={18}
          saturation={0.04}
          starSpeed={0.34}
          speed={0.58}
          twinkleIntensity={0.42}
          rotationSpeed={0.035}
          repulsionStrength={1.1}
          transparent={false}
        />
        <div className="dashboard-scrim" />
        <div className="dashboard-shell">
          <header className="dashboard-header">
            <button className="dashboard-brand" onClick={() => dispatch({ type: 'SET_VIEW', view: 'home' })}>
              <HomeIcon name="brand" />
              <span>ResuMe</span>
            </button>
            <div className="dashboard-title">
              <h1>我的简历</h1>
              <p>{resumes.length ? `共 ${resumes.length} 份，点击任意卡片继续编辑` : '从模板开始创建你的第一份简历'}</p>
            </div>
            <div className="dashboard-actions">
              <button className="dashboard-btn dashboard-btn-ghost" onClick={() => dispatch({ type: 'SET_VIEW', view: 'home' })}>
                <span>返回首页</span>
              </button>
              <button className="dashboard-btn dashboard-btn-primary" onClick={() => dispatch({ type: 'NEW_RESUME' })}>
                <UiIcon name="plus" />
                <span>新建简历</span>
              </button>
              <button className="dashboard-btn" onClick={goTemplatePicker}>
                <UiIcon name="template" />
                <span>选择模板</span>
              </button>
            </div>
          </header>

          <div className="dashboard-stats">
            <div>
              <strong>{resumes.length}</strong>
              <span>简历数量</span>
            </div>
            <div>
              <strong>{new Set(resumes.map(r => r.templateId)).size || 0}</strong>
              <span>已用模板</span>
            </div>
            <div>
              <strong>{currentResume?.name || '未选择'}</strong>
              <span>当前编辑</span>
            </div>
          </div>

          {resumes.length === 0 ? (
            <div className="dashboard-empty">
              <UiIcon name="file" size={34} />
              <h2>还没有简历</h2>
              <p>先选择一个模板，或者直接新建一份默认简历。</p>
              <div>
                <button className="dashboard-btn dashboard-btn-primary" onClick={goTemplatePicker}>选择模板</button>
                <button className="dashboard-btn" onClick={() => dispatch({ type: 'NEW_RESUME' })}>新建简历</button>
              </div>
            </div>
          ) : (
            <div className="dashboard-grid">
              {resumes.map(r => {
                const template = TEMPLATES.find(t => t.id === r.templateId);
                return (
                  <article key={r.id} className="dashboard-card" onClick={() => dispatch({ type: 'SELECT_RESUME', id: r.id })}>
                    <div className="dashboard-preview">
                      <iframe
                        title={`${r.name || '未命名'} 预览`}
                        srcDoc={wrapPreviewDoc(renderResumeHTML(r.data), r.templateId)}
                      />
                    </div>
                    <div className="dashboard-card-body">
                      <div className="dashboard-card-main">
                        {editingName === r.id ? (
                          <input
                            className="dashboard-name-input"
                            defaultValue={r.name}
                            autoFocus
                            onClick={e => e.stopPropagation()}
                            onBlur={e => { dispatch({ type: 'RENAME_RESUME', id: r.id, name: e.currentTarget.value || '未命名' }); setEditingName(''); }}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                dispatch({ type: 'RENAME_RESUME', id: r.id, name: e.currentTarget.value || '未命名' });
                                setEditingName('');
                              }
                              if (e.key === 'Escape') setEditingName('');
                            }}
                          />
                        ) : (
                          <h2>{r.name || '未命名'}</h2>
                        )}
                        <p>{template?.name || r.templateId} · 更新于 {new Date(r.updatedAt).toLocaleDateString('zh-CN')}</p>
                      </div>
                      <div className="dashboard-card-actions" onClick={e => e.stopPropagation()}>
                        <button aria-label="重命名" title="重命名" onClick={() => setEditingName(r.id)}>
                          <UiIcon name="pencil" size={16} />
                        </button>
                        <button aria-label="复制" title="复制" onClick={() => dispatch({ type: 'DUPLICATE_RESUME', id: r.id })}>
                          <UiIcon name="copy" size={16} />
                        </button>
                        <button className="danger" aria-label="删除" title="删除" onClick={() => { if (confirm('确定删除？')) dispatch({ type: 'DELETE_RESUME', id: r.id }); }}>
                          <UiIcon name="trash" size={16} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          </div>
      </div>
    );
  }

  // ========== HOME (Template Selection) ==========
  if (view === 'home') {
    return (
      <div className="home-page">
        <section className="home-galaxy-hero">
          <Galaxy
            className="home-galaxy-bg"
            density={1.65}
            glowIntensity={0.72}
            hueShift={18}
            saturation={0.08}
            starSpeed={0.44}
            speed={0.82}
            twinkleIntensity={0.58}
            rotationSpeed={0.045}
            repulsionStrength={1.35}
            transparent={false}
          />
          <div className="home-galaxy-scrim" />

          <nav className="home-glass-nav" aria-label="首页导航">
            <button className="home-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <HomeIcon name="brand" />
              <span>ResuMe</span>
            </button>
            <button className="home-nav-action" onClick={scrollToTemplates}>
              开始
            </button>
          </nav>

          <div className="home-galaxy-content">
            <h1>
              做一份拿得出手的<br />专业简历。
            </h1>
            <p>
              多套专业模板、实时预览和高清导出都在一个页面里，打开就能开始改。
            </p>
            <div className="home-hero-actions">
              <button className="home-primary-btn" onClick={scrollToTemplates}>
                开始制作 <HomeIcon name="arrow" />
              </button>
              {resumes.length > 0 && (
                <button className="home-secondary-btn" onClick={() => dispatch({ type: 'SET_VIEW', view: 'dashboard' })}>
                  <HomeIcon name="folder" /> 我的简历 ({resumes.length})
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="home-content-band" id="template-picker">
        <Galaxy
          className="home-content-galaxy-bg"
          density={1.25}
          glowIntensity={0.52}
          hueShift={18}
          saturation={0.08}
          starSpeed={0.34}
          speed={0.62}
          twinkleIntensity={0.44}
          rotationSpeed={0.028}
          repulsionStrength={0.95}
          transparent={false}
        />
        <div className="home-content-scrim" />
        <div className="home-feature-strip">
          {[
            { icon: 'template', title: '8 套专业模板', desc: '覆盖互联网、金融、学术等行业风格' },
            { icon: 'palette', title: '自由组合模块', desc: '拖拽排序，13 种简历模块随心搭配' },
            { icon: 'download', title: '高清 PDF 导出', desc: '一键生成 A4 标准简历，打印无压力' },
          ].map(f => {
            return (
              <div key={f.title} className="home-feature-card">
                <HomeIcon name={f.icon} />
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Template Grid */}
        <div className="home-section-heading">
          <HomeIcon name="spark" />
          <h2>选择模板开始制作</h2>
        </div>
        <div className="template-grid">
          {TEMPLATES.map(t => (
            <div key={t.id} className="template-card" onClick={() => { dispatch({ type: 'SET_TEMPLATE', templateId: t.id }); dispatch({ type: 'SET_VIEW', view: 'editor' }); }}>
              <div className="template-preview">
                {previewCache[t.id] ? (
                  <iframe srcDoc={wrapPreviewDoc(previewCache[t.id], t.id)}
                    title={t.name} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text3)', fontSize: 13 }}>
                    {t.name}
                  </div>
                )}
              </div>
              <div className="template-info">
                <h3>{t.name}</h3>
                <p style={{ fontSize: 12, color: 'var(--text2)', margin: '4px 0' }}>{t.desc}</p>
                <div className="template-tags">{t.tags.slice(0, 3).map(tg => <span key={tg}>{tg}</span>)}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text3)', fontSize: 12 }}>
          数据结构保存在浏览器本地 · 无需注册登录
        </div>
        </section>
      </div>
    );
  }

  // ========== EDITOR ==========
  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'resume_data.json'; a.click();
    showToast('JSON 已导出');
  };
  const handleImportJSON = () => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev: any) => { try { const d = JSON.parse(ev.target.result); if (!d.modules) { showToast('无效文件'); return; } dispatch({ type: 'IMPORT_RESUME', data: d }); showToast('JSON 已导入'); } catch { showToast('解析失败'); } };
      reader.readAsText(file);
    }; input.click();
  };
  const handleExportPDF = async () => {
    if (!previewRef.current) return;
    showToast('正在生成 PDF...');
    try {
      const [{ default: h2c }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
      const clone = previewRef.current.cloneNode(true) as HTMLElement;
      clone.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px';
      document.body.appendChild(clone);
      const canvas = await h2c(clone, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      document.body.removeChild(clone);
      const imgW = 210, imgH = (canvas.height * imgW) / canvas.width;
      const pdf = new jsPDF('p', 'mm', 'a4');
      let pos = 0; while (pos < imgH) { if (pos > 0) pdf.addPage(); pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, -pos, imgW, imgH); pos += 297; }
      pdf.save((data.modules.basicInfo.name || '简历') + '_简历.pdf');
      showToast('PDF 已生成');
    } catch { showToast('PDF 生成失败'); }
  };
  const handleExportHTML = () => {
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>简历</title><style>@page{size:A4;margin:0}body{display:flex;justify-content:center;background:#f1f5f9}${[...document.styleSheets].map(s => { try { return [...s.cssRules].map(r => r.cssText).join(''); } catch { return ''; } }).join('')}</style></head><body>${renderResumeHTML(data)}</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'resume.html'; a.click();
    showToast('HTML 已导出');
  };
  const handleATS = () => {
    const items: { status: string; text: string }[] = []; let score = 100;
    const bi = data.modules.basicInfo, vis = data.moduleVisibility, mods = data.modules;
    if (!bi.name?.trim()) { items.push({ status: 'fail', text: '缺少姓名' }); score -= 20; } else items.push({ status: 'pass', text: '姓名已填写' });
    if (bi.phone?.trim() && bi.email?.trim()) items.push({ status: 'pass', text: '联系方式完整' });
    else if (bi.phone?.trim() || bi.email?.trim()) { items.push({ status: 'warn', text: '联系方式部分缺失' }); score -= 5; }
    else { items.push({ status: 'fail', text: '缺少联系方式' }); score -= 15; }
    if (vis.education !== false && Array.isArray(mods.education) && mods.education.length) items.push({ status: 'pass', text: '教育经历已填写' });
    else { items.push({ status: 'warn', text: '教育经历为空' }); score -= 10; }
    if (vis.workExperience !== false && Array.isArray(mods.workExperience) && mods.workExperience.length) {
      if (mods.workExperience.some((w: any) => w.description?.trim() || w.bullets?.length)) items.push({ status: 'pass', text: '工作经历包含详细描述' });
      else { items.push({ status: 'warn', text: '建议添加工作描述' }); score -= 5; }
    } else { items.push({ status: 'warn', text: '工作经历为空' }); score -= 10; }
    if (vis.skills !== false && mods.skills?.items?.length > 3) items.push({ status: 'pass', text: '技能充足' });
    else if (mods.skills?.items?.length > 0) { items.push({ status: 'warn', text: '技能较少' }); score -= 5; }
    else { items.push({ status: 'warn', text: '技能为空' }); score -= 8; }
    if (bi.avatar) { items.push({ status: 'warn', text: '头像图片（ATS无法解析）' }); score -= 3; } else items.push({ status: 'pass', text: '无头像（ATS友好）' });
    if (['business', 'modern', 'creative'].includes(data.templateId)) { items.push({ status: 'warn', text: '复杂布局可能影响ATS' }); score -= 3; } else items.push({ status: 'pass', text: '简洁布局（ATS友好）' });
    setATSResults({ score: Math.max(0, Math.min(100, score)), items }); setShowATS(true);
  };

  const createEmptyEntry = (moduleDef = def) => {
    const ne: any = { id: id() };
    moduleDef?.fields.forEach(f => { ne[f.key] = f.type === 'checkbox' ? false : ''; });
    if (moduleDef?.hasBullets) ne.bullets = [];
    return ne;
  };

  const updateEntryField = (entryIndex: number, key: string, value: string | boolean) => {
    const entries = Array.isArray(modData) ? [...modData] : [];
    if (!entries[entryIndex]) entries[entryIndex] = createEmptyEntry();
    const next = { ...entries[entryIndex], [key]: value };
    if (key === 'description') next.bullets = [];
    entries[entryIndex] = next;
    saveAndUpdate(activeModule, entries);
    if (data.moduleVisibility[activeModule] === false) dispatch({ type: 'TOGGLE_MODULE_VISIBILITY', id: activeModule });
  };

  const updateEntryBullet = (entryIndex: number, bulletIndex: number, html: string) => {
    const entries = Array.isArray(modData) ? [...modData] : [];
    const entry = entries[entryIndex];
    if (!entry) return;

    const bullets = [...(entry.bullets || [])];
    const existing = bullets[bulletIndex];
    if (existing) {
      bullets[bulletIndex] = { ...existing, html };
    } else if (html.trim()) {
      bullets.push({ id: id(), html });
    }

    entries[entryIndex] = { ...entry, bullets: bullets.filter(b => b.html.trim()) };
    saveAndUpdate(activeModule, entries);
  };

  const updateSingleField = (key: string, value: any) => {
    const next = { ...(modData || {}), [key]: value };
    saveAndUpdate(activeModule, next);
    if (data.moduleVisibility[activeModule] === false) dispatch({ type: 'TOGGLE_MODULE_VISIBILITY', id: activeModule });
  };

  const collectFormData = () => {
    if (!def) return; const panel = document.getElementById('editorPanel'); if (!panel) return;
    if (def.isSkills) { const tags = panel.querySelectorAll('.skill-tag'); const items = Array.from(tags).map(t => t.textContent?.replace('×', '').trim()).filter(Boolean); saveAndUpdate(activeModule, { items }); return; }
    if (def.isTextarea) return;
    if (def.id === 'basicInfo') return;
    if (def.single) { const obj: any = { ...(modData || {}) }; def.fields.forEach(f => { const el = panel.querySelector('#editData_' + f.key) as HTMLInputElement; if (el) obj[f.key] = f.type === 'checkbox' ? (el as any).checked : el.value; }); saveAndUpdate(activeModule, obj); return; }
    if (def.multi) { const entries: any[] = []; const cards = panel.querySelectorAll('.exp-card'); cards.forEach((card, i) => { const entry: any = { ...(modData[i] || {}), id: modData[i]?.id || id(), bullets: modData[i]?.bullets || [] }; def.fields.forEach(f => { const el = card.querySelector('#entry_' + i + '_' + f.key) as HTMLInputElement | HTMLTextAreaElement; if (el) entry[f.key] = f.type === 'checkbox' ? (el as HTMLInputElement).checked : el.value; }); if (def.hasBullets && !entry.description) { const bulletEls = card.querySelectorAll('.bullet-item span[contenteditable]'); const bullets: { id: string; html: string }[] = []; bulletEls.forEach((b, bi) => { const html = b.innerHTML; if (html.trim()) bullets.push({ id: modData[i]?.bullets?.[bi]?.id || id(), html }); }); entry.bullets = bullets; } entries.push(entry); }); saveAndUpdate(activeModule, entries); }
  };

  return (
    <div className="editor-page">
      {/* Tool Bar */}
      <div className="tool-bar">
        <button className="tool-btn" onClick={() => dispatch({ type: 'SET_VIEW', view: resumes.length > 0 ? 'dashboard' : 'home' })}>← 返回</button>
        <label className="toolbar-name-editor">
          <span>简历名称</span>
          <input
            key={currentId}
            defaultValue={currentResume?.name || '未命名简历'}
            onBlur={e => renameCurrentResume(e.currentTarget.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') e.currentTarget.blur();
            }}
          />
        </label>
        <select value={data.templateId} onChange={e => dispatch({ type: 'SET_TEMPLATE', templateId: e.target.value })}>
          {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={data.fontFamily} onChange={e => dispatch({ type: 'SET_FONT', font: e.target.value })}>
          <option value="Noto Sans SC, PingFang SC, Microsoft YaHei, sans-serif">思源黑体</option>
          <option value="SimSun, STSong, Noto Serif SC, serif">宋体</option>
          <option value="KaiTi, STKaiti, serif">楷体</option>
          <option value="JetBrains Mono, Fira Code, monospace">等宽字体</option>
        </select>
        <div className="toolbar-settings">
          <span>页边距</span>
          <select value={data.pageMargin} onChange={e => dispatch({ type: 'SET_MARGIN', value: e.target.value })}>
            <option value="compact">紧凑</option><option value="normal">标准</option><option value="loose">宽松</option>
          </select>
          <span>模块间距</span>
          <select value={data.moduleSpacing} onChange={e => dispatch({ type: 'SET_SPACING', value: e.target.value })}>
            <option value="compact">紧凑</option><option value="normal">标准</option><option value="loose">宽松</option>
          </select>
          <span>行间距</span>
          <select value={data.lineHeight} onChange={e => dispatch({ type: 'SET_LINE_HEIGHT', value: e.target.value })}>
            <option value="compact">紧凑</option><option value="normal">标准</option><option value="loose">宽松</option>
          </select>
          <label className="toolbar-check">
            <input type="checkbox" checked={data.compressOnePage} onChange={e => dispatch({ type: 'TOGGLE_COMPRESS', value: e.target.checked })} />压缩至一页
          </label>
          <button className="tool-btn toolbar-reset" onClick={() => { if (confirm('确定重置？')) dispatch({ type: 'RESET' }); }}>重置</button>
        </div>
        <span className="spacer" />
        <span className="save-status saved">已保存</span>
        <button className="tool-btn toolbar-download" onClick={handleExportPDF}><UiIcon name="download" size={16} />下载 PDF</button>
      </div>

      {/* Preview */}
      <div className="main-content" ref={mainContentRef}>
        <div className="preview-panel">
          <div>
            <div className="preview-wrapper" style={{ width: 794 * zoom, height: 1123 * zoom }}>
              <div
                ref={previewRef}
                className="resume-preview-click-layer"
                onClick={handlePreviewClick}
                style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
              />
            </div>
            <div className="preview-zoom">
              <button onClick={() => dispatch({ type: 'SET_ZOOM', zoom: Math.max(0.4, zoom - 0.1) })}>-</button>
              <span className="zoom-label">{Math.round(zoom * 100)}%</span>
              <button onClick={() => dispatch({ type: 'SET_ZOOM', zoom: Math.min(1.8, zoom + 0.1) })}>+</button>
              <button onClick={() => dispatch({ type: 'SET_ZOOM', zoom: 1 })}>1:1</button>
            </div>
          </div>
        </div>
      </div>

      {/* Drag Divider */}
      <div className="drag-divider"><div className="drag-divider-line" /></div>

      {/* Controls */}
      <div className="controls-wrap" ref={controlsRef}>
        <div className="module-tabs">
          {data.moduleOrder.map(mid => {
            const d = MODULE_DEFS.find(m => m.id === mid); if (!d) return null;
            const on = data.moduleVisibility[mid] !== false;
            const idx = data.moduleOrder.indexOf(mid);
            const title = moduleTitle(mid, d.name);
            const renaming = renamingModule === mid;
            return (
              <div key={mid}
                data-module-id={mid}
                className={`mod-tab ${mid === activeModule ? 'active' : ''} ${!on ? 'hidden-mod' : ''}`}
                onClick={() => dispatch({ type: 'SET_ACTIVE_MODULE', id: mid })}
                draggable={!renaming}
                onDragStart={e => { e.dataTransfer.setData('text/plain', String(idx)); e.currentTarget.classList.add('dragging'); }}
                onDragEnd={() => { document.querySelectorAll('.mod-tab').forEach(el => el.classList.remove('dragging', 'drag-over')); }}
                onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
                onDragLeave={e => { e.currentTarget.classList.remove('drag-over'); }}
                onDrop={e => { e.preventDefault(); document.querySelectorAll('.mod-tab').forEach(el => el.classList.remove('drag-over')); const from = parseInt(e.dataTransfer.getData('text/plain')); if (from !== idx) dispatch({ type: 'MOVE_MODULE', from, to: idx }); }}>
                {/* Drag handle */}
                <span className="mod-tab-grip" title="拖动排序"
                  draggable
                  onDragStart={e => { e.dataTransfer.setData('text/plain', String(idx)); (e.currentTarget as HTMLElement).closest('.mod-tab')?.classList.add('dragging'); }}
                  onDragEnd={e => { document.querySelectorAll('.mod-tab').forEach(el => el.classList.remove('dragging', 'drag-over')); }}
                  onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLElement).closest('.mod-tab')?.classList.add('drag-over'); }}
                  onDragLeave={e => { (e.currentTarget as HTMLElement).closest('.mod-tab')?.classList.remove('drag-over'); }}
                  onDrop={e => { e.preventDefault(); document.querySelectorAll('.mod-tab').forEach(el => el.classList.remove('drag-over')); const from = parseInt(e.dataTransfer.getData('text/plain')); if (from !== idx) dispatch({ type: 'MOVE_MODULE', from, to: idx }); }}
                  onClick={e => e.stopPropagation()}>
                  ⋮⋮
                </span>
                {/* Module name */}
                <span className="mod-tab-title">
                  {renaming ? (
                    <input
                      className="mod-title-input"
                      value={renameValue}
                      autoFocus
                      onClick={e => e.stopPropagation()}
                      onChange={e => setRenameValue(e.currentTarget.value)}
                      onBlur={commitRenameModule}
                      onKeyDown={e => {
                        e.stopPropagation();
                        if (e.key === 'Enter') commitRenameModule();
                        if (e.key === 'Escape') { setRenamingModule(''); setRenameValue(''); }
                      }}
                    />
                  ) : (
                    <>
                      <span className="mod-tab-label">{title}</span>
                      <button
                        type="button"
                        className="mod-rename-btn"
                        title="修改模块名称"
                        onClick={e => { e.stopPropagation(); startRenameModule(mid, title); }}
                        draggable={false}
                      />
                    </>
                  )}
                </span>
                {/* Toggle switch */}
                <div className={`toggle-track ${on ? 'on' : ''}`}
                  onClick={e => { e.stopPropagation(); dispatch({ type: 'TOGGLE_MODULE_VISIBILITY', id: mid }); }}
                  title={on ? '在简历中显示' : '在简历中隐藏'}>
                  <div className="toggle-thumb" />
                </div>
              </div>
            );
          })}

        </div>

        <div className="editor-panel" id="editorPanel" onChange={collectFormData}>
            {def && (<>
            {data.moduleVisibility[activeModule] === false && (
              <div className="module-hidden-notice">
                <span>当前模块已隐藏，编辑内容或点击右侧开关后会显示在简历中。</span>
                <button onClick={() => dispatch({ type: 'TOGGLE_MODULE_VISIBILITY', id: activeModule })}>显示模块</button>
              </div>
            )}
            <div className="section-header">{activeModuleTitle}</div>
            {def.isSkills && (
              <div>
                <div className="field-row"><span className="field-label">技能标签</span></div>
                <div className="skills-wrap" id="skillsWrap">
                  {modData.items?.map((s: string, i: number) => (
                    <span key={i} className="skill-tag">{esc(s)}<span className="remove-skill" onClick={() => { const items = [...modData.items]; items.splice(i, 1); saveAndUpdate(activeModule, { items }); }}>×</span></span>
                  ))}
                  <input type="text" placeholder="输入技能后按回车" onKeyDown={e => { if (e.key === 'Enter' && e.currentTarget.value.trim()) { const items = [...(modData.items || []), e.currentTarget.value.trim()]; saveAndUpdate(activeModule, { items }); e.currentTarget.value = ''; } }} />
                </div>
                {/* Skill Categories */}
                <div style={{ marginTop: 12 }}>
                  <div className="field-row"><span className="field-label">快捷分类</span></div>
                  <div className="suggest-chips" style={{ flexWrap: 'wrap' }}>
                    {['前端', '后端', '数据库', 'DevOps', '设计', '语言', '软技能'].map(cat => (
                      <button type="button" key={cat} className="skill-quick-chip" onClick={() => { const items = [...(modData.items || []), ...getCategorySkills(cat).filter((s: string) => !modData.items?.includes(s))]; saveAndUpdate(activeModule, { items }); }}>{cat}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {def.isTextarea && (
              <div>
                <RichTextEditor
                  value={modData.content || ''}
                  placeholder={`请输入${activeModuleTitle}`}
                  onChange={html => updateSingleField('content', html)}
                />
              </div>
            )}
            {def.id === 'basicInfo' && (
              <div className="basic-form">
                <div className="basic-tip">填写后会自动排版在简历上，不需要的信息可以选择不填或删除内容。</div>
                <div className="basic-grid">
                  <label className="basic-field"><span>您的姓名</span><input className="field-input" value={modData.name || ''} onChange={e => updateSingleField('name', e.currentTarget.value)} /></label>
                  <label className="basic-field"><span>性别</span><select className="field-input" value={modData.gender || '不填'} onChange={e => updateSingleField('gender', e.currentTarget.value)}><option>不填</option><option>男</option><option>女</option></select></label>
                  <label className="basic-field"><span>出生年月</span><input type="text" className="field-input" placeholder="例如 1998.06" value={modData.birthDate || ''} onChange={e => updateSingleField('birthDate', e.currentTarget.value)} /></label>
                  <div className="basic-check"><input type="checkbox" checked={modData.birthToAge !== false} onChange={e => updateSingleField('birthToAge', e.currentTarget.checked)} /><span>转年龄</span></div>
                  <div className="basic-photo-cell"><span>照片设置</span><button className="basic-upload-btn" onClick={() => { const inp = document.getElementById('avatarFileInput') as HTMLInputElement; inp?.click(); }}>上传照片</button><label className="basic-check"><input type="checkbox" checked={modData.showAvatar !== false} onChange={e => updateSingleField('showAvatar', e.currentTarget.checked)} />显示照片</label><input type="file" id="avatarFileInput" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={e => { const file = e.target.files?.[0]; if (file) handleAvatarFile(file); }} /></div>
                  <label className="basic-field"><span>工作年限</span><select className="field-input" value={modData.workYears || '不填'} onChange={e => updateSingleField('workYears', e.currentTarget.value)}><option>不填</option><option>应届生</option><option>1年以下</option><option>1-3年</option><option>3-5年</option><option>5-10年</option><option>10年以上</option></select></label>
                  <label className="basic-field"><span>联系电话</span><input className="field-input" value={modData.phone || ''} onChange={e => updateSingleField('phone', e.currentTarget.value)} /></label>
                  <label className="basic-field"><span>联系邮箱</span><input className="field-input" value={modData.email || ''} onChange={e => updateSingleField('email', e.currentTarget.value)} /></label>
                  <label className="basic-field"><span>婚姻状况</span><select className="field-input" value={modData.maritalStatus || '不填'} onChange={e => updateSingleField('maritalStatus', e.currentTarget.value)}><option>不填</option><option>未婚</option><option>已婚</option></select></label>
                  <label className="basic-field basic-split"><span>身高/体重</span><input className="field-input" placeholder="身高" value={modData.height || ''} onChange={e => updateSingleField('height', e.currentTarget.value)} /><em>cm</em><input className="field-input" placeholder="体重" value={modData.weight || ''} onChange={e => updateSingleField('weight', e.currentTarget.value)} /><em>kg</em></label>
                  <label className="basic-field"><span>民族</span><input className="field-input" placeholder="请输入民族" value={modData.ethnicity || ''} onChange={e => updateSingleField('ethnicity', e.currentTarget.value)} /></label>
                  <label className="basic-field"><span>籍贯</span><input className="field-input" placeholder="请输入籍贯" value={modData.nativePlace || ''} onChange={e => updateSingleField('nativePlace', e.currentTarget.value)} /></label>
                  <label className="basic-field"><span>政治面貌</span><select className="field-input" value={modData.politicalStatus || '不填'} onChange={e => updateSingleField('politicalStatus', e.currentTarget.value)}><option>不填</option><option>中共党员</option><option>中共预备党员</option><option>共青团员</option><option>群众</option><option>其他</option></select></label>
                </div>
                <div className="basic-more-row"><span></span><button className="basic-more-btn">收起更多信息</button><span></span></div>
                <div className="basic-arrival-row"><label className="basic-field"><span>可到岗时间</span><input className="field-input" value={modData.arrivalTime || ''} onChange={e => updateSingleField('arrivalTime', e.currentTarget.value)} /></label></div>
                <div className="basic-custom-row">
                  {(modData.customInfos || []).map((item: any, index: number) => (
                    <div className="basic-custom-item" key={item.id || index}>
                      <input className="field-input" placeholder="信息名称，例如：姓名" value={item.label || ''} onChange={e => { const customInfos = [...(modData.customInfos || [])]; customInfos[index] = { ...item, label: e.currentTarget.value }; updateSingleField('customInfos', customInfos); }} />
                      <span>:</span>
                      <input className="field-input" placeholder="信息内容，例如：张三" value={item.value || ''} onChange={e => { const customInfos = [...(modData.customInfos || [])]; customInfos[index] = { ...item, value: e.currentTarget.value }; updateSingleField('customInfos', customInfos); }} />
                      <button className="basic-remove-btn" onClick={() => { const customInfos = [...(modData.customInfos || [])]; customInfos.splice(index, 1); updateSingleField('customInfos', customInfos); }}>-</button>
                    </div>
                  ))}
                  <button className="basic-add-custom" onClick={() => updateSingleField('customInfos', [...(modData.customInfos || []), { id: id(), label: '', value: '' }])}>+ 添加自定义信息</button>
                </div>
              </div>
            )}
            {def.single && def.id !== 'basicInfo' && (
              <div className="exp-card">
                {/* Avatar upload for basicInfo */}
                {def.hasAvatar && (
                  <div className="avatar-upload">
                    <div className="avatar-circle" onClick={() => { const inp = document.getElementById('avatarFileInput') as HTMLInputElement; inp?.click(); }}
                      onDragOver={e => { e.preventDefault(); }}
                      onDrop={e => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) handleAvatarFile(file); }}>
                      {modData.avatar ? <img src={modData.avatar} alt="avatar" /> : <span style={{ fontSize: 24, color: 'var(--border2)' }}>+</span>}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>个人头像</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>拖拽或点击上传，支持 JPG/PNG</div>
                      <input type="file" id="avatarFileInput" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
                        onChange={e => { const file = e.target.files?.[0]; if (file) handleAvatarFile(file); }} />
                      {modData.avatar && <button className="tool-btn" style={{ fontSize: 10, color: '#ef4444' }} onClick={() => saveAndUpdate(activeModule, { ...modData, avatar: '' })}>移除头像</button>}
                    </div>
                  </div>
                )}
                {def.fieldGroups ? def.fieldGroups.map((group, gi) => (
                  <details key={gi} className="field-group" open={gi === 0}>
                    <summary>{group.label}</summary>
                    <div className="field-group-body">
                      {group.fields.map((fk, fi) => {
                        const f = def.fields.find(x => x.key === fk); if (!f) return null;
                        if (f.type === 'textarea') return <div key={f.key} className="field-row textarea-row"><span className="field-label">{f.label}</span><RichTextEditor value={modData[f.key] || ''} placeholder={`请输入${f.label || '内容'}`} onChange={html => updateSingleField(f.key, html)} /></div>;
                        if (fi % 2 === 0) return <div key={f.key} className="field-row"><span className="field-label">{f.label}</span><input type="text" className="field-input half" id={'editData_' + f.key} value={modData[f.key] || ''} onChange={e => updateSingleField(f.key, e.currentTarget.value)} /></div>;
                        return <span key={f.key} style={{ marginRight: 8 }}><input type="text" className="field-input half" id={'editData_' + f.key} value={modData[f.key] || ''} onChange={e => updateSingleField(f.key, e.currentTarget.value)} /></span>;
                      })}
                    </div>
                  </details>
                )) : def.fields.map(f => (
                  <div key={f.key} className="field-row">{f.label && <span className="field-label">{f.label}</span>}
                    {f.type === 'textarea' ? <RichTextEditor value={modData[f.key] || ''} placeholder={`请输入${f.label || '内容'}`} onChange={html => updateSingleField(f.key, html)} />
                    : f.type === 'select' ? <select className="field-input half" id={'editData_' + f.key} value={modData[f.key] || ''} onChange={e => updateSingleField(f.key, e.currentTarget.value)}>{f.opts?.map(o => <option key={o} value={o}>{o}</option>)}</select>
                      : f.type === 'month' ? <input type="text" className="field-input half" id={'editData_' + f.key} placeholder="例如 2022.07" value={modData[f.key] || ''} onChange={e => updateSingleField(f.key, e.currentTarget.value)} />
                        : <input type="text" className="field-input half" id={'editData_' + f.key} value={modData[f.key] || ''} onChange={e => updateSingleField(f.key, e.currentTarget.value)} />}
                  </div>
                ))}
              </div>
            )}
            {def.multi && (
              <div>
                {(Array.isArray(modData) && modData.length ? modData : [createEmptyEntry(def)]).map((entry: any, idx: number) => (
                  (() => {
                    const descriptionText = entry.description || (entry.bullets || [])
                      .map((b: any) => stripHtml(b.html || '').trim())
                      .filter(Boolean)
                      .join('\n');
                    return <div key={entry.id || idx} className="exp-card experience-editor-row"
                    onDragOver={e => { e.preventDefault(); }}
                    onDrop={e => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('drag-over');
                      const from = parseInt(e.dataTransfer.getData('cardIdx'));
                      const to = idx;
                      if (from !== to && !isNaN(from)) {
                        const arr = [...modData];
                        const [moved] = arr.splice(from, 1);
                        arr.splice(to, 0, moved);
                        saveAndUpdate(activeModule, arr);
                      }
                    }}
                    onDragEnter={e => { e.currentTarget.classList.add('drag-over'); }}
                    onDragLeave={e => { e.currentTarget.classList.remove('drag-over'); }}>
                    <button
                      type="button"
                      className="experience-drag-handle"
                      title="拖动排序"
                      draggable
                      onDragStart={e => {
                        e.dataTransfer.setData('cardIdx', String(idx));
                        e.dataTransfer.effectAllowed = 'move';
                        (e.currentTarget.closest('.experience-editor-row') as HTMLElement | null)?.classList.add('dragging');
                      }}
                      onDragEnd={() => {
                        document.querySelectorAll('.experience-editor-row').forEach(el => el.classList.remove('dragging', 'drag-over'));
                      }}>
                      ⋮⋮
                    </button>
                    <div className="experience-editor-main">
                      <div className="experience-field-line">
                        {def.fields.filter(f => f.type !== 'textarea' && f.type !== 'checkbox').map(f => (
                          <span key={f.key} className={`experience-field-item field-${f.key}`}>
                            {f.label && f.type !== 'month-end' && <span className="field-label">{f.label}</span>}
                            {f.type === 'month' ? <input type="text" className="field-input half" id={`entry_${idx}_${f.key}`} placeholder="例如 2022.07" defaultValue={entry[f.key]} onChange={e => updateEntryField(idx, f.key, e.currentTarget.value)} />
                              : f.type === 'month-end' ? <span className="date-row"><span className="date-sep">-</span><input type="text" className="field-input date" placeholder="例如 2024.06" id={`entry_${idx}_${f.key}`} defaultValue={entry[f.key]} onChange={e => updateEntryField(idx, f.key, e.currentTarget.value)} /></span>
                                : f.type === 'select' ? <select className="field-input half" id={`entry_${idx}_${f.key}`} defaultValue={entry[f.key]} onChange={e => updateEntryField(idx, f.key, e.currentTarget.value)}>{f.opts?.map(o => <option key={o} value={o}>{o}</option>)}</select>
                                  : <input type="text" className="field-input half" id={`entry_${idx}_${f.key}`} placeholder={`请输入${f.label || '内容'}`} defaultValue={entry[f.key]} onChange={e => updateEntryField(idx, f.key, e.currentTarget.value)} />}
                          </span>
                        ))}
                        {def.fields.filter(f => f.type === 'checkbox').map(f => (
                          <label key={f.key} className="current-checkbox">
                            <input type="checkbox" id={`entry_${idx}_${f.key}`} defaultChecked={entry[f.key]} onChange={e => updateEntryField(idx, f.key, e.currentTarget.checked)} />{f.label}
                          </label>
                        ))}
                      </div>
                      {def.fields.filter(f => f.type === 'textarea').map(f => (
                        <div key={f.key} className="field-row textarea-row experience-description-row">
                          <RichTextEditor
                            value={descriptionText}
                            placeholder={`${activeModuleTitle}的描述与目标岗位的招聘要求尽量匹配，突出个人成果以及做出的贡献，尽量具体简洁。`}
                            onChange={html => updateEntryField(idx, f.key, html)}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="experience-actions">
                      <button className="btn-move" disabled={!Array.isArray(modData) || modData.length <= 1} onClick={() => {
                        const arr = Array.isArray(modData) ? [...modData] : [];
                        const target = idx === 0 ? idx + 1 : idx - 1;
                        if (!arr[target]) return;
                        [arr[idx], arr[target]] = [arr[target], arr[idx]];
                        saveAndUpdate(activeModule, arr);
                      }}>{idx === 0 ? '下移' : '上移'}</button>
                      <button className="btn-del-outline" onClick={() => { const arr = Array.isArray(modData) ? [...modData] : []; arr.splice(idx, 1); saveAndUpdate(activeModule, arr); }}>删除</button>
                    </div>
                  </div>;
                  })()
                ))}
                <button className="add-btn" onClick={() => {
                  const arr = Array.isArray(modData) ? [...modData] : [];
                  arr.push(createEmptyEntry(def));
                  saveAndUpdate(activeModule, arr);
                  if (data.moduleVisibility[activeModule] === false) dispatch({ type: 'TOGGLE_MODULE_VISIBILITY', id: activeModule });
                }}>+ 添加{activeModuleTitle}</button>
              </div>
            )}
          </>)}
        </div>

      </div>

      {/* Compare Overlay */}
      {showCompare && (
        <div className="compare-overlay" onClick={e => { if (e.target === e.currentTarget) setShowCompare(false); }}>
          <div className="compare-modal" style={{ position: 'relative' }}>
            <button className="close-btn" onClick={() => setShowCompare(false)}>×</button>
            <h3>对比模板</h3><p className="ats-subtitle">点击切换模板，实时预览</p>
            <div className="compare-grid">
              {TEMPLATES.map(t => (
                <div key={t.id} className={`compare-card ${t.id === data.templateId ? 'active' : ''}`}
                  onClick={() => { dispatch({ type: 'SET_TEMPLATE', templateId: t.id }); setShowCompare(false); }}>
                  <div className="compare-card-header">{t.name}</div>
                  <div className="compare-preview">
                    <div style={{ transform: 'scale(0.25)', transformOrigin: 'top center', width: '210mm' }}
                      dangerouslySetInnerHTML={{ __html: renderResumeHTML({ ...data, templateId: t.id }) }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ATS Overlay */}
      {showATS && (
        <div className="ats-overlay" onClick={e => { if (e.target === e.currentTarget) setShowATS(false); }}>
          <div className="ats-modal">
            <button className="close-btn" onClick={() => setShowATS(false)}>×</button>
            <h3>ATS 兼容性检测</h3><p className="ats-subtitle">评估简历被招聘系统解析的能力</p>
            <div className="ats-score" style={{ position: 'relative', width: 100, height: 100, margin: '0 auto 16px' }}>
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle className="bg" cx="50" cy="50" r="40" />
                <circle className="fg" cx="50" cy="50" r="40" stroke={atsResults.score >= 80 ? '#10b981' : atsResults.score >= 60 ? '#d97706' : '#ef4444'}
                  strokeDasharray={2 * Math.PI * 40} strokeDashoffset={(2 * Math.PI * 40) - (atsResults.score / 100) * (2 * Math.PI * 40)} />
              </svg>
              <span className="ats-score-num" style={{ color: atsResults.score >= 80 ? '#10b981' : atsResults.score >= 60 ? '#d97706' : '#ef4444' }}>{atsResults.score}</span>
            </div>
            <ul className="ats-items">
              {atsResults.items.map((item, i) => (
                <li key={i}><span className={`ats-icon ${item.status}`}>{item.status === 'pass' ? '✓' : item.status === 'warn' ? '!' : '✗'}</span><span>{item.text}</span></li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper for skill categories
function getCategorySkills(cat: string): string[] {
  const map: Record<string, string[]> = {
    '前端': ['React', 'Vue', 'TypeScript', 'CSS3', 'HTML5', 'Next.js', 'Tailwind CSS'],
    '后端': ['Node.js', 'Python', 'Java', 'Go', 'RESTful API', 'GraphQL'],
    '数据库': ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQL'],
    'DevOps': ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Nginx', 'Git'],
    '设计': ['Figma', 'Sketch', 'Adobe XD', 'UI设计', 'UX研究', '原型设计'],
    '语言': ['英语CET-6', '普通话二级甲等', '日语N2'],
    '软技能': ['项目管理', '团队协作', '沟通表达', '数据分析', '用户研究'],
  };
  return map[cat] || [];
}
