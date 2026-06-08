import { ResumeData } from './types';
import { MODULE_DEFS } from './modules';
import { nanoid } from 'nanoid';

const id = () => nanoid(8);

export function createDefaultData(): ResumeData {
  return {
    templateId: 'simple', themeColor: '#10b981',
    fontFamily: 'Noto Sans SC, PingFang SC, Microsoft YaHei, sans-serif',
    pageMargin: 'normal', moduleSpacing: 'normal', lineHeight: 'normal',
    compressOnePage: false,
    moduleOrder: MODULE_DEFS.map(m => m.id),
    moduleVisibility: {},
    modules: {
      basicInfo: { name: '张三', gender: '男', birthDate: '1998-06', phone: '138-0000-8888', email: 'zhangsan@example.com', wechat: 'zhangsan_wx', city: '北京', workYears: '3-5年', highestDegree: '本科', politicalStatus: '中共党员', jobStatus: '在职-考虑机会', homepage: 'github.com/zhangsan', avatar: '' },
      jobTarget: { position: '产品经理', city: '北京', salary: '15-20K' },
      selfEvaluation: { content: '3年互联网产品经验，擅长用户增长与数据分析，主导过多款百万级用户产品从0到1的全流程。' },
      education: [{ id: id(), school: '北京大学', degree: '本科', major: '计算机科学与技术', startDate: '2018-09', endDate: '2022-06', gpa: '3.8/4.0', description: '主修课程：数据结构、算法设计、操作系统、数据库原理' }],
      workExperience: [
        { id: id(), company: '字节跳动', position: '产品经理', startDate: '2022-07', endDate: '', isCurrent: true, bullets: [{ id: id(), html: '负责短视频创作者工具的产品设计与迭代，<b>DAU提升35%</b>' }], description: '' },
        { id: id(), company: '美团', position: '产品实习生', startDate: '2021-06', endDate: '2021-09', isCurrent: false, bullets: [{ id: id(), html: '参与商家端后台功能优化，收集并分析用户反馈' }], description: '' }
      ],
      internship: [], projects: [{ id: id(), name: '智能推荐系统', role: '产品负责人', startDate: '2023-01', endDate: '2023-06', bullets: [{ id: id(), html: '设计个性化推荐策略，<b>点击率提升28%</b>' }], link: '' }],
      campusActivity: [], organization: [], socialPractice: [],
      awards: [{ id: id(), name: '全国大学生数学建模竞赛一等奖', level: '国家级', date: '2020-11' }],
      skills: { items: ['产品设计', '数据分析', 'SQL', 'Figma', 'Axure', 'A/B测试', '用户研究', '项目管理'] },
      certificates: [{ id: id(), name: 'PMP项目管理专业人士认证', issuer: 'PMI', date: '2023-05' }],
      languages: [{ id: id(), name: '英语', level: '熟练', score: 'CET-6 580' }],
      competitions: [], overseas: [], research: [], portfolio: [], custom: []
    }
  };
}

export function initVisibility(data: ResumeData) {
  const vis: Record<string, boolean> = {};
  MODULE_DEFS.forEach(m => {
    if (m.required) { vis[m.id] = true; return; }
    const d = (data.modules as any)[m.id];
    if (!d) { vis[m.id] = false; return; }
    if (Array.isArray(d)) { vis[m.id] = d.length > 0; }
    else if (d.items && d.items.length > 0) { vis[m.id] = true; }
    else if (typeof d === 'object') { vis[m.id] = Object.values(d).some(v => v && String(v).trim()); }
    else { vis[m.id] = false; }
  });
  data.moduleVisibility = vis;
}
