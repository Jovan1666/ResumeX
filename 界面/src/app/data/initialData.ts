import { ResumeData } from "@/app/types/resume";

export const initialResumeData: ResumeData = {
  id: "default-resume",
  title: "我的简历",
  lastModified: Date.now(),
  template: 'tech',
  settings: {
    themeColor: 'tech-orange',
    fontFamily: 'sans',
    fontSizeScale: 1,
    lineHeight: 'standard',
    pageMargin: 'standard',
    language: 'zh'
  },
  profile: {
    name: "李明",
    title: "高级全栈工程师",
    email: "liming@example.com",
    phone: "138 0000 0000",
    location: "北京",
    website: "github.com/liming",
    wechat: "liming_dev",
    avatar: "",
    summary: "拥有5年互联网开发经验，擅长React、Node.js及云原生架构。主导过千万级用户产品的核心模块重构，提升系统性能40%。热衷于开源社区，具备良好的团队管理能力。"
  },
  modules: [
    {
      id: "exp-1",
      type: "experience",
      title: "工作经历",
      visible: true,
      items: [
        {
          id: "job-1",
          title: "高级前端开发专家",
          subtitle: "××科技 - 研发部",
          date: "2021.03 - 至今",
          description: "• 负责公司核心产品Web端架构设计与开发，日均PV过亿。\n• 搭建基于Rust的构建工具链，构建速度提升300%。\n• 建立团队Code Review机制与技术分享会，提升团队代码质量。",
          location: "北京"
        },
        {
          id: "job-2",
          title: "全栈工程师",
          subtitle: "××集团 - 产品技术部",
          date: "2018.07 - 2021.02",
          description: "• 参与公司核心小程序基础库开发，优化渲染性能。\n• 负责企业管理后台Web端的Node.js中间层建设。\n• 获得2019年度优秀员工奖。",
          location: "深圳"
        }
      ]
    },
    {
      id: "proj-1",
      type: "projects",
      title: "项目经历",
      visible: true,
      items: [
        {
          id: "prj-1",
          title: "React可视化搭建平台",
          subtitle: "个人开源项目",
          date: "2022.01 - 2022.06",
          description: "• 这是一个支持拖拽生成的低代码平台，Github Star 2k+。\n• 实现了组件动态加载、属性配置器及代码出码功能。\n• 技术栈：React, TypeScript, Dnd-kit, TailwindCSS。"
        }
      ]
    },
    {
      id: "edu-1",
      type: "education",
      title: "教育背景",
      visible: true,
      items: [
        {
          id: "edu-item-1",
          title: "计算机科学与技术 / 本科",
          subtitle: "××大学",
          date: "2014.09 - 2018.06",
          description: "GPA: 3.8/4.0，多次获得校一等奖学金。主修课程：数据结构、操作系统、计算机网络。",
          location: "杭州"
        }
      ]
    },
    {
      id: "skills-1",
      type: "skills",
      title: "技能特长",
      visible: true,
      items: [
        { id: "sk-1", name: "React / Vue" },
        { id: "sk-2", name: "TypeScript" },
        { id: "sk-3", name: "Node.js / NestJS" },
        { id: "sk-4", name: "微前端架构" },
        { id: "sk-5", name: "Docker / K8s" },
        { id: "sk-6", name: "性能优化" },
        { id: "sk-7", name: "英语流利" }
      ]
    }
  ]
};
