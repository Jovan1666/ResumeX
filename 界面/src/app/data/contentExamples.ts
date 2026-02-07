import { ModuleType } from '@/app/types/resume';

export interface ContentExample {
  category: string;
  examples: string[];
}

// 工作经历参考范文
const experienceExamples: ContentExample[] = [
  {
    category: '前端开发',
    examples: [
      '• 负责公司核心产品Web端开发，基于React + TypeScript构建，日均PV超过500万\n• 主导前端工程化改造，引入Vite构建工具链，构建速度提升200%\n• 封装20+通用业务组件，建立组件文档，团队开发效率提升30%',
      '• 独立负责H5活动页面开发，累计完成50+活动页，平均转化率提升15%\n• 优化首屏加载性能，LCP从3.2s降低至1.1s，Core Web Vitals全部达标\n• 参与微前端架构迁移，将单体应用拆分为6个子应用，部署效率提升400%',
    ],
  },
  {
    category: '后端开发',
    examples: [
      '• 负责订单系统核心模块开发，支撑日均100万+订单处理，系统可用性99.99%\n• 设计并实现分布式缓存方案，将核心接口响应时间从200ms降至30ms\n• 主导数据库优化，通过SQL调优和索引优化，慢查询减少90%',
      '• 基于Spring Cloud搭建微服务架构，拆分10+服务，支持弹性扩缩容\n• 开发统一日志收集平台，接入ELK全链路追踪，故障定位效率提升80%\n• 设计消息队列异步处理方案，系统吞吐量从500QPS提升至5000QPS',
    ],
  },
  {
    category: '产品经理',
    examples: [
      '• 负责公司旗舰产品从0到1的规划与落地，上线6个月用户突破50万\n• 通过数据分析发现核心转化漏斗瓶颈，优化注册流程后转化率提升25%\n• 主导3次大版本迭代，协调研发、设计、运营团队共15人，准时交付率100%',
      '• 负责B端SaaS产品需求调研与方案设计，累计服务200+企业客户\n• 建立用户反馈闭环机制，NPS评分从30提升至65\n• 编写PRD文档50+，建立需求管理规范，需求变更率降低40%',
    ],
  },
  {
    category: '运营',
    examples: [
      '• 负责公众号/短视频/社交媒体全渠道内容运营，粉丝总量从5万增长至50万\n• 策划并执行线上活动20+场，单场最高参与人数10万，ROI达到1:8\n• 搭建用户分层运营体系，高价值用户留存率提升35%',
      '• 负责APP用户增长策略制定与执行，月新增用户从2万提升至10万\n• 建立数据监控体系，每日产出运营日报，驱动决策优化\n• 策划裂变活动，单次活动带来3万+新用户，获客成本降低60%',
    ],
  },
  {
    category: '销售/商务',
    examples: [
      '• 负责华东区域大客户开发与维护，年度销售额突破2000万，完成率120%\n• 开拓新客户50+，其中签约世界500强企业3家\n• 建立客户分级管理体系，重点客户续约率从70%提升至92%',
    ],
  },
  {
    category: '设计',
    examples: [
      '• 负责公司品牌视觉体系升级，完成VI系统、官网、物料全套设计\n• 独立完成APP 2.0版本UI设计，用户满意度评分提升20%\n• 建立设计规范和组件库，设计到开发还原度从80%提升至95%',
    ],
  },
  {
    category: '人事/行政',
    examples: [
      '• 负责公司年度招聘计划执行，全年入职120人，招聘完成率105%\n• 优化招聘流程，将平均招聘周期从45天缩短至25天\n• 组织员工培训30+场次，覆盖500+人次，培训满意度95%',
    ],
  },
  {
    category: '财务/会计',
    examples: [
      '• 负责公司全盘账务处理，管理3000万+年度预算\n• 主导财务信息化系统上线，月结时间从10天缩短至3天\n• 完成年度审计工作，连续3年无重大审计调整事项',
    ],
  },
];

