import { ResumeData } from "@/app/types/resume";

/**
 * 创建一份「空白简历」：个人信息全空（禁止李明），
 * 默认模板 campusClean + 主题 campus（02 §5.1 / §5.4）。
 * 模块只保留空的基本骨架，由 QuickStart 或用户自行添加。
 */
export function emptyResumeData(): ResumeData {
  return {
    id: "",
    title: "未命名简历",
    lastModified: Date.now(),
    template: 'campusClean',
    settings: {
      themeColor: 'campus',
      fontFamily: 'sans',
      fontSizeScale: 1,
      lineHeight: 'standard',
      pageMargin: 'standard',
      language: 'zh'
    },
    profile: {
      name: "",
      title: "",
      email: "",
      phone: "",
      location: "",
      website: "",
      wechat: "",
      avatar: "",
      summary: "",
      customFields: [],
    },
    modules: [
      {
        id: "edu-1",
        type: "education",
        title: "教育背景",
        visible: true,
        items: [],
      },
      {
        id: "exp-1",
        type: "experience",
        title: "工作经历",
        visible: true,
        items: [],
      },
      {
        id: "proj-1",
        type: "projects",
        title: "项目经历",
        visible: true,
        items: [],
      },
      {
        id: "skills-1",
        type: "skills",
        title: "专业技能",
        visible: true,
        items: [],
      }
    ],
  };
}

/** 供程序内部使用（比如测试）；不再直接作为 store 初始数据 */
export const initialResumeData: ResumeData = emptyResumeData();
