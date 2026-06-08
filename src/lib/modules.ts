import { ModuleDef } from './types';

export const MODULE_DEFS: ModuleDef[] = [
  { id: 'basicInfo', name: '基本信息', icon: '', required: true, single: true, hasAvatar: true,
    fieldGroups: [
      { label: '身份信息', fields: ['name','gender','birthDate'] },
      { label: '联系方式', fields: ['phone','email','wechat','homepage'] },
      { label: '求职背景', fields: ['city','workYears','highestDegree','politicalStatus','jobStatus'] }
    ],
    fields: [
      { key: 'name', label: '姓名', type: 'text', w: 'half' },
      { key: 'gender', label: '性别', type: 'select', opts: ['','男','女'], w: 'half' },
      { key: 'birthDate', label: '出生日期', type: 'month', w: 'half' },
      { key: 'phone', label: '手机', type: 'text', w: 'half' },
      { key: 'email', label: '邮箱', type: 'text', w: 'wide' },
      { key: 'wechat', label: '微信', type: 'text', w: 'half' },
      { key: 'city', label: '所在城市', type: 'text', w: 'half' },
      { key: 'workYears', label: '工作年限', type: 'select', opts: ['','应届生','1年以下','1-3年','3-5年','5-10年','10年以上'], w: 'half' },
      { key: 'highestDegree', label: '最高学历', type: 'select', opts: ['','博士','硕士','本科','专科','高中及以下'], w: 'half' },
      { key: 'politicalStatus', label: '政治面貌', type: 'select', opts: ['','中共党员','中共预备党员','共青团员','群众','其他'], w: 'half' },
      { key: 'jobStatus', label: '求职状态', type: 'select', opts: ['','在职-考虑机会','离职-快速到岗','应届生','在校-实习'], w: 'half' },
      { key: 'homepage', label: '个人主页', type: 'text', w: 'wide' }
    ]
  },
  { id: 'jobTarget', name: '求职意向', icon: '', single: true,
    fields: [
      { key: 'position', label: '期望职位', type: 'text', w: 'wide' },
      { key: 'city', label: '期望城市', type: 'text', w: 'half' },
      { key: 'salary', label: '期望薪资', type: 'text', w: 'half' }
    ]
  },
  { id: 'selfEvaluation', name: '自我评价', icon: '', single: true, isTextarea: true,
    fields: [{ key: 'content', label: '自我评价', type: 'textarea' }]
  },
  { id: 'education', name: '教育经历', icon: '', multi: true,
    fields: [
      { key: 'school', label: '学校', type: 'text', w: 'wide' },
      { key: 'degree', label: '学历', type: 'select', opts: ['本科','硕士','博士','专科','其他'], w: 'half' },
      { key: 'major', label: '专业', type: 'text', w: 'half' },
      { key: 'startDate', label: '起止时间', type: 'month', w: 'date' },
      { key: 'endDate', label: '', type: 'month-end', w: 'date' },
      { key: 'gpa', label: 'GPA/排名', type: 'text', w: 'half' },
      { key: 'description', label: '在校经历', type: 'textarea', w: 'full' }
    ]
  },
  { id: 'workExperience', name: '工作经历', icon: '', multi: true, hasBullets: true,
    fields: [
      { key: 'company', label: '公司', type: 'text', w: 'wide' },
      { key: 'position', label: '岗位', type: 'text', w: 'half' },
      { key: 'startDate', label: '起止时间', type: 'month', w: 'date' },
      { key: 'endDate', label: '', type: 'month-end', w: 'date' },
      { key: 'isCurrent', label: '至今', type: 'checkbox' }
    ]
  },
  { id: 'projects', name: '项目经历', icon: '', multi: true, hasBullets: true,
    fields: [
      { key: 'name', label: '项目名称', type: 'text', w: 'wide' },
      { key: 'role', label: '担任角色', type: 'text', w: 'half' },
      { key: 'startDate', label: '起止时间', type: 'month', w: 'date' },
      { key: 'endDate', label: '', type: 'month-end', w: 'date' },
      { key: 'link', label: '项目链接', type: 'text', w: 'half' }
    ]
  },
  { id: 'skills', name: '技能特长', icon: '', single: true, isSkills: true, fields: [] },
  { id: 'certificates', name: '资格证书', icon: '', multi: true,
    fields: [
      { key: 'name', label: '证书名称', type: 'text', w: 'wide' },
      { key: 'issuer', label: '颁发机构', type: 'text', w: 'half' },
      { key: 'date', label: '获得时间', type: 'month', w: 'half' }
    ]
  },
  { id: 'languages', name: '语言能力', icon: '', multi: true,
    fields: [
      { key: 'name', label: '语言', type: 'select', opts: ['英语','日语','韩语','法语','德语','西班牙语','其他'], w: 'half' },
      { key: 'level', label: '水平', type: 'select', opts: ['母语','精通','熟练','良好','基础'], w: 'half' },
      { key: 'score', label: '考试成绩', type: 'text', w: 'half', placeholder: '如 CET-6 580' }
    ]
  },
  { id: 'awards', name: '获奖经历', icon: '', multi: true,
    fields: [
      { key: 'name', label: '奖项名称', type: 'text', w: 'xwide' },
      { key: 'level', label: '获奖级别', type: 'select', opts: ['国家级','省部级','校级','院级','其他'], w: 'half' },
      { key: 'date', label: '获奖时间', type: 'month', w: 'half' }
    ]
  },
  { id: 'competitions', name: '竞赛经历', icon: '', multi: true,
    fields: [
      { key: 'name', label: '竞赛名称', type: 'text', w: 'wide' },
      { key: 'level', label: '竞赛级别', type: 'select', opts: ['国家级','省部级','校级','其他'], w: 'half' },
      { key: 'date', label: '参赛时间', type: 'month', w: 'half' },
      { key: 'description', label: '描述/获奖情况', type: 'textarea', w: 'full' }
    ]
  },
  { id: 'internship', name: '实习经历', icon: '', multi: true, hasBullets: true,
    fields: [
      { key: 'company', label: '公司', type: 'text', w: 'wide' },
      { key: 'position', label: '岗位', type: 'text', w: 'half' },
      { key: 'startDate', label: '起止时间', type: 'month', w: 'date' },
      { key: 'endDate', label: '', type: 'month-end', w: 'date' },
      { key: 'description', label: '实习描述', type: 'textarea', w: 'full' }
    ]
  },
  { id: 'campusActivity', name: '校园经历', icon: '', multi: true, hasBullets: true,
    fields: [
      { key: 'name', label: '组织/社团', type: 'text', w: 'wide' },
      { key: 'role', label: '担任角色', type: 'text', w: 'half' },
      { key: 'startDate', label: '起止时间', type: 'month', w: 'date' },
      { key: 'endDate', label: '', type: 'month-end', w: 'date' }
    ]
  },
];
