import seed from './seed.json';
export type Round={id:string;name:string;date:string;time:string;status:string;note:string;url:string;kind:string};
export type StudyFlexibility={normal:string;status:string;extra:string;detail:string;url:string;defer:string;deferUrl:string;checked:string};
export type Program=Omit<typeof seed[number],'studyFlexibility'> & {studyFlexibility?:StudyFlexibility;countries?:string[]};
export type Mock={id:string;exam:'gre'|'toefl';date:string;scale:string;scores:number[];note:string;kind:string};
export type Settings={greTarget:number[];toeflTarget:number[];toeflScale:string;greBuffer:number;toeflBuffer:number;greRetake:number;toeflRetake:number};
export const defaults:Settings={greTarget:[160,168,4.5],toeflTarget:[5.5,5.5,5.5,5.5],toeflScale:'6',greBuffer:21,toeflBuffer:21,greRetake:28,toeflRetake:21};
export const today=()=>new Date().toISOString().slice(0,10);
export const shift=(d:string,n:number)=>{const dt=new Date(d+'T12:00:00Z');dt.setUTCDate(dt.getUTCDate()+n);return dt.toISOString().slice(0,10)};
export function validDate(s:unknown){return typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s}
export function validateMock(m:Mock){if(!['gre','toefl'].includes(m.exam)||!validDate(m.date))throw Error('请选择考试并填写有效日期');const ranges=m.exam==='gre'?[[130,170,1],[130,170,1],[0,6,.5]]:Array(4).fill(m.scale==='6'?[1,6,.5]:[0,30,1]);if(m.scores?.length!==ranges.length||m.scores.some((x,i)=>!Number.isFinite(x)||x<ranges[i][0]||x>ranges[i][1]||Math.abs(x/ranges[i][2]-Math.round(x/ranges[i][2]))>.001))throw Error('分数超出范围或分数步长不正确');if(m.exam==='toefl'&&!['6','120'].includes(m.scale))throw Error('请选择分制');}
export function total(m:Pick<Mock,'exam'|'scores'|'scale'>){return m.exam==='gre'?m.scores[0]+m.scores[1]:m.scale==='120'?m.scores.reduce((a,b)=>a+b,0):Math.round(m.scores.reduce((a,b)=>a+b,0)/4*2)/2;}
export function validateProgram(p:Program){if(p.countries!==undefined&&(!Array.isArray(p.countries)||p.countries.length>10||p.countries.some(x=>typeof x!=='string'||x.length>80)))throw Error('国家/地区格式不正确');if(!p.id||!p.school?.trim()||!p.name?.trim())throw Error('请填写学校与项目名称');if(p.name.length>250||p.school.length>120)throw Error('名称过长');if(!Array.isArray(p.rounds)||p.rounds.length>30||!Array.isArray(p.requirements)||!Array.isArray(p.tracks))throw Error('项目格式不正确');for(const r of p.rounds){if(!r.id||!r.name||r.date&&!validDate(r.date))throw Error('轮次名称或日期不正确');}for(const u of [p.studyFlexibility?.url,p.studyFlexibility?.deferUrl,p.url,...p.rounds.map(r=>r.url),...p.requirements.map(r=>r.url),...p.tracks.map(r=>r.url)])if(u&&!/^https:\/\//i.test(u))throw Error('官网链接必须以 https:// 开头');}
export const limits:Record<string,{label:string;detail:string;source:string;max?:number}>={
Stanford:{label:'每年1个研究生项目',max:1,detail:'此处MS&E与ICME必须择一；联合JD/MD或部分MBA等例外不适用于这两个普通MS并申。',source:'https://icme.stanford.edu/academics-admission/admissions-application-faq'},
Harvard:{label:'DS与CSE二选一',max:1,detail:'SEAS明确不允许同时申请Data Science和CSE。这里的1个仅适用于当前列出的这两个项目，不概括全校其他学院。',source:'https://seas.harvard.edu/masters-data-science/how-apply'},
Cornell:{label:'跨项目并申上限待确认',detail:'ORIE MEng与AEM MPS分属不同项目；须确认研究生院当届并申规则，不能默认两者同时申请。',source:'https://gradschool.cornell.edu/admissions/apply/'},
Bocconi:{label:'最多5个项目志愿',max:5,detail:'Finance与Finance Global Experience分别占一个志愿；同年最多2次申请，获录取后不可重申。',source:'https://www.unibocconi.it/en/applying-bocconi/master-science-and-ma-programs/application-and-admissions/admissions'},
ESSEC:{label:'每项目每学年1次',detail:'同项目累计最多申请2次；此为申请次数，不是跨项目并申总上限。跨项目总数待确认。',source:'https://www.essec.edu/en/program/master-in-finance/'},
'HEC Paris':{label:'跨项目并申上限待确认',detail:'MIF与现有HEC–Yale路径的兼容性需确认；不默认两者独立无冲突。',source:'https://www.hec.edu/en/masters-programs/msc-international-finance/admissions'},
'HKUST–Yale':{label:'双校各自审理',detail:'MIMT/MSGO衔接Yale GBS；第一年及联申规则待确认。HKUST MFin不可自动套用此路径。',source:'https://som.yale.edu/programs/mms-global-business-and-society/1-plus-1'},
Yale:{label:'MBA + AM 可同时申请',detail:'官方允许联合学位申请；本科应届生可走 Silver Scholars 路径。两项目独立审理；与 HEC–Yale M2M 的并申限制尚未核实。',source:'https://som.yale.edu/programs/mms-asset-management/admissions/application-guide'},
Princeton:{label:'每年 1 个项目',detail:'Graduate School 每年仅允许申请一个学位项目。',max:1,source:'https://gradschool.princeton.edu/admission-onboarding/apply'},
Columbia:{label:'商学院 1 个；工程学院另核',detail:'MS Financial Economics、MSAFA、Marketing Science 在 CBS 同一申请季三选一。CBS 允许跨学院申请；工程学院自身限额需另核实。',source:'https://academics.business.columbia.edu/admissions/ms/frequently-asked-questions'},
LBS:{label:'同一时间 1 个项目',detail:'MFA 与 MiM 不可同时申请。此处的 1 个是并行申请限制，不代表全年终身限额。',max:1,source:'https://www.london.edu/masters-degrees/masters-in-financial-analysis/apply'},
Imperial:{label:'商学院每季 1 个',detail:'商学院每个申请季只能申请一个硕士；学校可能考虑替代项目。',max:1,source:'https://www.imperial.ac.uk/study/apply/postgraduate-taught/application-process/'},
UCL:{label:'每季最多 2 个授课型',detail:'适用于 graduate taught programmes；不是两个志愿的同一申请。',max:2,source:'https://www.ucl.ac.uk/study/prospective-students/graduate/how-apply/applying-graduate-taught-study-ucl'},
Oxford:{label:'总计最多 3 个；授课型最多 2 个',detail:'当届申请规则仍应以申请指南为准，课程可能另有限制。',source:'https://www.ox.ac.uk/admissions/graduate/application-guide/starting-your-application/your-application-account'},
Cambridge:{label:'允许多项目；总上限待核实',detail:'每个课程需要独立材料和推荐信；经济系MPhil明确只可申请一个。Judge MPhil Finance与经济系不同，跨院总上限待确认。',source:'https://www.postgraduate.study.cam.ac.uk/apply/how/supporting-documents'},
LSE:{label:'2 个志愿，顺序审理',detail:'第一及第二志愿按偏好顺序审理，不等同同时获得两个项目的审理。',max:2,source:'https://www.lse.ac.uk/study-at-lse/Graduate/Prospective-students/How-to-Apply/Selection-Process'}
};
export function conflict(school:string,p:Program[]){const n=p.filter(x=>x.planned).length;if(school==='Oxford'&&n>2)return '目前列出的均为授课型项目，最多申请2个，请择一组合。';if(school==='Columbia')return p.filter(x=>x.planned&&['03','04','19'].includes(x.id)).length>1?'你计划中的 CBS 项目超过 1 个，请择一。':'';return limits[school]?.max&&n>limits[school].max!?`计划 ${n} 个，超过已核实的 ${limits[school].max} 个限制。`:'';}

const schoolCountries:Record<string,string[]>={Princeton:['美国'],MIT:['美国'],Columbia:['美国'],'Chicago Booth':['美国'],Yale:['美国'],Stanford:['美国'],Cornell:['美国'],Harvard:['美国'],Oxford:['英国'],Cambridge:['英国'],LBS:['英国'],LSE:['英国'],Imperial:['英国'],UCL:['英国'],HKUST:['中国香港'],'HKUST–Yale':['中国香港','美国'],'HEC–Yale':['法国','美国'],'HEC Paris':['法国'],ESSEC:['法国','新加坡'],Bocconi:['意大利']};
export function programCountries(p:Program):string[]{return p.countries?.filter(x=>x.trim()).length?[...new Set(p.countries.map(x=>x.trim()))]:schoolCountries[p.school]||['待分类'];}
