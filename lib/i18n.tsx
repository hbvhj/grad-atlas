'use client';
import {createContext,useContext} from 'react';
import strings from './translations.json';
export type Lang='zh'|'en';
export const LanguageContext=createContext<Lang>('zh');
const en:Record<string,string>=strings;
const zh=Object.fromEntries(Object.entries(en).map(([a,b])=>[b,a]));
export function translate(value:any,lang:Lang):any{
 if(typeof value!=='string')return value;
 const dict=lang==='en'?en:zh;
 if(dict[value])return dict[value];
 const v=value.trim();if(dict[v])return value.replace(v,dict[v]);
 if(lang==='en'){
  let m=value.match(/^距离个人总分目标还差 (.+) 分。$/);if(m)return `${m[1]} points below your target total.`;
  m=value.match(/^建议考试 (.+) · 申请 (.+)$/);if(m)return `Suggested test ${m[1]} · Application ${m[2].replace('（已过）','(past)')}`;
  m=value.match(/^计划 (\d+) 个，超过已核实的 (\d+) 个限制。$/);if(m)return `${m[1]} programs selected; the verified limit is ${m[2]}.`;
  m=value.match(/^官网暂时无法读取（(.+)）$/);if(m)return `Official page unavailable (${m[1]})`;
 }
 return value;
}
export const useTx=()=>{const lang=useContext(LanguageContext);return (value:any)=>translate(value,lang)};
export const canonicalCountry=(s:string)=>({'United States':'美国','United Kingdom':'英国','Hong Kong SAR, China':'中国香港','Hong Kong':'中国香港','Hong Kong SAR (China)':'中国香港','France':'法国','Singapore':'新加坡','Italy':'意大利'} as Record<string,string>)[s]||s;
