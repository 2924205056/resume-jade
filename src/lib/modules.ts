import { ModuleDef } from './types';

export const MODULE_DEFS: ModuleDef[] = [
  { id: 'basicInfo', name: '基本信息', icon: '', required: true, single: true, hasAvatar: true,
    fields: [
      { key: 'name', label: '您的姓名', type: 'text', w: 'half' },
      { key: 'gender', label: '性别', type: 'select', opts: ['不填','男','女'], w: 'half' },
      { key: 'birthDate', label: '出生年月', type: 'month', w: 'half' },
      { key: 'workYears', label: '工作年限', type: 'select', opts: ['不填','应届生','1年以下','1-3年','3-5年','5-10年','10年以上'], w: 'half' },
      { key: 'phone', label: '联系电话', type: 'text', w: 'half' },
      { key: 'email', label: '联系邮箱', type: 'text', w: 'wide' },
      { key: 'maritalStatus', label: '婚姻状况', type: 'select', opts: ['不填','未婚','已婚'], w: 'half' },
      { key: 'height', label: '身高', type: 'text', w: 'half' },
      { key: 'weight', label: '体重', type: 'text', w: 'half' },
      { key: 'ethnicity', label: '民族', type: 'text', w: 'half' },
      { key: 'nativePlace', label: '籍贯', type: 'text', w: 'half' },
      { key: 'politicalStatus', label: '政治面貌', type: 'select', opts: ['不填','中共党员','中共预备党员','共青团员','群众','其他'], w: 'half' },
      { key: 'arrivalTime', label: '可到岗时间', type: 'text', w: 'half' }
    ]
  },
  { id: 'jobTarget', name: '求职意向', icon: '', single: true,
    fields: [
      { key: 'position', label: '期望职位', type: 'text', w: 'wide' },
      { key: 'city', label: '期望城市', type: 'text', w: 'half' },
      { key: 'salary', label: '期望薪资', type: 'text', w: 'half' }
    ]
  },
  { id: 'examInfo', name: '报考信息', icon: '', single: true,
    fields: [
      { key: 'target', label: '报考方向', type: 'text', w: 'wide' },
      { key: 'school', label: '目标院校', type: 'text', w: 'half' },
      { key: 'major', label: '目标专业', type: 'text', w: 'half' }
    ]
  },
  { id: 'education', name: '教育背景', icon: '', multi: true,
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
      { key: 'company', label: '公司名称', type: 'text', w: 'wide' },
      { key: 'position', label: '职位', type: 'text', w: 'half' },
      { key: 'startDate', label: '工作时间', type: 'month', w: 'date' },
      { key: 'endDate', label: '', type: 'month-end', w: 'date' },
      { key: 'isCurrent', label: '至今', type: 'checkbox' },
      { key: 'description', label: '工作描述', type: 'textarea', w: 'full' }
    ]
  },
  { id: 'projects', name: '项目经验', icon: '', multi: true, hasBullets: true,
    fields: [
      { key: 'name', label: '项目名称', type: 'text', w: 'wide' },
      { key: 'role', label: '担任角色', type: 'text', w: 'half' },
      { key: 'startDate', label: '起止时间', type: 'month', w: 'date' },
      { key: 'endDate', label: '', type: 'month-end', w: 'date' },
      { key: 'link', label: '项目链接', type: 'text', w: 'half' },
      { key: 'description', label: '项目描述', type: 'textarea', w: 'full' }
    ]
  },
  { id: 'skills', name: '技能特长', icon: '', single: true, isSkills: true, fields: [] },
  { id: 'certificates', name: '荣誉证书', icon: '', multi: true,
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
  { id: 'internship', name: '实习经验', icon: '', multi: true, hasBullets: true,
    fields: [
      { key: 'company', label: '公司名称', type: 'text', w: 'wide' },
      { key: 'position', label: '职位', type: 'text', w: 'half' },
      { key: 'startDate', label: '实习时间', type: 'month', w: 'date' },
      { key: 'endDate', label: '', type: 'month-end', w: 'date' },
      { key: 'isCurrent', label: '至今', type: 'checkbox' },
      { key: 'description', label: '实习描述', type: 'textarea', w: 'full' }
    ]
  },
  { id: 'campusActivity', name: '校园经历', icon: '', multi: true, hasBullets: true,
    fields: [
      { key: 'name', label: '组织/社团', type: 'text', w: 'wide' },
      { key: 'role', label: '担任角色', type: 'text', w: 'half' },
      { key: 'startDate', label: '起止时间', type: 'month', w: 'date' },
      { key: 'endDate', label: '', type: 'month-end', w: 'date' },
      { key: 'description', label: '经历描述', type: 'textarea', w: 'full' }
    ]
  },
  { id: 'selfEvaluation', name: '自我评价', icon: '', single: true, isTextarea: true,
    fields: [{ key: 'content', label: '自我评价', type: 'textarea' }]
  },
  { id: 'interests', name: '兴趣爱好', icon: '', single: true, isTextarea: true,
    fields: [{ key: 'content', label: '兴趣爱好', type: 'textarea' }]
  },
  { id: 'custom', name: '自定义...', icon: '', single: true,
    fields: [
      { key: 'title', label: '信息名称', type: 'text', w: 'half' },
      { key: 'content', label: '信息内容', type: 'textarea', w: 'full' }
    ]
  },
];
