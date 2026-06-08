import { ResumeData, ModuleDef } from './types';
import { MODULE_DEFS } from './modules';

function esc(s: string): string {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function fmtDate(ym: string): string {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  return y + '.' + m;
}
function fmtRange(s: string, e: string, c?: boolean): string {
  const a = fmtDate(s);
  if (c) return a + ' - 至今';
  const b = fmtDate(e);
  return b ? a + ' - ' + b : a;
}

function sectionTitle(t: string): string {
  return `<div class="section-title">${t}</div>`;
}

export function renderResumeHTML(data: ResumeData): string {
  const tid = data.templateId || 'simple';
  const acc = data.themeColor || '#10b981';
  const accLight = acc + '20';
  const font = data.fontFamily || 'Noto Sans SC, PingFang SC, Microsoft YaHei, sans-serif';
  const order = data.moduleOrder;
  const vis = data.moduleVisibility;
  const mods = data.modules;
  const bi = mods.basicInfo || { name: '', gender: '', birthDate: '', phone: '', email: '', wechat: '', city: '', workYears: '', highestDegree: '', politicalStatus: '', jobStatus: '', homepage: '', avatar: '' };
  
  const contacts = [bi.phone, bi.email, bi.wechat, bi.city, bi.homepage].filter(Boolean);
  const infoParts = [bi.gender, bi.workYears, bi.highestDegree, bi.politicalStatus, bi.jobStatus].filter(Boolean);
  const infoLine = infoParts.join(' | ');
  const jtObj = mods.jobTarget || { position: '', city: '', salary: '' };
  const jtText = [jtObj.position, jtObj.city, jtObj.salary].filter(Boolean).join(' · ');

  if (tid === 'business') return renderBusiness(data, bi, contacts, infoLine, acc, font, order, vis, mods);
  if (tid === 'modern') return renderModern(data, bi, contacts, infoLine, acc, accLight, font, order, vis, mods);
  if (tid === 'creative') return renderCreative(data, bi, contacts, infoLine, acc, accLight, font, order, vis, mods);
  if (tid === 'academic') return renderAcademic(data, bi, contacts, infoLine, acc, font, order, vis, mods);
  if (tid === 'minimal') return renderMinimal(data, bi, contacts, infoLine, acc, font, order, vis, mods);
  if (tid === 'tech') return renderTech(data, bi, contacts, infoLine, acc, font, order, vis, mods);
  if (tid === 'bold') return renderBold(data, bi, contacts, infoLine, acc, font, order, vis, mods);
  return renderSimple(data, bi, contacts, infoLine, acc, accLight, font, order, vis, mods);
}

function visMod(id: string, order: string[], vis: Record<string, boolean>): boolean {
  return order.includes(id) && vis[id] !== false;
}

function renderContent(modId: string, mods: any, def: ModuleDef | undefined): string {
  const data = mods[modId];
  if (!data) return '';
  if (modId === 'selfEvaluation') { if (!data.content?.trim()) return ''; return `<div class="single-text">${esc(data.content)}</div>`; }
  if (modId === 'skills') { if (!data.items?.length) return ''; return `<div class="skills-tags">${data.items.map((s: string) => `<span class="skill-tag-resume">${esc(s)}</span>`).join('')}</div>`; }
  if (modId === 'languages') { if (!Array.isArray(data) || !data.length) return ''; return data.map((l: any) => `<div class="cert-item"><span><strong>${esc(l.name)}</strong> — ${esc(l.level)}${l.score ? ' (' + esc(l.score) + ')' : ''}</span></div>`).join(''); }
  if (modId === 'certificates') { if (!Array.isArray(data) || !data.length) return ''; return data.map((c: any) => `<div class="cert-item"><span><strong>${esc(c.name)}</strong>${c.issuer ? ' — ' + esc(c.issuer) : ''}</span><span class="c-date">${fmtDate(c.date)}</span></div>`).join(''); }
  if (modId === 'awards') { if (!Array.isArray(data) || !data.length) return ''; return data.map((a: any) => `<div class="cert-item"><span><strong>${esc(a.name)}</strong>${a.level ? ' — ' + esc(a.level) : ''}</span><span class="c-date">${fmtDate(a.date)}</span></div>`).join(''); }
  if (modId === 'education') { if (!Array.isArray(data) || !data.length) return ''; return data.map((e: any) => `<div class="entry"><div class="entry-header"><span class="entry-title">${esc(e.school)}</span><span class="entry-date">${fmtRange(e.startDate, e.endDate)}</span></div><div class="entry-subtitle">${esc(e.degree)} · ${esc(e.major)}${e.gpa ? ' · GPA ' + esc(e.gpa) : ''}</div>${e.description ? `<div class="entry-desc">${esc(e.description)}</div>` : ''}</div>`).join(''); }
  if (['workExperience', 'internship', 'projects', 'campusActivity', 'organization', 'socialPractice'].includes(modId)) {
    if (!Array.isArray(data) || !data.length) return '';
    return data.map((e: any) => {
      const org = e.company || e.name || '';
      const title = e.position || e.role || '';
      let desc = e.description || '';
      if (e.bullets?.length) desc = e.bullets.map((b: any) => '• ' + b.html.replace(/<[^>]+>/g, '')).join('\n');
      return `<div class="entry"><div class="entry-header"><span class="entry-title">${esc(org)}</span><span class="entry-date">${fmtRange(e.startDate, e.endDate, e.isCurrent)}</span></div><div class="entry-subtitle">${esc(title)}</div>${desc ? `<div class="entry-desc">${esc(desc)}</div>` : ''}${e.link ? `<div class="entry-link">${esc(e.link)}</div>` : ''}</div>`;
    }).join('');
  }
  return '';
}

function renderSimple(data: ResumeData, bi: any, contacts: string[], infoLine: string, acc: string, accLight: string, font: string, order: string[], vis: Record<string, boolean>, mods: any): string {
  const style = `--accent:${acc};--accent-light:${accLight};font-family:${font}`;
  let h = `<div class="resume" style="${style}"><div class="resume-inner">`;
  h += `<div class="${bi.avatar ? 'resume-header-avatar' : 'resume-header'}">`;
  if (bi.avatar) h += `<img class="avatar-img" src="${bi.avatar}" alt="avatar"><div class="header-text">`;
  h += `<div class="resume-name">${esc(bi.name) || '姓名'}</div>`;
  if (infoLine) h += `<div class="info-line">${esc(infoLine)}</div>`;
  if (mods.jobTarget?.position) h += `<div class="job-target">求职意向：${esc([mods.jobTarget.position, mods.jobTarget.city, mods.jobTarget.salary].filter(Boolean).join(' · '))}</div>`;
  h += `<div class="resume-contact">${contacts.map(c => `<span>${esc(c)}</span>`).join('<span class="sep">|</span>')}</div>`;
  if (bi.avatar) h += `</div>`;
  h += `</div>`;
  for (const modId of order) {
    if (!visMod(modId, order, vis) || modId === 'basicInfo') continue;
    const def = MODULE_DEFS.find(m => m.id === modId);
    const content = renderContent(modId, mods, def);
    if (content) h += `<div class="resume-section">${sectionTitle(def?.name || '')}${content}</div>`;
  }
  h += `</div></div>`;
  return h;
}

function renderBusiness(data: ResumeData, bi: any, contacts: string[], infoLine: string, acc: string, font: string, order: string[], vis: Record<string, boolean>, mods: any): string {
  const style = `--accent:${acc};font-family:${font}`;
  let h = `<div class="resume" style="${style}"><div class="resume-inner biz-layout">`;
  h += `<div class="resume-sidebar"><div class="sidebar-name">${esc(bi.name) || '姓名'}</div>`;
  if (infoLine) h += `<div class="sidebar-info">${esc(infoLine)}</div>`;
  if (mods.jobTarget?.position) h += `<div class="sidebar-job">${esc([mods.jobTarget.position, mods.jobTarget.city, mods.jobTarget.salary].filter(Boolean).join(' · '))}</div>`;
  const sidebarIds = new Set(['selfEvaluation', 'skills', 'certificates', 'languages', 'awards']);
  for (const modId of order) {
    if (!sidebarIds.has(modId) || !visMod(modId, order, vis)) continue;
    const def = MODULE_DEFS.find(m => m.id === modId);
    const content = renderContent(modId, mods, def);
    if (content) h += `${sectionTitle(def?.name || '')}${content}`;
  }
  h += sectionTitle('联系方式');
  h += contacts.map(c => `<div class="contact-item">${esc(c)}</div>`).join('');
  h += `</div><div class="resume-main">`;
  const mainIds = new Set(['education', 'workExperience', 'internship', 'projects', 'campusActivity', 'organization', 'socialPractice', 'competitions', 'overseas', 'research', 'portfolio', 'custom']);
  for (const modId of order) {
    if (!mainIds.has(modId) || !visMod(modId, order, vis)) continue;
    const def = MODULE_DEFS.find(m => m.id === modId);
    const content = renderContent(modId, mods, def);
    if (content) h += `<div class="resume-section">${sectionTitle(def?.name || '')}${content}</div>`;
  }
  h += `</div></div></div>`;
  return h;
}

function renderModern(data: ResumeData, bi: any, contacts: string[], infoLine: string, acc: string, accLight: string, font: string, order: string[], vis: Record<string, boolean>, mods: any): string {
  const style = `--accent:${acc};--accent-light:${accLight};font-family:${font}`;
  let h = `<div class="resume" style="${style}"><div class="resume-inner">`;
  h += `<div class="resume-header mod-header">`;
  if (bi.avatar) h += `<img class="avatar-img mod-avatar" src="${bi.avatar}" alt="avatar">`;
  h += `<div><div class="resume-name mod-name">${esc(bi.name) || '姓名'}</div>`;
  if (infoLine) h += `<div class="mod-info">${esc(infoLine)}</div>`;
  if (mods.jobTarget?.position) h += `<div class="mod-job">${esc([mods.jobTarget.position, mods.jobTarget.city, mods.jobTarget.salary].filter(Boolean).join(' · '))}</div>`;
  h += `<div class="resume-contact mod-contact">${contacts.map(c => `<span>${esc(c)}</span>`).join('<span class="sep">|</span>')}</div></div>`;
  h += `</div>`;
  for (const modId of order) {
    if (!visMod(modId, order, vis) || modId === 'basicInfo') continue;
    const def = MODULE_DEFS.find(m => m.id === modId);
    const content = renderContent(modId, mods, def);
    if (content) h += `<div class="resume-section">${sectionTitle(def?.name || '')}${content}</div>`;
  }
  h += `</div></div>`;
  return h;
}

function renderCreative(data: ResumeData, bi: any, contacts: string[], infoLine: string, acc: string, accLight: string, font: string, order: string[], vis: Record<string, boolean>, mods: any): string {
  const style = `--accent:${acc};--accent-light:${accLight};font-family:${font}`;
  let h = `<div class="resume" style="${style}"><div class="resume-inner">`;
  h += `<div class="creative-header">`;
  if (bi.avatar) h += `<img class="creative-avatar" src="${bi.avatar}" alt="avatar">`;
  h += `<div class="creative-header-info"><div class="resume-name">${esc(bi.name) || '姓名'}</div>`;
  if (infoLine) h += `<div class="creative-info">${esc(infoLine)}</div>`;
  if (mods.jobTarget?.position) h += `<div class="creative-job">求职意向：${esc([mods.jobTarget.position, mods.jobTarget.city, mods.jobTarget.salary].filter(Boolean).join(' · '))}</div>`;
  h += `<div class="resume-contact">${contacts.map(c => `<span>${esc(c)}</span>`).join('<span class="sep">|</span>')}</div></div></div>`;
  for (const modId of order) {
    if (!visMod(modId, order, vis) || modId === 'basicInfo') continue;
    const def = MODULE_DEFS.find(m => m.id === modId);
    const content = renderContent(modId, mods, def);
    if (content) h += `<div class="resume-section"><div class="section-title creative-ttl">${def?.name || ''}</div>${content}</div>`;
  }
  h += `</div></div>`;
  return h;
}

function renderAcademic(data: ResumeData, bi: any, contacts: string[], infoLine: string, acc: string, font: string, order: string[], vis: Record<string, boolean>, mods: any): string {
  const style = `--accent:${acc};font-family:${font}`;
  let h = `<div class="resume" style="${style}"><div class="resume-inner">`;
  h += `<div class="academic-header"><div class="resume-name">${esc(bi.name) || '姓名'}</div>`;
  if (infoLine) h += `<div class="academic-info">${esc(infoLine)}</div>`;
  if (mods.jobTarget?.position) h += `<div class="academic-job">${esc([mods.jobTarget.position, mods.jobTarget.city, mods.jobTarget.salary].filter(Boolean).join(' · '))}</div>`;
  h += `<div class="resume-contact">${contacts.map(c => `<span>${esc(c)}</span>`).join('<span class="sep">|</span>')}</div></div>`;
  for (const modId of order) {
    if (!visMod(modId, order, vis) || modId === 'basicInfo') continue;
    const def = MODULE_DEFS.find(m => m.id === modId);
    const content = renderContent(modId, mods, def);
    if (content) h += `<div class="resume-section">${sectionTitle(def?.name || '')}${content}</div>`;
  }
  h += `</div></div>`;
  return h;
}

function renderMinimal(data: ResumeData, bi: any, contacts: string[], infoLine: string, acc: string, font: string, order: string[], vis: Record<string, boolean>, mods: any): string {
  const style = `--accent:${acc};font-family:${font}`;
  let h = `<div class="resume" style="${style}"><div class="resume-inner" style="padding:25mm 22mm">`;
  h += `<div class="minimal-header"><div class="resume-name" style="font-size:20pt;font-weight:300;letter-spacing:4px;margin-bottom:8px">${esc(bi.name) || '姓名'}</div>`;
  h += `<div class="resume-contact" style="gap:8px 24px">${contacts.map(c => `<span>${esc(c)}</span>`).join('')}</div></div>`;
  for (const modId of order) {
    if (!visMod(modId, order, vis) || modId === 'basicInfo') continue;
    const def = MODULE_DEFS.find(m => m.id === modId);
    const content = renderContent(modId, mods, def);
    if (content) h += `<div class="resume-section"><div class="section-title" style="border-bottom:0;font-size:10pt;text-transform:uppercase;letter-spacing:3px;color:#94a3b8;margin-bottom:14px">${def?.name || ''}</div>${content}</div>`;
  }
  h += `</div></div>`;
  return h;
}

function renderTech(data: ResumeData, bi: any, contacts: string[], infoLine: string, acc: string, font: string, order: string[], vis: Record<string, boolean>, mods: any): string {
  const style = `--accent:${acc};font-family:'JetBrains Mono','Fira Code',monospace`;
  let h = `<div class="resume" style="${style}"><div class="resume-inner">`;
  h += `<div style="border-bottom:1px solid #cbd5e1;padding-bottom:12px;margin-bottom:16px">`;
  h += `<div class="resume-name" style="font-size:22pt;font-weight:600;color:#0f172a">${esc(bi.name) || '姓名'}</div>`;
  h += `<div style="font-size:10pt;color:#64748b">${contacts.map(c => esc(c)).join(' | ')}</div></div>`;
  for (const modId of order) {
    if (!visMod(modId, order, vis) || modId === 'basicInfo') continue;
    const def = MODULE_DEFS.find(m => m.id === modId);
    const content = renderContent(modId, mods, def);
    if (content) h += `<div class="resume-section"><div class="section-title" style="font-family:monospace;color:var(--accent);border-bottom-color:#e2e8f0">${def?.name || ''}</div>${content}</div>`;
  }
  h += `</div></div>`;
  return h;
}

function renderBold(data: ResumeData, bi: any, contacts: string[], infoLine: string, acc: string, font: string, order: string[], vis: Record<string, boolean>, mods: any): string {
  const style = `--accent:${acc};font-family:${font}`;
  let h = `<div class="resume" style="${style}"><div class="resume-inner" style="padding:0">`;
  h += `<div style="background:#0f172a;color:white;padding:22mm 18mm 14mm">`;
  h += `<div class="resume-name" style="font-size:28pt;font-weight:900;color:white">${esc(bi.name) || '姓名'}</div>`;
  if (infoLine) h += `<div style="font-size:11pt;opacity:0.8;margin-top:4px">${esc(infoLine)}</div>`;
  h += `<div style="font-size:10pt;margin-top:8px;opacity:0.7">${contacts.map(c => esc(c)).join(' · ')}</div>`;
  h += `</div><div style="padding:16mm 18mm 20mm">`;
  for (const modId of order) {
    if (!visMod(modId, order, vis) || modId === 'basicInfo') continue;
    const def = MODULE_DEFS.find(m => m.id === modId);
    const content = renderContent(modId, mods, def);
    if (content) h += `<div class="resume-section"><div class="section-title">${def?.name || ''}</div>${content}</div>`;
  }
  h += `</div></div></div>`;
  return h;
}
