'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { TEMPLATES, SUGGESTIONS, SUGGEST_ROLES } from '@/lib/templates';
import { MODULE_DEFS } from '@/lib/modules';
import { renderResumeHTML } from '@/lib/renderer';
import { parseMarkdown } from '@/lib/markdown';
import { createDefaultData, initVisibility } from '@/lib/defaults';
import { nanoid } from 'nanoid';

const id = () => nanoid(8);
function esc(s: string) { return s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : ''; }
function showToast(msg: string) { const e = document.querySelector('.toast'); if (e) e.remove(); const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2500); }

function formatDate(ym: string) { if (!ym) return ''; const [y, m] = ym.split('-'); return y + '.' + m; }

export default function Home() {
  const { state, dispatch } = useStore();
  const { data, activeModule, view, zoom, darkMode, resumes, currentId } = state;
  const [showCompare, setShowCompare] = useState(false);
  const [showATS, setShowATS] = useState(false);
  const [atsResults, setATSResults] = useState<{ score: number; items: { status: string; text: string }[] }>({ score: 0, items: [] });
  const [selectedSuggestRole, setSelectedSuggestRole] = useState('');
  const [editingName, setEditingName] = useState('');
  const [previewCache, setPreviewCache] = useState<Record<string, string>>({});

  const previewRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  
  // Drag resize handler for controls area
  useEffect(() => {
    const divider = document.querySelector('.drag-divider');
    const controls = controlsRef.current;
    if (!divider || !controls) return;
    let dragging = false, startY = 0, startH = 0;
    const onDown = (e: Event) => { dragging = true; divider.classList.add('dragging'); const me = e as MouseEvent; startY = me.clientY; startH = controls.offsetHeight; };
    const onMove = (e: Event) => { if (!dragging) return; const me = e as MouseEvent; const dy = startY - me.clientY; const newH = Math.max(120, Math.min(window.innerHeight * 0.7, startH + dy)); controls.style.height = newH + 'px'; };
    const onUp = () => { dragging = false; divider.classList.remove('dragging'); };
    divider.addEventListener('mousedown', onDown);
    divider.addEventListener('touchstart', onDown, { passive: false });
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
    return () => { divider.removeEventListener('mousedown', onDown); divider.removeEventListener('touchstart', onDown); window.removeEventListener('mousemove', onMove); window.removeEventListener('touchmove', onMove); window.removeEventListener('mouseup', onUp); window.removeEventListener('touchend', onUp); };
  }, [view]);


  const def = MODULE_DEFS.find(m => m.id === activeModule);
  const modData = (data.modules as any)[activeModule];
  const currentResume = resumes.find(r => r.id === currentId);

  useEffect(() => { if (previewRef.current) previewRef.current.innerHTML = renderResumeHTML(data); }, [data]);

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

  
// Wrap resume HTML into a complete document for iframe preview
function wrapPreviewDoc(html: string, tid: string): string {
  const css = `
.resume{width:210mm;min-height:297mm;font-size:11pt;line-height:1.6;color:#1e293b;background:white;font-family:"Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif}
.resume-inner{padding:20mm 18mm}
.resume-name{font-size:24pt;font-weight:700;letter-spacing:2px;margin-bottom:4px}
.resume-contact{display:flex;justify-content:center;flex-wrap:wrap;gap:4px 16px;font-size:10pt;color:#475569}
.resume-section{margin-top:16px}
.section-title{font-size:13pt;font-weight:700;padding-bottom:4px;border-bottom:1.5px solid #10b981;margin-bottom:10px;letter-spacing:1px}
.resume-header-avatar{display:flex;align-items:flex-start;gap:14px}
.avatar-img{width:25mm;height:33mm;object-fit:cover;border-radius:3px;flex-shrink:0}
.entry{margin-bottom:10px}.entry-header{display:flex;justify-content:space-between;flex-wrap:wrap}
.entry-title{font-weight:600;font-size:11pt}.entry-subtitle{font-size:10.5pt;color:#475569}
.entry-date{font-size:10pt;color:#64748b;white-space:nowrap}.entry-desc{font-size:10pt;margin-top:4px;color:#334155;white-space:pre-wrap}
.skills-tags{display:flex;flex-wrap:wrap;gap:6px}.skill-tag-resume{font-size:10pt;padding:2px 10px;background:#f1f5f9;border-radius:100px}
.cert-item{font-size:10pt;padding:2px 0;display:flex;justify-content:space-between}.single-text{font-size:10pt;color:#334155;white-space:pre-wrap}
.c-date{font-size:10pt;color:#64748b}
.info-line{font-size:10pt;color:#475569}
.job-target{font-size:11pt;color:#64748b;margin-bottom:6px}
.sep{opacity:0.3;margin:0 2px}
.biz-layout{display:flex;padding:0}
.resume-sidebar{width:32%;background:#1e3a5f;color:#e2e8f0;padding:12mm 6mm}
.resume-sidebar .section-title{color:white;border-bottom-color:rgba(255,255,255,0.2)}
.resume-sidebar .skill-tag-resume{background:rgba(255,255,255,0.15)}
.resume-sidebar .sidebar-name{font-size:20pt;font-weight:700;color:white;margin-bottom:4px}
.resume-sidebar .contact-item{font-size:9pt;margin-bottom:2px}
.resume-main{flex:1;padding:12mm 10mm}
.resume-main .section-title{color:#1e3a5f;border-bottom-color:#1e3a5f}
.mod-header{background:#1e293b;color:white;padding:18px 20px;display:flex;align-items:center;gap:14px}
.mod-header .mod-name,.mod-header .resume-name{color:white}
.mod-info,.mod-job{font-size:10pt;opacity:0.8}
.mod-contact{font-size:9.5pt;opacity:0.85;justify-content:flex-start}
.mod-avatar{width:22mm;height:28mm;border-radius:50%;border:2px solid rgba(255,255,255,0.3);flex-shrink:0}
.creative-header{display:flex;align-items:center;gap:20px;padding:0 0 16px;border-bottom:2px solid #10b981;margin-bottom:16px}
.creative-avatar{width:28mm;height:35mm;object-fit:cover;border-radius:6px;flex-shrink:0}
.creative-ttl{display:inline-block;padding:6px 12px;background:#d1fae5;color:#059669;border-radius:4px;border-bottom:none;font-size:12pt}
.academic-header{text-align:center;padding-bottom:14px;border-bottom:2px solid #1e293b;margin-bottom:18px}
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
      <div className="home-page">
        <div className="home-header" style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Resu<span>Me</span></h1>
            <p>管理你的多份简历</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="tool-btn" onClick={() => { dispatch({ type: 'SET_DARK_MODE', value: !darkMode }); }}>
              {darkMode ? '☀️ 浅色' : '🌙 深色'}
            </button>
            <button className="tool-btn accent" onClick={() => dispatch({ type: 'NEW_RESUME' })}>+ 新建简历</button>
            <button className="tool-btn" onClick={() => { const d = createDefaultData(); initVisibility(d); d.templateId = data.templateId; dispatch({ type: 'IMPORT_RESUME', data: d }); dispatch({ type: 'SET_VIEW', view: 'editor' }); }}>选择模板</button>
          </div>
        </div>
        {resumes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>
            <p>还没有简历，点击上方按钮创建第一份</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {resumes.map(r => (
              <div key={r.id} className="exp-card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', cursor: 'pointer' }}
                onClick={() => dispatch({ type: 'SELECT_RESUME', id: r.id })}>
                <div style={{ width: 60, height: 80, background: 'var(--surface2)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, color: 'var(--text3)' }}>
                  {r.templateId}
                </div>
                <div style={{ flex: 1 }}>
                  {editingName === r.id ? (
                    <input className="field-input wide" defaultValue={r.name} autoFocus
                      onBlur={() => setEditingName('')}
                      onKeyDown={e => { if (e.key === 'Enter') { dispatch({ type: 'RENAME_RESUME', id: r.id, name: e.currentTarget.value }); setEditingName(''); } }} />
                  ) : (
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{r.name || '未命名'}</h3>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
                    模板：{TEMPLATES.find(t => t.id === r.templateId)?.name || r.templateId} · 更新于 {new Date(r.updatedAt).toLocaleDateString('zh-CN')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                  <button className="tool-btn" onClick={() => setEditingName(r.id)}>✏️</button>
                  <button className="tool-btn" onClick={() => dispatch({ type: 'DUPLICATE_RESUME', id: r.id })}>📋</button>
                  <button className="tool-btn" style={{ color: '#ef4444' }} onClick={() => { if (confirm('确定删除？')) dispatch({ type: 'DELETE_RESUME', id: r.id }); }}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ========== HOME (Template Selection) ==========
  if (view === 'home') {
    return (
      <div className="home-page">
        {/* Hero Section */}
        <div className="home-header" style={{ paddingTop: 60, paddingBottom: 48 }}>
          <h1 style={{ fontSize: 48, fontWeight: 900, letterSpacing: -2, lineHeight: 1.1, marginBottom: 16 }}>
            一份<span>好简历</span><br />打开职业大门
          </h1>
          <p style={{ fontSize: 18, color: 'var(--text2)', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
            免费在线简历编辑器 — 多套专业模板 · 实时预览 · ATS 检测 · 一键导出 PDF
          </p>
          <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="tool-btn" onClick={() => { dispatch({ type: 'SET_DARK_MODE', value: !darkMode }); }}>
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button className="tool-btn accent" style={{ padding: '8px 20px', fontSize: 14, fontWeight: 600 }}
              onClick={() => { dispatch({ type: 'NEW_RESUME' }); }}>
              ✨ 开始制作简历
            </button>
            {resumes.length > 0 && (
              <button className="tool-btn" style={{ padding: '8px 20px', fontSize: 14 }} onClick={() => dispatch({ type: 'LOAD_RESUMES' })}>
                📂 我的简历 ({resumes.length})
              </button>
            )}
          </div>
        </div>

        {/* Feature highlights */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 48 }}>
          {[
            { icon: '📝', title: '8 套专业模板', desc: '覆盖互联网、金融、学术等全行业风格' },
            { icon: '🎨', title: '自由组合模块', desc: '拖拽排序，13 种简历模块随心搭配' },
            { icon: '🔍', title: 'ATS 兼容检测', desc: '8 维度智能评分，确保通过机筛' },
            { icon: '📄', title: '高清 PDF 导出', desc: '一键生成 A4 标准简历，打印无压力' },
          ].map(f => (
            <div key={f.title} style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '20px 16px', textAlign: 'center', boxShadow: 'var(--shadow)' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>{f.icon}</div>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 4px' }}>{f.title}</h3>
              <p style={{ fontSize: 12, color: 'var(--text2)', margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Template Grid */}
        <h2 style={{ fontSize: 20, fontWeight: 700, textAlign: 'center', marginBottom: 24 }}>选择模板开始制作</h2>
        <div className="template-grid">
          {TEMPLATES.map(t => (
            <div key={t.id} className="template-card" onClick={() => { dispatch({ type: 'SET_TEMPLATE', templateId: t.id }); dispatch({ type: 'SET_VIEW', view: 'editor' }); }}>
              <div className="template-preview" style={{ height: 260 }}>
                {previewCache[t.id] ? (
                  <iframe srcDoc={wrapPreviewDoc(previewCache[t.id], t.id)}
                    style={{ width: '100%', height: '100%', border: 'none', transform: 'scale(0.32)', transformOrigin: 'top center' }}
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
      if (mods.workExperience.some((w: any) => w.bullets?.length)) items.push({ status: 'pass', text: '工作经历包含详细描述' });
      else { items.push({ status: 'warn', text: '建议添加工作描述' }); score -= 5; }
    } else { items.push({ status: 'warn', text: '工作经历为空' }); score -= 10; }
    if (vis.skills !== false && mods.skills?.items?.length > 3) items.push({ status: 'pass', text: '技能充足' });
    else if (mods.skills?.items?.length > 0) { items.push({ status: 'warn', text: '技能较少' }); score -= 5; }
    else { items.push({ status: 'warn', text: '技能为空' }); score -= 8; }
    if (bi.avatar) { items.push({ status: 'warn', text: '头像图片（ATS无法解析）' }); score -= 3; } else items.push({ status: 'pass', text: '无头像（ATS友好）' });
    if (['business', 'modern', 'creative'].includes(data.templateId)) { items.push({ status: 'warn', text: '复杂布局可能影响ATS' }); score -= 3; } else items.push({ status: 'pass', text: '简洁布局（ATS友好）' });
    setATSResults({ score: Math.max(0, Math.min(100, score)), items }); setShowATS(true);
  };

  const insertSuggestion = (text: string) => {
    if (!def?.multi) return;
    const entries = Array.isArray(modData) ? [...modData] : [];
    if (!entries.length) { showToast('请先添加一条记录'); return; }
    const last = entries[entries.length - 1];
    if (!last.bullets) last.bullets = [];
    last.bullets.push({ id: id(), html: text });
    saveAndUpdate(activeModule, entries);
    showToast('已插入');
  };

  const collectFormData = () => {
    if (!def) return; const panel = document.getElementById('editorPanel'); if (!panel) return;
    if (def.isSkills) { const tags = panel.querySelectorAll('.skill-tag'); const items = Array.from(tags).map(t => t.textContent?.replace('×', '').trim()).filter(Boolean); saveAndUpdate(activeModule, { items }); return; }
    if (def.isTextarea) { const ta = panel.querySelector('textarea') as HTMLTextAreaElement; if (ta) saveAndUpdate(activeModule, { content: ta.value }); return; }
    if (def.single) { const obj: any = {}; def.fields.forEach(f => { const el = panel.querySelector('#editData_' + f.key) as HTMLInputElement; if (el) obj[f.key] = f.type === 'checkbox' ? (el as any).checked : el.value; }); saveAndUpdate(activeModule, obj); return; }
    if (def.multi) { const entries: any[] = []; const cards = panel.querySelectorAll('.exp-card'); cards.forEach((card, i) => { const entry: any = { id: modData[i]?.id || id() }; def.fields.forEach(f => { const el = card.querySelector('#entry_' + i + '_' + f.key) as HTMLInputElement; if (el) entry[f.key] = f.type === 'checkbox' ? (el as any).checked : el.value; }); if (def.hasBullets) { const bullets: { id: string; html: string }[] = []; const bulletEls = card.querySelectorAll('.bullet-item span[contenteditable]'); bulletEls.forEach(b => { const html = b.innerHTML; if (html.trim()) bullets.push({ id: id(), html }); }); entry.bullets = bullets; } entries.push(entry); }); saveAndUpdate(activeModule, entries); }
  };

  return (
    <div className="editor-page">
      {/* Tool Bar */}
      <div className="tool-bar">
        <button className="tool-btn" onClick={() => dispatch({ type: 'SET_VIEW', view: resumes.length > 0 ? 'dashboard' : 'home' })}>← 返回</button>
        <select value={data.templateId} onChange={e => dispatch({ type: 'SET_TEMPLATE', templateId: e.target.value })}>
          {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={data.fontFamily} onChange={e => dispatch({ type: 'SET_FONT', font: e.target.value })}>
          <option value="Noto Sans SC, PingFang SC, Microsoft YaHei, sans-serif">思源黑体</option>
          <option value="SimSun, STSong, Noto Serif SC, serif">宋体</option>
          <option value="KaiTi, STKaiti, serif">楷体</option>
          <option value="JetBrains Mono, Fira Code, monospace">等宽字体</option>
        </select>
        <input type="color" value={data.themeColor} onChange={e => dispatch({ type: 'SET_THEME_COLOR', color: e.target.value })} />
        <button className="tool-btn" onClick={() => setShowCompare(true)}>对比</button>
        <button className="tool-btn" onClick={handleExportJSON}>📤</button>
        <button className="tool-btn" onClick={handleImportJSON}>📥</button>
        <button className="tool-btn" onClick={handleATS}>🔍 ATS</button>
        <button className="tool-btn" onClick={() => dispatch({ type: 'SET_DARK_MODE', value: !darkMode })} title={darkMode ? '浅色模式' : '深色模式'}>
          {darkMode ? '☀️' : '🌙'}
        </button>
        <span className="spacer" />
        <span style={{ fontSize: 11, color: 'var(--text2)', marginRight: 8 }}>{currentResume?.name || '简历'}</span>
        <span className="save-status saved">已保存</span>
        <button className="tool-btn accent" onClick={handleExportPDF}>下载 PDF</button>
        <button className="tool-btn" onClick={handleExportHTML}>HTML</button>
      </div>

      {/* Preview */}
      <div className="main-content">
        <div className="preview-panel">
          <div>
            <div className="preview-wrapper" style={{ width: 794 * zoom, height: 1123 * zoom }}>
              <div ref={previewRef} style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }} />
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
            return (
              <div key={mid}
                className={`mod-tab ${mid === activeModule ? 'active' : ''} ${!on ? 'hidden-mod' : ''}`}
                onClick={() => dispatch({ type: 'SET_ACTIVE_MODULE', id: mid })}>
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
                <span className="mod-tab-label">{d.name}</span>
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
            <div className="section-header">{def.name}</div>
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
                      <span key={cat} className="suggest-chip" onClick={() => { const items = [...(modData.items || []), ...getCategorySkills(cat).filter((s: string) => !modData.items?.includes(s))]; saveAndUpdate(activeModule, { items }); }}>{cat}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {def.isTextarea && (
              <div>
                <textarea className="single-textarea" id="editData_content" defaultValue={modData.content || ''} />
                {modData.content && <div className="suggest-panel" style={{ marginTop: 8 }}><h4>📝 预览</h4><div style={{ fontSize: 13, lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: parseMarkdown(modData.content) }} /></div>}
              </div>
            )}
            {def.single && (
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
                  <details key={gi} open={gi === 0}>
                    <summary style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', cursor: 'pointer', padding: '4px 0' }}>{group.label}</summary>
                    <div style={{ padding: '8px 0' }}>
                      {group.fields.map((fk, fi) => {
                        const f = def.fields.find(x => x.key === fk); if (!f) return null;
                        if (f.type === 'textarea') return <div key={f.key} className="field-row"><span className="field-label">{f.label}</span><input type="text" className="field-input full" id={'editData_' + f.key} defaultValue={modData[f.key]} /></div>;
                        if (fi % 2 === 0) return <div key={f.key} className="field-row"><span className="field-label">{f.label}</span><input type="text" className="field-input half" id={'editData_' + f.key} defaultValue={modData[f.key]} /></div>;
                        return <span key={f.key} style={{ marginRight: 8 }}><input type="text" className="field-input half" id={'editData_' + f.key} defaultValue={modData[f.key]} /></span>;
                      })}
                    </div>
                  </details>
                )) : def.fields.map(f => (
                  <div key={f.key} className="field-row">{f.label && <span className="field-label">{f.label}</span>}
                    {f.type === 'select' ? <select className="field-input half" id={'editData_' + f.key} defaultValue={modData[f.key]}>{f.opts?.map(o => <option key={o} value={o}>{o}</option>)}</select>
                      : f.type === 'month' ? <input type="month" className="field-input half" id={'editData_' + f.key} defaultValue={modData[f.key]} />
                        : <input type="text" className="field-input half" id={'editData_' + f.key} defaultValue={modData[f.key]} />}
                  </div>
                ))}
              </div>
            )}
            {def.multi && (
              <div>
                {(Array.isArray(modData) ? modData : []).map((entry: any, idx: number) => (
                  <div key={entry.id || idx} className="exp-card" draggable
                    onDragStart={e => { e.dataTransfer.setData('cardIdx', String(idx)); (e.currentTarget as HTMLElement).style.opacity = '0.4'; }}
                    onDragEnd={e => { (e.currentTarget as HTMLElement).style.opacity = ''; }}
                    onDragOver={e => { e.preventDefault(); }}
                    onDrop={e => {
                      e.preventDefault();
                      const from = parseInt(e.dataTransfer.getData('cardIdx'));
                      const to = idx;
                      if (from !== to && !isNaN(from)) {
                        const arr = [...modData];
                        const [moved] = arr.splice(from, 1);
                        arr.splice(to, 0, moved);
                        saveAndUpdate(activeModule, arr);
                      }
                    }}>
                    <div className="card-header-row">
                      <span style={{ color: 'var(--text3)', fontSize: 12 }}>#{idx + 1} {entry.company || entry.name || ''}</span>
                      <div className="card-actions">
                        <button className="btn-up" disabled={idx === 0} onClick={() => { const arr = [...modData]; [arr[idx], arr[idx - 1]] = [arr[idx - 1], arr[idx]]; saveAndUpdate(activeModule, arr); }}>↑</button>
                        <button className="btn-down" disabled={idx === modData.length - 1} onClick={() => { const arr = [...modData]; [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]]; saveAndUpdate(activeModule, arr); }}>↓</button>
                        <button className="btn-del" onClick={() => { const arr = [...modData]; arr.splice(idx, 1); saveAndUpdate(activeModule, arr); }}>×</button>
                      </div>
                    </div>
                    <div className="field-row">
                      {def.fields.filter(f => f.type !== 'textarea' && f.type !== 'checkbox').map(f => (
                        <span key={f.key}>{f.label && f.type !== 'month-end' && <span className="field-label">{f.label}</span>}
                          {f.type === 'month' ? <input type="month" className="field-input half" id={`entry_${idx}_${f.key}`} defaultValue={entry[f.key]} />
                            : f.type === 'month-end' ? <span className="date-row"><span className="date-sep">-</span><input type="month" className="field-input date" id={`entry_${idx}_${f.key}`} defaultValue={entry[f.key]} /></span>
                              : f.type === 'select' ? <select className="field-input half" id={`entry_${idx}_${f.key}`} defaultValue={entry[f.key]}>{f.opts?.map(o => <option key={o} value={o}>{o}</option>)}</select>
                                : <input type="text" className="field-input half" id={`entry_${idx}_${f.key}`} defaultValue={entry[f.key]} />}
                        </span>
                      ))}
                      {def.fields.filter(f => f.type === 'checkbox').map(f => (
                        <label key={f.key} style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                          <input type="checkbox" id={`entry_${idx}_${f.key}`} defaultChecked={entry[f.key]} />{f.label}
                        </label>
                      ))}
                    </div>
                    {def.hasBullets && (
                      <div>
                        <div className="bullet-editor">
                          {(entry.bullets || []).map((b: any, bi: number) => (
                            <div key={bi} className="bullet-item">
                              <span className="bullet-dot">•</span>
                              <span contentEditable suppressContentEditableWarning onBlur={collectFormData} onInput={() => { if (typeof window !== 'undefined') (window as any).__bulletDirty = true; }} dangerouslySetInnerHTML={{ __html: b.html || '' }} />
                            </div>
                          ))}
                          <div className="bullet-item">
                            <span className="bullet-dot" style={{ color: 'var(--text3)' }}>•</span>
                            <span contentEditable suppressContentEditableWarning style={{ color: 'var(--text3)' }} onBlur={collectFormData} />
                          </div>
                        </div>
                        {/* Markdown preview for description */}
                        {entry.description && (
                          <div className="suggest-panel" style={{ borderTop: 'none', borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
                            <div style={{ fontSize: 13, lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: parseMarkdown(entry.description) }} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                <button className="add-btn" onClick={() => {
                  const arr = Array.isArray(modData) ? [...modData] : [];
                  const ne: any = { id: id() }; def.fields.forEach(f => { ne[f.key] = f.type === 'checkbox' ? false : ''; });
                  if (def.hasBullets) ne.bullets = [];
                  arr.push(ne);
                  saveAndUpdate(activeModule, arr);
                  if (data.moduleVisibility[activeModule] === false) dispatch({ type: 'TOGGLE_MODULE_VISIBILITY', id: activeModule });
                }}>+ 添加{def.name}</button>
                {def.hasBullets && (
                  <div className="suggest-panel">
                    <h4>💡 内容建议</h4>
                    <div className="suggest-chips">
                      {SUGGEST_ROLES.map(r => <span key={r.key} className={`suggest-chip ${selectedSuggestRole === r.key ? 'active' : ''}`}
                        onClick={() => setSelectedSuggestRole(selectedSuggestRole === r.key ? '' : r.key)}>{r.label}</span>)}
                    </div>
                    {selectedSuggestRole && SUGGESTIONS[selectedSuggestRole] && (
                      <div>{SUGGESTIONS[selectedSuggestRole].map((text, i) => <div key={i} className="suggest-bullet" onClick={() => insertSuggestion(text)}><span>+</span><span>{text}</span></div>)}</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>)}
        </div>

        <div className="bottom-bar">
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
          <div className="spacer" />
          <label style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
            <input type="checkbox" checked={data.compressOnePage} onChange={e => dispatch({ type: 'TOGGLE_COMPRESS', value: e.target.checked })} />压缩至一页
          </label>
          <button className="tool-btn" onClick={() => { if (confirm('确定重置？')) dispatch({ type: 'RESET' }); }}>重置</button>
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