// 项目经历参考范文
const projectExamples: ContentExample[] = [
  {
    category: '技术项目',
    examples: [
      '• 项目背景：为解决公司内部协作效率低的问题，从零搭建项目管理平台\n• 技术栈：React + Node.js + PostgreSQL + Docker\n• 核心贡献：独立完成后端架构设计和60%的前端开发，实现看板、甘特图等核心功能\n• 成果：上线后日活500+，团队协作效率提升40%',
      '• 项目背景：电商平台大促活动系统开发，支持秒杀、优惠券等营销玩法\n• 核心贡献：设计高并发秒杀方案，使用Redis+MQ实现库存扣减，支撑10万QPS\n• 成果：双11活动零故障运行，GMV突破5000万',
    ],
  },
  {
    category: '产品/运营项目',
    examples: [
      '• 项目背景：公司APP用户增长遇瓶颈，需要通过内容社区提升留存\n• 我的角色：产品负责人，主导需求分析、原型设计和项目推进\n• 核心工作：完成竞品调研报告，设计内容推荐算法方案，协调5人开发团队\n• 成果：社区上线后DAU增长200%，用户日均使用时长提升15分钟',
    ],
  },
  {
    category: '开源/个人项目',
    examples: [
      '• 独立开发的开源工具，GitHub Star 1.5k+，NPM周下载量2000+\n• 技术栈：TypeScript + Rollup，支持Tree Shaking和按需引入\n• 提供完整的文档站和在线示例，被多个企业项目采用',
    ],
  },
];

// 教育背景参考范文
const educationExamples: ContentExample[] = [
  {
    category: '本科/硕士',
    examples: [
      'GPA: 3.8/4.0（专业前5%），获国家奖学金2次、校一等奖学金3次\n主修课程：数据结构、操作系统、计算机网络、数据库原理\n社团活动：校计算机协会会长，组织编程比赛3次，参与人数500+',
      'GPA: 3.6/4.0，连续3年获校级奖学金\n毕业论文：《基于深度学习的文本情感分析研究》获评优秀毕业论文\n英语水平：CET-6 580分，能流畅阅读英文技术文档',
    ],
  },
  {
    category: '留学/海归',
    examples: [
      'GPA: 3.9/4.0, Dean\'s List for 4 consecutive semesters\nRelevant Coursework: Machine Learning, Distributed Systems, Cloud Computing\nResearch: Published 2 papers in IEEE conferences on NLP applications',
    ],
  },
];

// 自定义模块参考
const customExamples: ContentExample[] = [
  {
    category: '荣誉证书',
    examples: [
      '• 2024年 公司年度优秀员工\n• 2023年 全国大学生数学建模竞赛 国家二等奖\n• PMP项目管理专业人士认证\n• AWS Certified Solutions Architect',
    ],
  },
  {
    category: '自我评价',
    examples: [
      '5年互联网开发经验，擅长React生态和Node.js全栈开发。主导过千万级用户产品的架构设计，具备从0到1的产品技术落地能力。热衷技术分享，在团队内组织过10+次技术分享会。具备良好的沟通协作能力，能高效推动跨部门合作。',
      '3年产品运营经验，熟悉用户增长和内容运营全链路。数据驱动思维强，善于通过A/B测试和数据分析优化策略。具备出色的文案能力和活动策划经验，多次策划10万+参与的线上活动。',
    ],
  },
];

// 根据模块类型获取对应的参考范文
export function getExamplesForModule(moduleType: ModuleType): ContentExample[] {
  switch (moduleType) {
    case 'experience':
      return experienceExamples;
    case 'projects':
      return projectExamples;
    case 'education':
      return educationExamples;
    case 'skills':
      return []; // 技能模块不需要范文
    case 'custom':
      return customExamples;
    default:
      return customExamples;
  }
}
