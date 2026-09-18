'use client';
import {LanguageContext,Lang,useTx,canonicalCountry} from '@/lib/i18n';
import { useState, useEffect, useRef } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Toaster, toast } from 'sonner';
import { Plus, ArrowUpRight, GraduationCap, CalendarDays, RefreshCw, Pencil, Check, BookOpen, Target, Trash2, ChevronDown, AlertCircle } from 'lucide-react';
import seed from '@/lib/seed.json';
import { Program, Mock, Settings, defaults, limits, programCountries, conflict, shift, today, total, validateMock } from '@/lib/model';
type Data = {
    programs: Program[];
    settings: Settings;
    mocks: Mock[];
    checks: Record<string, any>;
    versions: Record<string, number>;
};
const newProgram = (school: string): Program => ({ id: crypto.randomUUID(), school, name: '', group: '自选项目', location: '', length: '', priority: '待评估', fit: '', risk: '', direction: '', url: '', requirements: [{ category: 'GMAT/GRE', text: '待核实', action: '', url: '' }, { category: '英语', text: '待核实', action: '', url: '' }], tracks: [], rounds: [], planned: true, grePlan: true, toeflPlan: true, selectedRound: '', verified: '' });
function Pick({ value, onChange, options, label }: {
    value: string;
    onChange: (s: string) => void;
    options: {
        value: string;
        label: string;
    }[];
    label: string;
}) { const tx = useTx(); return <Select value={value || 'none'} onValueChange={onChange}><SelectTrigger aria-label={tx(label)}><SelectValue /></SelectTrigger><SelectContent>{tx(options.map(x => <SelectItem key={x.value} value={x.value}>{tx(x.label)}</SelectItem>))}</SelectContent></Select>; }
function Field({ label, children }: {
    label: string;
    children: React.ReactNode;
}) { const tx = useTx(); return <label className="field"><span>{tx(label)}</span>{tx(children)}</label>; }
function External({ href, children }: {
    href: string;
    children: React.ReactNode;
}) { const tx = useTx(); return /^https:\/\//i.test(href) ? <a href={href} target="_blank" rel="noreferrer" className="external">{tx(children)}<ArrowUpRight size={14}/></a> : <span className="muted">{tx("\u6682\u65E0\u5B98\u7F51\u94FE\u63A5")}</span>; }
const testReq = (p: Program, exam: string) => p.requirements.filter(r => exam === 'gre' ? /GMAT|GRE|标化/.test(r.category) : /英语|语言|English|language/i.test(r.category));
function WorkspaceContent({ lang, setLang }: {
    lang: Lang;
    setLang: (l: Lang) => void;
}) {
    const tx = useTx();
    const [data, setData] = useState<Data>({ programs: seed, settings: defaults, mocks: [], checks: {}, versions: {} }), [loaded, setLoaded] = useState(false), [error, setError] = useState(''), [school, setSchool] = useState('Columbia'), [country, setCountry] = useState('all'), [tab, setTab] = useState('schools'), [editing, setEditing] = useState<Program | null>(null), [mockEdit, setMockEdit] = useState<Mock | null>(null), [saving, setSaving] = useState(false), [checking, setChecking] = useState(false), [remove, setRemove] = useState<{
        id: string;
        name: string;
    } | null>(null), [checkPanel, setCheckPanel] = useState<Program | null>(null);
    const dataRef = useRef(data);
    dataRef.current = data;
    const checkLock = useRef(false);
    async function load() { const r = await fetch('/api/data'); const d: any = await r.json(); if (!r.ok)
        throw Error(d.error); setData(d); setError(''); setLoaded(true); return d as Data; }
    useEffect(() => { load().catch(e => setError(e.message)); }, []);
    async function checkAll(force = false, ps = dataRef.current.programs) { if (checkLock.current)
        return; checkLock.current = true; setChecking(true); try {
        for (const p of ps) {
            const r = await fetch('/api/check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: p.id, force }) });
            const d: any = await r.json();
            if (r.ok)
                setData(x => ({ ...x, checks: { ...x.checks, [p.id]: d } }));
        }
        if (force)
            toast(tx('官网检查完成，可展开项目查看结果'));
    }
    catch {
        if (force)
            toast.error(tx('部分来源暂时无法检查，请稍后重试'));
    }
    finally {
        checkLock.current = false;
        setChecking(false);
    } }
    useEffect(() => { if (!loaded)
        return; const t = setTimeout(() => void checkAll(), 1200); const i = setInterval(() => void checkAll(), 15 * 60 * 1000); return () => { clearTimeout(t); clearInterval(i); }; }, [loaded]);
    async function save(type: string, value: any, id?: string) { setSaving(true); try {
        const key = type === 'settings' ? 'settings' : type === 'delete' ? id! : type + ':' + value.id;
        const r = await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, value, id, version: dataRef.current.versions[key] || 0 }) });
        const d: any = await r.json();
        if (!r.ok)
            throw Error(d.error);
        await load();
        toast.success(tx('已保存'));
        return true;
    }
    catch (e) {
        toast.error(e instanceof Error ? tx(e.message) : tx('保存失败'));
        return false;
    }
    finally {
        setSaving(false);
    } }
    const saveRef = useRef(save);
    saveRef.current = save;
    useEffect(() => { const c = (document as any).modelContext; if (!c?.registerTool)
        return; const life = new AbortController(); const register = (x: any) => Promise.resolve(c.registerTool(x, { signal: life.signal })).catch(() => { }); register({ name: 'list_graduate_programs', description: 'Read saved programs and selected application rounds.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true }, execute: () => dataRef.current.programs }); register({ name: 'start_add_master_program', description: 'Open a new master program form, without saving.', inputSchema: { type: 'object', properties: { school: { type: 'string' } }, required: ['school'], additionalProperties: false }, execute: (x: any) => { if (typeof x.school !== 'string' || !x.school.trim())
            throw Error('School is required'); setTab('schools'); setEditing(newProgram(x.school)); return { opened: true }; } }); return () => life.abort(); }, []);
    const allSchools = [...new Set(data.programs.map(p => p.school))];
    const countries = [...new Set(data.programs.flatMap(programCountries))];
    const selectedCountry = country === 'all' || countries.includes(country) ? country : 'all';
    const countryPrograms = data.programs.filter(p => selectedCountry === 'all' || programCountries(p).includes(selectedCountry));
    const schools = [...new Set(countryPrograms.map(p => p.school))];
    const selectedSchool = schools.includes(school) ? school : schools[0];
    const programs = countryPrograms.filter(p => p.school === selectedSchool);
    const allSchoolPrograms = data.programs.filter(p => p.school === selectedSchool);
    const policy = limits[selectedSchool];
    const issue = conflict(selectedSchool, allSchoolPrograms);
    const future = data.programs.filter(p => p.planned).flatMap(p => { const r = p.rounds.find(r => r.id === p.selectedRound); return r?.date && r.date >= today() ? [{ p, r }] : []; }).sort((a, b) => a.r.date.localeCompare(b.r.date));
    const pending = data.programs.filter(p => !p.rounds.some(r => r.date && r.kind === 'deadline')).length;
    return <main className="workspace"><Toaster position="bottom-right" richColors/><header><div className="identity"><div className="mark"><GraduationCap size={24}/></div><span className="brand">Grad Atlas<span>2027</span></span></div><button className="secondary language-switch" onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} aria-label={tx(lang === 'zh' ? 'Switch to English' : tx('切换为中文'))}>{tx(lang === 'zh' ? 'English' : tx('中文'))}</button></header>
 <Tabs value={tab} onValueChange={setTab}><div className="navrow"><TabsList variant="line" className="main-tabs"><TabsTrigger value="schools"><GraduationCap size={18}/>{tx("\u5B66\u6821")}<span className="tab-count">{tx(allSchools.length)}</span></TabsTrigger><TabsTrigger value="tests"><BookOpen size={18}/>{tx("\u6807\u5316")}</TabsTrigger></TabsList><span className="save-status">{tx(saving ? tx('保存中…') : loaded ? tx('个人工作台 · 记录跨设备保存') : tx('正在连接你的工作台'))}</span></div>
 {tx(error && <div role="alert" className="warning">{tx(error)} <button onClick={() => load().catch(e => setError(e.message))}>{tx("\u91CD\u8BD5")}</button></div>)}
 <TabsContent value="schools"><div className="page-heading"><div><p className="eyebrow">APPLICATION WORKSPACE</p><h1>{tx("\u4E0B\u4E00\u7AD9\uFF0C\u7531\u4F60\u9009\u62E9\u3002")}</h1><p className="muted">{tx("\u5148\u9009\u56FD\u5BB6\u6216\u5730\u533A\uFF0C\u518D\u9009\u5B66\u6821\u6BD4\u8F83\u9879\u76EE\u3002")}</p></div><button className="primary" disabled={!loaded} onClick={() => setEditing({ ...newProgram(selectedSchool || ''), ...(selectedCountry !== 'all' ? { countries: [selectedCountry] } : {}) })}><Plus size={18}/>{tx("\u6DFB\u52A0\u9879\u76EE")}</button></div>
 <div className="overview"><div><span className="stat-value">{tx(data.programs.length)}</span><div><strong>{tx("\u6536\u85CF\u9879\u76EE")}</strong><p>{tx(allSchools.length)}{tx("\u6240\u5B66\u6821 \u00B7")}{tx(data.programs.filter(p => p.planned).length)}{tx("\u4E2A\u7EB3\u5165\u8BA1\u5212")}</p></div></div><div><CalendarDays size={25}/><div><strong>{tx(future[0]?.r.date || tx('尚未选择申请日期'))}</strong><p>{tx(future[0] ? future[0].p.school + ' · ' + tx(future[0].r.name) : tx('选择轮次后自动生成标化计划'))}</p></div></div><div><span className="stat-value amber">{tx(pending.toString().padStart(2, '0'))}</span><div><strong>{tx("\u65E5\u671F\u5F85\u8865\u5168")}</strong><p>{tx("\u4FDD\u7559\u7A7A\u7F3A\uFF0C\u6838\u5B9E\u540E\u518D\u7EB3\u5165\u5012\u6392")}</p></div></div></div>
 <div className="school-layout"><aside className="school-index"><div className="country-filter"><Field label={tx("1 \u00B7 \u56FD\u5BB6 / \u5730\u533A")}><Pick label={tx("\u9009\u62E9\u56FD\u5BB6\u6216\u5730\u533A")} value={selectedCountry} onChange={v => { setCountry(v); setSchool(''); }} options={[{ value: 'all', label: tx('全部国家 / 地区') }, ...countries.map(c => ({ value: c, label: tx(c) + ' · ' + new Set(data.programs.filter(p => programCountries(p).includes(c)).map(p => p.school)).size + tx(' 所') }))]}/></Field></div><div className="index-title">{tx("2 \u00B7 \u5B66\u6821\u6E05\u5355")}<span>{tx(schools.length)}</span></div><div className="school-list">{tx(schools.map((s, i) => <button key={s} className={s === selectedSchool ? 'active' : ''} onClick={() => setSchool(s)} aria-pressed={s === selectedSchool}><span className="school-number">{tx(String(i + 1).padStart(2, '0'))}</span><span>{tx(s)}</span><span className="school-count">{tx(countryPrograms.filter(p => p.school === s).length)}</span></button>))}</div></aside>
 <section className="school-content"><div className="school-title"><div><p className="eyebrow">{tx(programs[0]?.location || tx('自选学校'))}</p><h2>{tx(selectedSchool)}</h2></div><button className="quiet" disabled={checking || !loaded} onClick={() => checkAll(true, programs)}><RefreshCw size={16} className={checking ? 'spin' : ''}/>{tx(checking ? tx('正在检查官网') : tx('检查官网'))}</button></div>
 <div className="policy"><div><span className="label">{tx("\u53EF\u7533\u8BF7\u6570\u91CF")}</span><strong>{tx(policy?.label || tx('官方总上限待核实'))}</strong></div><p>{tx(policy?.detail || tx('收藏数量不等于允许申请数量；提交多个项目之前需向招生办确认。'))} {tx(policy && <External href={policy.source}>{tx("\u653F\u7B56\u6765\u6E90")}</External>)}</p><small>{tx("\u5168\u6821\u6536\u85CF")}{tx(allSchoolPrograms.length)}{tx("\u4E2A \u00B7 \u7EB3\u5165\u8BA1\u5212")}{tx(allSchoolPrograms.filter(p => p.planned).length)}{tx("\u4E2A")}{tx(policy ? tx(' · 政策核查 2026-09-16') : '')}</small></div>{tx(issue && <div className="warning"><AlertCircle size={17}/>{tx(issue)}</div>)}
 {tx(programs.map(p => <article className="program" key={p.id}><div className="program-top"><div><div className="program-meta"><span className="tag">{tx(p.priority)}</span><span>{tx(p.length)}</span></div><h3>{tx(p.name.replace(p.school + ' ', ''))}</h3></div><button aria-label={tx(tx('编辑 ') + p.name)} className="icon-button" disabled={!loaded || saving} onClick={() => setEditing(structuredClone(p))}><Pencil size={17}/></button></div><div className="planning"><label className="check-label"><Checkbox checked={p.planned} disabled={!loaded || saving} onCheckedChange={v => save('program', { ...p, planned: !!v })}/>{tx("\u7EB3\u5165\u7533\u8BF7\u8BA1\u5212")}</label><Pick label={tx("\u76EE\u6807\u7533\u8BF7\u8F6E\u6B21")} value={p.selectedRound} onChange={v => save('program', { ...p, selectedRound: v === 'none' ? '' : v })} options={[{ value: 'none', label: tx('选择目标轮次') }, ...p.rounds.filter(r => r.kind !== 'event').map(r => ({ value: r.id, label: tx(r.name) + (r.date ? ' · ' + r.date : tx(' · 日期待定')) }))]}/></div>
 <div className="requirement-grid"><div><span className="label">GRE / GMAT</span>{tx(testReq(p, 'gre').length ? testReq(p, 'gre').map((r, i) => <p key={i}>{tx(r.text)}</p>) : <p>{tx("\u5B98\u65B9\u8981\u6C42\u5F85\u6838\u5B9E")}</p>)}</div><div><span className="label">{tx("TOEFL / \u82F1\u8BED\u8C41\u514D")}</span>{tx(testReq(p, 'toefl').length ? testReq(p, 'toefl').map((r, i) => <p key={i}>{tx(r.text)}</p>) : <p>{tx("\u5B98\u65B9\u8981\u6C42\u5F85\u6838\u5B9E")}</p>)}</div></div>
 <div className="round-heading"><strong>{tx("\u7533\u8BF7\u8F6E\u6B21\u4E0E\u91CD\u8981\u65E5\u671F")}</strong><span>{tx("\u5B66\u6821\u5F53\u5730\u65F6\u95F4")}</span></div><Table><TableHeader><TableRow><TableHead>{tx("\u8F6E\u6B21 / \u4E8B\u9879")}</TableHead><TableHead>DDL</TableHead><TableHead>{tx("\u72B6\u6001")}</TableHead></TableRow></TableHeader><TableBody>{tx(p.rounds.length ? p.rounds.map(r => <TableRow key={r.id} className={p.selectedRound === r.id ? 'chosen-row' : ''}><TableCell><strong>{tx(r.name)}</strong><small>{tx(r.kind === 'event' ? tx('活动 / 测评，非申请截止') : r.kind === 'funding' ? tx('资助截止') : '')}</small></TableCell><TableCell><span className="date">{tx(r.date || tx('待公布 / 待核实'))}</span><small>{tx(r.time)}</small></TableCell><TableCell><span className={'round-status ' + (!r.date ? 'amber' : r.date < today() ? 'past' : '')}>{tx(!r.date ? tx('待补全') : r.date < today() ? tx('已过') : p.selectedRound === r.id ? tx('目标轮次') : tx('可规划'))}</span></TableCell></TableRow>) : <TableRow><TableCell colSpan={3}>{tx("\u5C1A\u672A\u6DFB\u52A0\u8F6E\u6B21\u3002\u70B9\u51FB\u7F16\u8F91\u8865\u5145\u3002")}</TableCell></TableRow>)}</TableBody></Table>
 <details className="more"><summary>{tx("\u5168\u90E8\u7533\u8BF7\u6761\u4EF6\u4E0E Tracks")}<ChevronDown size={17}/></summary><div className="details-body"><h4>Concentrations / Tracks</h4>{tx(p.tracks.map((t, i) => <div className="detail-line" key={i}><strong>{tx(t.name)}</strong><p>{tx(t.kind)} · {tx(t.description)}</p><External href={t.url}>{tx("\u8BFE\u7A0B\u6765\u6E90")}</External></div>))}{tx(!p.tracks.length && <p>{tx("\u5C1A\u672A\u6838\u5B9E\u6B63\u5F0F\u65B9\u5411\u3002")}</p>)}<h4>{tx("\u5168\u90E8\u7533\u8BF7\u6761\u4EF6")}</h4>{tx(p.requirements.map((r, i) => <div className="detail-line" key={i}><strong>{tx(r.category)}</strong><p>{tx(r.text)}</p><External href={r.url || p.url}>{tx("\u5B98\u65B9\u8BF4\u660E")}</External></div>))}<h4>{tx("\u8F6E\u6B21\u5907\u6CE8\u4E0E\u6765\u6E90")}</h4>{tx(p.rounds.map(r => <div className="detail-line" key={r.id}><strong>{tx(r.name)} · {tx(r.status)}</strong><p>{tx(r.note)}</p><External href={r.url || p.url}>{tx("\u65E5\u671F\u6765\u6E90")}</External></div>))}</div></details>
 <section className="study-policy"><div className="section-heading"><h3>{tx("\u5EF6\u6BD5\u4E0E\u5B66\u5236")}</h3><span className="tag">{tx(p.studyFlexibility?.status || tx('待确认'))}</span></div><div className="two-col"><div><span className="label">{tx("\u6B63\u5E38\u5B66\u5236")}</span><p>{tx(p.studyFlexibility?.normal || p.length || tx('待确认'))}</p></div><div><span className="label">{tx("\u53EF\u589E\u52A0\u591A\u4E45")}</span><p>{tx(p.studyFlexibility?.extra || tx('尚未核实年数'))}</p></div></div><p>{tx(p.studyFlexibility?.detail || tx('尚无经核实的延长毕业政策，请向项目办公室确认。'))}</p>{tx(p.studyFlexibility?.url && <External href={p.studyFlexibility.url}>{tx("\u5B66\u5236 / \u653F\u7B56\u6765\u6E90")}</External>)}<details><summary>{tx("\u5EF6\u671F\u5165\u5B66\uFF08\u5355\u72EC\u653F\u7B56\uFF09")}</summary><p>{tx(p.studyFlexibility?.defer || tx('待确认'))}</p>{tx(p.studyFlexibility?.deferUrl && <External href={p.studyFlexibility.deferUrl}>{tx("\u5EF6\u671F\u5165\u5B66\u6765\u6E90")}</External>)}</details><small className="muted">{tx("\u653F\u7B56\u6838\u67E5\uFF1A")}{tx(p.studyFlexibility?.checked || tx('待核实'))}{tx("\u00B7 \u672A\u6838\u5B9E\u4E0D\u7B49\u4E8E\u7981\u6B62\uFF0C\u4E5F\u4E0D\u7B49\u4E8E\u5141\u8BB8\u3002")}</small></section>
 <div className="program-foot"><External href={p.url}>{tx("\u5B98\u65B9\u7533\u8BF7\u9875\u9762")}</External><button className="text-button" onClick={() => setCheckPanel(p)}>{tx(data.checks[p.id]?.needsReview ? tx('官网有变化 · 查看') : data.checks[p.id]?.status === 'error' ? tx('官网自动读取受限') : data.checks[p.id] ? tx('查看官网监测') : tx('查看更新说明'))}</button><span>{tx("\u5185\u5BB9\u6838\u5B9E\uFF1A")}{tx(p.verified || tx('待核实'))}</span></div></article>))}
 <p className="footnote">{tx("\u65B0\u589E\u63A8\u8350\u9ED8\u8BA4\u672A\u7EB3\u5165\u7533\u8BF7\u8BA1\u5212\uFF1B\u52FE\u9009\u540E\u53C2\u4E0E\u6807\u5316\u5012\u6392\u3002\u5EF6\u6BD5\u680F\u533A\u5206\u6B63\u5E38\u957F\u5B66\u5236\u3001\u6682\u505C\u5B66\u7C4D\u4E0E\u5EF6\u671F\u5165\u5B66\uFF1B\u672A\u786E\u8BA4\u7684\u5E74\u6570\u4E0D\u4F5C\u4FDD\u8BC1\u3002\u6253\u5F00\u7F51\u7AD9\u540E\u81EA\u52A8\u68C0\u67E5\u8FC7\u671F\u7684\u5B98\u7F51\u76D1\u6D4B\u8BB0\u5F55\uFF0C\u6BCF\u4E2A\u9879\u76EE\u6700\u591A\u6BCF\u65E5\u4E00\u6B21\uFF1B\u9875\u9762\u4FDD\u6301\u6253\u5F00\u65F6\u4F1A\u7EE7\u7EED\u68C0\u67E5\u3002\u7F51\u9875\u53D8\u5316\u9700\u6838\u5B9E\u540E\u66F4\u65B0\u5230\u9879\u76EE\uFF0C\u4E0D\u4F1A\u8986\u76D6\u4F60\u7684\u624B\u5DE5\u4FEE\u6539\u3002\u90E8\u5206\u5B98\u7F51\u9650\u5236\u8BFB\u53D6\u6216\u4F7F\u7528\u52A8\u6001\u65E5\u5386\uFF0C\u4ECD\u9700\u624B\u52A8\u67E5\u770B\u3002")}</p></section></div></TabsContent>
 <TabsContent value="tests"><div className="page-heading"><div><p className="eyebrow">TEST PREPARATION</p><h1>{tx("\u8BA9\u5206\u6570\u8D76\u4E0A\u7533\u8BF7\u3002")}</h1><p className="muted">{tx("\u6839\u636E\u6240\u9009\u9879\u76EE\u4E0E\u8F6E\u6B21\u5012\u6392\u8003\u8BD5\uFF0C\u8BB0\u5F55\u6BCF\u4E00\u6B21\u7EC3\u4E60\u3002")}</p></div></div><div className="exam-grid">{tx((['gre', 'toefl'] as const).map(exam => <ExamPanel key={exam} exam={exam} data={data} disabled={!loaded || saving} save={save} onMock={m => setMockEdit(m)} onDelete={m => setRemove({ id: 'mock:' + m.id, name: m.date + ' ' + m.exam.toUpperCase() + tx(' 成绩') })}/>))}</div><div className="test-links"><External href="https://www.ets.org/gre/test-takers/general-test/scores/get-scores.html">{tx("GRE \u51FA\u5206\u89C4\u5219")}</External><External href="https://www.ets.org/gre/test-takers/general-test/schedule.html">{tx("GRE \u91CD\u8003\u89C4\u5219")}</External><External href="https://www.ets.org/toefl/test-takers/ibt/scores/understand-scores.html">{tx("TOEFL \u5206\u5236\u4E0E\u9001\u5206")}</External></div></TabsContent></Tabs>
 {tx(editing && <ProgramEditor program={editing} saving={saving} close={() => setEditing(null)} onSave={async (p) => { if (await save('program', p)) {
        setSchool(p.school);
        if (selectedCountry !== 'all' && !programCountries(p).includes(selectedCountry))
            setCountry(programCountries(p)[0]);
        setEditing(null);
    } }} onDelete={() => setRemove({ id: 'program:' + editing.id, name: editing.name })}/>)} {tx(mockEdit && <MockEditor mock={mockEdit} saving={saving} close={() => setMockEdit(null)} onSave={async (m) => { if (await save('mock', m))
        setMockEdit(null); }}/>)}
 <AlertDialog open={!!remove} onOpenChange={v => !v && setRemove(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{tx("\u5220\u9664\u8FD9\u6761\u8BB0\u5F55\uFF1F")}</AlertDialogTitle><AlertDialogDescription>{tx(remove?.name)}{tx("\u5C06\u4ECE\u5DE5\u4F5C\u53F0\u79FB\u9664\u3002")}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{tx("\u53D6\u6D88")}</AlertDialogCancel><AlertDialogAction disabled={saving} onClick={async () => { if (remove && await save('delete', null, remove.id)) {
        setRemove(null);
        setEditing(null);
    } }}>{tx("\u5220\u9664")}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
 <Dialog open={!!checkPanel} onOpenChange={v => !v && setCheckPanel(null)}><DialogContent className="wide-dialog"><DialogHeader><DialogTitle>{tx("\u5B98\u7F51\u76D1\u6D4B \u00B7")}{tx(checkPanel?.school)}</DialogTitle><DialogDescription>{tx("\u81EA\u52A8\u68C0\u67E5\u7F51\u9875\u53D8\u5316\uFF0C\u62DB\u751F\u7ED3\u8BBA\u4ECD\u9700\u6838\u5B9E\u3002")}</DialogDescription></DialogHeader>{tx(checkPanel && <><p>{tx("\u6700\u8FD1\u68C0\u67E5\uFF1A")}{tx(data.checks[checkPanel.id]?.checkedAt?.replace('T', ' ').slice(0, 19) || tx('尚未检查'))} UTC</p><p>{tx(data.checks[checkPanel.id]?.message || tx('首次成功读取会建立网页基线。后台不会在网站关闭后定时抓取。'))}</p>{tx(data.checks[checkPanel.id]?.needsReview && <div className="warning">{tx("\u8BF7\u67E5\u770B\u4E0B\u65B9\u6765\u6E90\uFF0C\u6838\u5B9E\u540E\u5728\u201C\u7F16\u8F91\u9879\u76EE\u201D\u66F4\u65B0\u76F8\u5173\u5B57\u6BB5\u3002")}</div>)}{tx(data.checks[checkPanel.id]?.pages?.map((p: any, i: number) => <div key={i} className="detail-line"><External href={p.url}>{tx("\u6253\u5F00\u6765\u6E90")}{tx(i + 1)}</External><p>{tx(p.error || tx('成功读取'))}</p>{tx(p.text && <details><summary>{tx("\u5F53\u524D\u62DB\u751F\u7247\u6BB5")}</summary><pre className="source-text">{tx(p.text)}</pre></details>)}</div>))}{tx(data.checks[checkPanel.id]?.previous?.length > 0 && <details><summary>{tx("\u4E0A\u6B21\u53D8\u5316\u524D\u7684\u7247\u6BB5")}</summary>{tx(data.checks[checkPanel.id].previous.map((p: any, i: number) => <pre className="source-text" key={i}>{tx(p.text || p.error)}</pre>))}</details>)}<div className="actions"><button disabled={checking} onClick={() => checkAll(true, [checkPanel])} className="secondary">{tx("\u91CD\u65B0\u68C0\u67E5")}</button><button className="primary" onClick={() => { setEditing(structuredClone(checkPanel)); setCheckPanel(null); }}>{tx("\u7F16\u8F91\u9879\u76EE")}</button>{tx(data.checks[checkPanel.id]?.needsReview && <button className="secondary" onClick={async () => { try {
        const r = await fetch('/api/check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: checkPanel.id, ack: true }) });
        if (!r.ok)
            throw Error();
        const d: any = await r.json();
        setData(x => ({ ...x, checks: { ...x.checks, [checkPanel.id]: d } }));
        toast.success(tx('已标记为查看过'));
    }
    catch {
        toast.error(tx('保存失败'));
    } }}>{tx("\u5DF2\u67E5\u770B\u672C\u6B21\u53D8\u5316")}</button>)}</div></>)}</DialogContent></Dialog>
 </main>;
}
function ExamPanel({ exam, data, disabled, save, onMock, onDelete }: {
    exam: 'gre' | 'toefl';
    data: Data;
    disabled: boolean;
    save: (type: string, v: any) => Promise<boolean>;
    onMock: (m: Mock) => void;
    onDelete: (m: Mock) => void;
}) {
    const tx = useTx();
    const [settings, setSettings] = useState(data.settings);
    useEffect(() => setSettings(data.settings), [data.settings]);
    const gre = exam === 'gre';
    const scale = gre ? '340' : settings.toeflScale;
    const targets = gre ? settings.greTarget : settings.toeflTarget;
    const labels = gre ? ['Verbal', 'Quant', 'Writing'] : ['Reading', 'Listening', 'Speaking', 'Writing'];
    const buffer = gre ? settings.greBuffer : settings.toeflBuffer;
    const retake = gre ? settings.greRetake : settings.toeflRetake;
    const rows = data.programs.filter(p => p.planned).map(p => ({ p, r: p.rounds.find(r => r.id === p.selectedRound), include: gre ? p.grePlan : p.toeflPlan }));
    const applicable = rows.filter(x => x.include && x.r?.date && x.r.date >= today()).sort((a, b) => a.r!.date.localeCompare(b.r!.date));
    const earliest = applicable[0];
    const latest = earliest ? shift(earliest.r!.date, -buffer) : '';
    const first = latest ? shift(latest, -retake) : '';
    const mocks = data.mocks.filter(m => m.exam === exam).sort((a, b) => b.date.localeCompare(a.date));
    const comparable = mocks.filter(m => gre || m.scale === scale);
    const last = comparable[0];
    const goal = total({ exam, scale, scores: targets });
    const actual = last ? total(last) : null;
    return <section className={'exam-panel ' + exam}><div className="exam-header"><div><p className="eyebrow">{tx(gre ? 'GRADUATE RECORD EXAMINATION' : 'ENGLISH LANGUAGE')}</p><h2>{tx(exam.toUpperCase())}</h2></div><span className="exam-symbol">{tx(gre ? 'G' : 'T')}</span></div><p className="muted">{tx(gre ? tx('目标分数是个人备考目标，不是学校录取线。') : tx('新旧分制分别记录；不自动把旧分数换算成新分数。'))}</p>
 <div className="score-summary"><div><span className="label">{tx("\u6700\u8FD1\u4E00\u6B21 \u00B7")}{tx(last ? last.date : tx('尚无成绩'))}</span><strong>{tx(actual ?? '—')}<small> / {tx(gre ? '340' : scale)}</small></strong></div><div><span className="label">{tx("\u4E2A\u4EBA\u76EE\u6807")}</span><strong>{tx(goal)}<small> / {tx(gre ? '340' : scale)}</small></strong></div></div><Progress aria-label={tx("\u8DDD\u79BB\u4E2A\u4EBA\u76EE\u6807")} value={actual === null ? 0 : Math.min(100, actual / goal * 100)}/><p className="progress-note">{tx(actual === null ? tx('添加第一次 mock，开始记录进展。') : actual >= goal ? tx('本次总分已达到个人目标；仍需检查各单项。') : `距离个人总分目标还差 ${Math.round((goal - actual) * 10) / 10} 分。`)}</p>
 <details className="settings-details"><summary><Target size={16}/>{tx("\u76EE\u6807\u5206\u6570\u4E0E\u65F6\u95F4\u7F13\u51B2")}<ChevronDown size={16}/></summary><div className="settings-body">{tx(!gre && <Field label={tx("\u76EE\u6807\u5206\u5236")}><Pick label={tx("TOEFL \u76EE\u6807\u5206\u5236")} value={scale} options={[{ value: '6', label: tx('新版 1–6') }, { value: '120', label: tx('旧版 0–120') }]} onChange={s => setSettings({ ...settings, toeflScale: s, toeflTarget: s === '6' ? [5.5, 5.5, 5.5, 5.5] : [28, 28, 27, 27] })}/></Field>)}<div className="score-inputs">{tx(labels.map((label, i) => <Field label={tx(label)} key={label}><input type="number" min={gre ? i === 2 ? 0 : 130 : scale === '6' ? 1 : 0} max={gre ? i === 2 ? 6 : 170 : scale === '6' ? 6 : 30} step={gre ? i === 2 ? .5 : 1 : scale === '6' ? .5 : 1} value={tx(targets[i])} onChange={e => { const t = [...targets]; t[i] = Number(e.target.value); setSettings({ ...settings, [gre ? 'greTarget' : 'toeflTarget']: t }); }}/></Field>))}</div><div className="two-col"><Field label={tx("\u622A\u6B62\u524D\u51FA\u5206 / \u9001\u5206\u7F13\u51B2\uFF08\u5929\uFF09")}><input type="number" min="1" max="180" value={tx(buffer)} onChange={e => setSettings({ ...settings, [gre ? 'greBuffer' : 'toeflBuffer']: Number(e.target.value) })}/></Field><Field label={tx("\u9996\u8003\u81F3\u5907\u9009\u91CD\u8003\u95F4\u9694\uFF08\u5929\uFF09")}><input type="number" min={gre ? 21 : 3} max="180" value={tx(retake)} onChange={e => setSettings({ ...settings, [gre ? 'greRetake' : 'toeflRetake']: Number(e.target.value) })}/></Field></div><button className="secondary" disabled={disabled} onClick={() => save('settings', settings)}>{tx("\u4FDD\u5B58\u5907\u8003\u8BBE\u7F6E")}</button></div></details>
 <div className="exam-plan"><div className="section-heading"><h3>{tx("\u4F60\u7684\u8003\u8BD5\u65F6\u95F4\u7EBF")}</h3><span className="tag">{tx("\u81EA\u52A8\u5012\u6392")}</span></div>{tx(earliest ? <><p className="muted">{tx("\u7531")}{tx(earliest.p.school)} · {tx(earliest.r!.name)}{tx("\u9A71\u52A8")}</p><ol className="timeline"><li><span>01</span><div><strong>{tx(first)}</strong><p>{tx("\u5EFA\u8BAE\u9996\u8003")}{tx(first < today() ? tx(' · 已过，需调整计划') : '')}</p></div></li><li><span>02</span><div><strong>{tx(latest)}</strong><p>{tx("\u5907\u9009\u91CD\u8003 / \u6700\u540E\u5EFA\u8BAE\u8003\u8BD5\u65E5")}{tx(latest < today() ? tx(' · 时间紧张') : '')}</p></div></li><li><span>03</span><div><strong>{tx(earliest.r!.date)}</strong><p>{tx("\u6240\u9009\u7533\u8BF7\u8F6E\u6B21\u622A\u6B62")}</p></div></li></ol>{tx(first < today() && <div className="warning">{tx("\u5B8C\u6574\u5907\u8003\u7A97\u53E3\u5DF2\u4E0D\u8DB3\u3002\u8BF7\u8003\u8651\u540E\u7EED\u8F6E\u6B21\uFF0C\u6216\u7ED3\u5408\u5DF2\u6709\u6709\u6548\u6210\u7EE9\u8C03\u6574\u8BA1\u5212\u3002")}</div>)}</> : <p className="empty-note">{tx("\u6682\u65E0\u53EF\u5012\u6392\u7684\u7533\u8BF7\u65E5\u671F\u3002\u8BF7\u5728\u5B66\u6821\u9875\u9009\u62E9\u672A\u6765\u8F6E\u6B21\uFF0C\u5E76\u786E\u8BA4\u8BE5\u8003\u8BD5\u7EB3\u5165\u8BA1\u5212\u3002")}</p>)}<p className="footnote">{tx("\u89C4\u5212\u89C4\u5219\uFF1A\u5907\u9009\u8003\u8BD5\u65E5 = DDL \u2212")}{tx(buffer)}{tx("\u5929\uFF1B\u9996\u8003 = \u5907\u9009\u8003\u8BD5\u65E5 \u2212")}{tx(retake)}{tx("\u5929\u3002\u8FD9\u662F\u53EF\u7F16\u8F91\u7684\u4E2A\u4EBA\u89C4\u5212\uFF0C\u4E0D\u662F\u5B66\u6821\u5B98\u65B9\u8003\u8BD5\u622A\u6B62\u3002")}{tx(gre ? tx('GRE 通常 8–10 天出分，重考至少间隔 21 天。') : tx('TOEFL 通常 3 天出分，学校收分可能另需多个工作日。'))}{tx("\u82F1\u8BED\u53EF\u540E\u8865\u6216\u5DF2\u83B7\u8C41\u514D\u7684\u9879\u76EE\uFF0C\u53EF\u53D6\u6D88\u4E0B\u65B9\u52FE\u9009\u3002")}</p></div>
 <details className="exam-projects"><summary>{tx("\u9010\u9879\u76EE\u8003\u8BD5\u8BA1\u5212")}<span>{tx(applicable.length)}{tx("\u4E2A\u53EF\u5012\u6392")}</span><ChevronDown size={16}/></summary>{tx(rows.map(({ p, r, include }) => <div className="plan-line" key={p.id}><label className="check-label"><Checkbox checked={include} disabled={disabled} onCheckedChange={v => save('program', { ...p, [gre ? 'grePlan' : 'toeflPlan']: !!v })}/><strong>{tx(p.name)}</strong></label><p>{tx(!include ? tx('未纳入该考试计划') : r?.date ? `建议考试 ${shift(r.date, -buffer)} · 申请 ${r.date}${r.date < today() ? tx('（已过）') : ''}` : tx('缺少目标日期，暂不倒排'))}</p>{tx(testReq(p, exam).map((q, i) => <small key={i}>{tx(q.text)}</small>))}</div>))}</details>
 <div className="section-heading mock-heading"><h3>{tx("\u6210\u7EE9\u8BB0\u5F55")}</h3><button className="secondary" disabled={disabled} onClick={() => onMock({ id: crypto.randomUUID(), exam, date: today(), scale, scores: Array(gre ? 3 : 4).fill(NaN), note: '', kind: 'mock' })}><Plus size={16}/>{tx("\u8BB0\u5F55\u6210\u7EE9")}</button></div>{tx(mocks.length ? <div className="mock-list">{tx(mocks.map(m => <div className="mock-row" key={m.id}><div><strong>{tx(total(m))}<small> / {tx(gre ? '340' : m.scale)}</small></strong><p>{tx(m.date)} · {tx(m.kind === 'official' ? tx('正式考试') : 'Mock')}</p><small>{tx(labels.map((s, i) => s[0] + ': ' + m.scores[i]).join(' · '))}</small>{tx(m.note && <p>{tx(m.note)}</p>)}</div><div className="row-actions"><button className="icon-button" aria-label={tx("\u4FEE\u6539\u6210\u7EE9")} onClick={() => onMock(structuredClone(m))}><Pencil size={16}/></button><button className="icon-button" aria-label={tx("\u5220\u9664\u6210\u7EE9")} onClick={() => onDelete(m)}><Trash2 size={16}/></button></div></div>))}</div> : <div className="empty-note"><BookOpen size={24}/><p>{tx("\u8FD8\u6CA1\u6709\u6210\u7EE9\u8BB0\u5F55")}</p><small>{tx("\u8BB0\u5F55\u771F\u5B9E\u7EC3\u4E60\u6210\u7EE9\uFF0C\u89C2\u5BDF\u4F60\u4E0E\u76EE\u6807\u7684\u8DDD\u79BB\u3002")}</small></div>)}</section>;
}
function ProgramEditor({ program, saving, close, onSave, onDelete }: {
    program: Program;
    saving: boolean;
    close: () => void;
    onSave: (p: Program) => void;
    onDelete: () => void;
}) {
    const tx = useTx();
    const [p, setP] = useState(program);
    const update = (k: string, v: any) => setP({ ...p, [k]: v });
    const req = (i: number, k: string, v: string) => update('requirements', p.requirements.map((r, j) => j === i ? { ...r, [k]: v } : r));
    const round = (i: number, k: string, v: string) => update('rounds', p.rounds.map((r, j) => j === i ? { ...r, [k]: v } : r));
    return <Dialog open onOpenChange={v => !v && close()}><DialogContent className="wide-dialog"><DialogHeader><DialogTitle>{tx(program.name ? tx('编辑项目') : tx('添加 Master 项目'))}</DialogTitle><DialogDescription>{tx("\u4FDD\u5B58\u540E\u4F1A\u5F52\u5165\u5BF9\u5E94\u5B66\u6821\uFF1B\u8F6E\u6B21\u53D8\u5316\u4F1A\u540C\u6B65\u91CD\u7B97\u6807\u5316\u8BA1\u5212\u3002")}</DialogDescription></DialogHeader><form onSubmit={e => { e.preventDefault(); onSave(p); }}><div className="two-col"><Field label={tx("\u5B66\u6821")}><input required value={tx(p.school)} onChange={e => update('school', e.target.value)}/></Field><Field label={tx("\u9879\u76EE\u5168\u540D")}><input required value={tx(p.name)} onChange={e => update('name', e.target.value)}/></Field><Field label={tx("\u56FD\u5BB6 / \u5730\u533A\uFF08\u591A\u4E2A\u7528\u9017\u53F7\u5206\u9694\uFF09")}><input placeholder={tx("\u4F8B\u5982\uFF1A\u7F8E\u56FD\uFF0C\u82F1\u56FD")} key={tx('国家 / 地区')} defaultValue={programCountries(p).filter(c => c !== '待分类').map(c=>tx(c)).join('; ')} onChange={e => update('countries', e.target.value.split(/[,，、;]/).map(x => canonicalCountry(x.trim())).filter(Boolean))}/></Field><Field label={tx("\u5730\u70B9")}><input value={tx(p.location)} onChange={e => update('location', e.target.value)}/></Field><Field label={tx("\u65F6\u957F")}><input value={tx(p.length)} onChange={e => update('length', e.target.value)}/></Field></div><Field label={tx("\u5B98\u65B9\u7533\u8BF7\u9875\u9762")}><input type="url" placeholder="https://…" value={tx(p.url)} onChange={e => update('url', e.target.value)}/></Field><div className="two-col"><Field label={tx("\u6700\u8FD1\u4EBA\u5DE5\u6838\u5B9E\u65E5\u671F")}><input type="date" value={tx(p.verified)} onChange={e => update('verified', e.target.value)}/></Field></div>
 <h3>{tx("\u5EF6\u6BD5\u4E0E\u5B66\u5236\u653F\u7B56")}</h3><p className="muted">{tx("\u5206\u522B\u8BB0\u5F55\u6B63\u5E38\u5B66\u5236\u3001\u5EF6\u957F\u5728\u8BFB/\u4F11\u5B66\u3001\u5EF6\u671F\u5165\u5B66\uFF1B\u672A\u77E5\u4E0A\u9650\u8BF7\u5199\u5F85\u786E\u8BA4\u3002")}</p>{tx([['normal', tx('正常学制')], ['status', tx('可否延毕 / 政策类型')], ['extra', tx('可增加多久（明确单位与条件）')], ['detail', tx('延长在读 / 休学条件')], ['url', tx('学制政策官方来源')], ['defer', tx('延期入学（不是延毕）')], ['deferUrl', tx('延期入学来源')], ['checked', tx('政策核查日期')]].map(([k, l]) => <Field key={k} label={tx(l)}><input type={k === 'checked' ? 'date' : k === 'url' || k === 'deferUrl' ? 'url' : 'text'} value={tx((p.studyFlexibility as any)?.[k] || '')} onChange={e => update('studyFlexibility', { normal: p.length, status: tx('待确认'), extra: '', detail: '', url: '', defer: tx('待确认'), deferUrl: '', checked: '', ...p.studyFlexibility, [k]: e.target.value })}/></Field>))}
 <div className="section-heading"><h3>{tx("\u5168\u90E8\u7533\u8BF7\u8F6E\u6B21")}</h3><button type="button" className="text-button" onClick={() => update('rounds', [...p.rounds, { id: crypto.randomUUID(), name: 'Round ' + (p.rounds.length + 1), date: '', time: tx('具体时间待核实'), status: tx('用户录入 · 待核实'), note: '', url: p.url, kind: 'deadline' }])}><Plus size={16}/>{tx("\u6DFB\u52A0\u8F6E\u6B21")}</button></div>{tx(p.rounds.map((r, i) => <div className="editor-block" key={r.id}><div className="two-col"><Field label={tx("\u8F6E\u6B21\u540D\u79F0")}><input required value={tx(r.name)} onChange={e => round(i, 'name', e.target.value)}/></Field><Field label={tx("\u622A\u6B62\u65E5\u671F")}><input type="date" value={tx(r.date)} onChange={e => round(i, 'date', e.target.value)}/></Field><Field label={tx("\u5F53\u5730\u65F6\u523B\u4E0E\u65F6\u533A")}><input value={tx(r.time)} onChange={e => round(i, 'time', e.target.value)}/></Field><Field label={tx("\u65E5\u671F\u6027\u8D28")}><Pick label={tx("\u65E5\u671F\u6027\u8D28")} value={r.kind} options={[{ value: 'deadline', label: tx('申请截止') }, { value: 'funding', label: tx('资助截止') }, { value: 'event', label: tx('开放日 / 测评') }]} onChange={v => round(i, 'kind', v)}/></Field></div><Field label={tx("\u6838\u5B9E\u72B6\u6001")}><input value={tx(r.status)} onChange={e => round(i, 'status', e.target.value)}/></Field><Field label={tx("\u5907\u6CE8")}><textarea value={tx(r.note)} onChange={e => round(i, 'note', e.target.value)}/></Field><Field label={tx("\u8F6E\u6B21\u5B98\u65B9\u6765\u6E90")}><input type="url" value={tx(r.url)} onChange={e => round(i, 'url', e.target.value)}/></Field><button type="button" className="text-button danger" onClick={() => { const rounds = p.rounds.filter((_, j) => j !== i); setP({ ...p, rounds, selectedRound: p.selectedRound === r.id ? '' : p.selectedRound }); }}>{tx("\u79FB\u9664\u6B64\u8F6E\u6B21")}</button></div>))}
 <div className="section-heading"><h3>{tx("\u6807\u5316\u4E0E\u5176\u4ED6\u7533\u8BF7\u6761\u4EF6")}</h3><button type="button" className="text-button" onClick={() => update('requirements', [...p.requirements, { category: tx('其他条件'), text: '', action: '', url: p.url }])}><Plus size={16}/>{tx("\u6DFB\u52A0\u6761\u4EF6")}</button></div>{tx(p.requirements.map((r, i) => <div className="editor-block" key={i}><Field label={tx("\u6761\u4EF6\u7C7B\u522B\uFF08\u5982 GMAT/GRE\u3001\u82F1\u8BED\u3001\u63A8\u8350\u4FE1\uFF09")}><input value={tx(r.category)} onChange={e => req(i, 'category', e.target.value)}/></Field><Field label={tx("\u5B98\u65B9\u8981\u6C42")}><textarea rows={3} value={tx(r.text)} onChange={e => req(i, 'text', e.target.value)}/></Field><Field label={tx("\u6765\u6E90")}><input type="url" value={tx(r.url)} onChange={e => req(i, 'url', e.target.value)}/></Field><button type="button" className="text-button danger" onClick={() => update('requirements', p.requirements.filter((_, j) => j !== i))}>{tx("\u79FB\u9664\u6761\u4EF6")}</button></div>))}
 <div className="section-heading"><h3>Concentrations / Tracks</h3><button type="button" className="text-button" onClick={() => update('tracks', [...p.tracks, { kind: tx('待核实'), name: '', description: '', fit: '', url: p.url }])}><Plus size={16}/>{tx("\u6DFB\u52A0\u65B9\u5411")}</button></div>{tx(p.tracks.map((t, i) => <div className="editor-block" key={i}>{tx([['name', tx('方向名称')], ['kind', tx('方向性质（正式 / 选课建议）')], ['description', tx('说明')], ['url', tx('课程来源')]].map(([k, l]) => <Field key={k} label={tx(l)}><input value={tx((t as any)[k])} onChange={e => update('tracks', p.tracks.map((v, j) => j === i ? { ...v, [k]: e.target.value } : v))}/></Field>))}<button type="button" className="text-button danger" onClick={() => update('tracks', p.tracks.filter((_, j) => j !== i))}>{tx("\u79FB\u9664\u65B9\u5411")}</button></div>))}
 <div className="editor-footer">{tx(program.name && <button type="button" className="text-button danger" onClick={onDelete}>{tx("\u5220\u9664\u9879\u76EE")}</button>)}<button type="button" className="secondary" onClick={close}>{tx("\u53D6\u6D88")}</button><button type="submit" className="primary" disabled={saving}>{tx(saving ? tx('保存中…') : tx('保存项目'))}</button></div></form></DialogContent></Dialog>;
}
function MockEditor({ mock, saving, close, onSave }: {
    mock: Mock;
    saving: boolean;
    close: () => void;
    onSave: (m: Mock) => void;
}) { const tx = useTx(); const [m, setM] = useState(mock), [error, setError] = useState(''); const gre = m.exam === 'gre'; const labels = gre ? ['Verbal', 'Quant', 'Writing'] : ['Reading', 'Listening', 'Speaking', 'Writing']; return <Dialog open onOpenChange={v => !v && close()}><DialogContent><DialogHeader><DialogTitle>{tx(m.exam.toUpperCase())}{tx("\u6210\u7EE9\u8BB0\u5F55")}</DialogTitle><DialogDescription>{tx("\u8BF7\u586B\u5199\u5B9E\u9645\u8003\u8BD5\u6210\u7EE9\uFF0C\u6240\u6709\u5355\u9879\u5747\u9700\u586B\u5199\u3002")}</DialogDescription></DialogHeader><form onSubmit={e => { e.preventDefault(); try {
    validateMock(m);
    onSave(m);
}
catch (e) {
    setError((e as Error).message);
} }}><div className="two-col"><Field label={tx("\u65E5\u671F")}><input required type="date" value={tx(m.date)} onChange={e => setM({ ...m, date: e.target.value })}/></Field><Field label={tx("\u8003\u8BD5\u7C7B\u578B")}><Pick label={tx("\u8003\u8BD5\u7C7B\u578B")} value={m.kind} options={[{ value: 'mock', label: tx('Mock 模拟考试') }, { value: 'official', label: tx('正式考试') }]} onChange={v => setM({ ...m, kind: v })}/></Field></div>{tx(!gre && <Field label={tx("\u5206\u5236")}><Pick label={tx("\u6210\u7EE9\u5206\u5236")} value={m.scale} options={[{ value: '6', label: tx('新版 1–6（每项）') }, { value: '120', label: tx('旧版 0–30（每项）') }]} onChange={v => setM({ ...m, scale: v, scores: Array(4).fill(NaN) })}/></Field>)}<div className="score-inputs">{tx(labels.map((l, i) => <Field key={l} label={tx(l)}><input required type="number" value={tx(Number.isNaN(m.scores[i]) ? '' : m.scores[i])} min={gre ? i === 2 ? 0 : 130 : m.scale === '6' ? 1 : 0} max={gre ? i === 2 ? 6 : 170 : m.scale === '6' ? 6 : 30} step={gre ? i === 2 ? .5 : 1 : m.scale === '6' ? .5 : 1} onChange={e => { const scores = [...m.scores]; scores[i] = e.target.value === '' ? NaN : Number(e.target.value); setM({ ...m, scores }); }}/></Field>))}</div><Field label={tx("\u5907\u6CE8\uFF08\u8BD5\u5377\u3001\u5F31\u9879\u3001\u590D\u76D8\uFF09")}><textarea value={tx(m.note)} onChange={e => setM({ ...m, note: e.target.value })}/></Field>{tx(error && <p role="alert" className="warning">{tx(error)}</p>)}<div className="actions"><button className="primary" disabled={saving}>{tx("\u4FDD\u5B58\u6210\u7EE9")}</button><button type="button" className="secondary" onClick={close}>{tx("\u53D6\u6D88")}</button></div></form></DialogContent></Dialog>; }
export default function Workspace() { const [lang, setLang] = useState<Lang>('zh'); useEffect(() => { const saved = localStorage.getItem('grad-atlas-language'); if (saved === 'en' || saved === 'zh')
    setLang(saved); }, []); useEffect(() => { localStorage.setItem('grad-atlas-language', lang); document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN'; }, [lang]); return <LanguageContext.Provider value={lang}><WorkspaceContent lang={lang} setLang={setLang}/></LanguageContext.Provider>; }
