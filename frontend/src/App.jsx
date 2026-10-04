import { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, AlertTriangle, ArrowDownToLine, ArrowRight, Check, CheckCheck, ChevronDown, CircleHelp, Clock3, Copy, FileText, Fingerprint, Gauge, LayoutDashboard, LoaderCircle, Plus, Search, ShieldCheck, Upload, X, Zap } from 'lucide-react';
import { analyzeIncident, healthCheck, runDemo } from './services/api.js';

const NAV = ['Dashboard', 'Analyze Incident', 'Demo', 'About'];
const TABS = ['Overview', 'Timeline', 'Evidence', 'Root Cause', 'Conflicts', 'Actions'];
const STATUSES = ['Investigating', 'Identified', 'Monitoring', 'Resolved'];
const ACCEPTED = new Set(['txt', 'log', 'csv', 'pdf']);
const MAX_FILE = 20 * 1024 * 1024;

function Badge({ children, tone = '' }) { return <span className={`badge ${tone}`}>{children}</span>; }
function IconBox({ children, tone = '' }) { return <span className={`icon-box ${tone}`}>{children}</span>; }
function Panel({ title, icon, action, children, className = '' }) { return <section className={`panel ${className}`}><header className="panel-head"><div className="panel-title"><IconBox>{icon}</IconBox><h2>{title}</h2></div>{action}</header>{children}</section>; }
function Spinner() { return <LoaderCircle className="spin" size={16} aria-hidden="true"/>; }
function fileIssue(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (!ACCEPTED.has(ext)) return `${file.name}: unsupported file type. Choose CSV, TXT, LOG, or PDF.`;
  if (file.size > MAX_FILE) return `${file.name}: file exceeds the 20 MB limit.`;
  if (!file.size) return `${file.name}: file is empty.`;
  return '';
}

export default function App() {
  const [page, setPage] = useState('Dashboard');
  const [tab, setTab] = useState('Overview');
  const [data, setData] = useState(null);
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [apiOnline, setApiOnline] = useState(false);
  const [status, setStatus] = useState('Investigating');
  const [completed, setCompleted] = useState({});
  const [evidenceType, setEvidenceType] = useState('All');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { healthCheck().then(() => setApiOnline(true)).catch(() => setApiOnline(false)); }, []);
  useEffect(() => { if (!toast) return undefined; const timer = setTimeout(() => setToast(''), 2200); return () => clearTimeout(timer); }, [toast]);

  function newIncident() {
    setData(null); setFiles([]); setTab('Overview'); setStatus('Investigating'); setCompleted({}); setEvidenceType('All'); setSearch(''); setError(''); setPage('Analyze Incident');
    if (inputRef.current) inputRef.current.value = '';
  }
  function addFiles(incoming) {
    const list = [...incoming];
    const issue = list.map(fileIssue).find(Boolean);
    if (issue) { setError(issue); return; }
    setError('');
    setFiles((current) => {
      const merged = [...current];
      list.forEach((file) => { if (!merged.some((f) => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified)) merged.push(file); });
      return merged;
    });
  }
  function removeFile(index) { setFiles((current) => current.filter((_, i) => i !== index)); setError(''); if (inputRef.current) inputRef.current.value = ''; }
  function clearFiles() { setFiles([]); setError(''); if (inputRef.current) inputRef.current.value = ''; }
  async function execute(action) {
    setBusy(true); setError('');
    try {
      const result = await action();
      setData(result); setTab('Overview'); setStatus('Investigating'); setCompleted({}); setPage('Incident'); setApiOnline(true);
    } catch (err) { setError(err.message || 'Analysis failed. Please try again.'); }
    finally { setBusy(false); }
  }
  function navigate(item) {
    setError('');
    if (item === 'Demo') { setPage('Analyze Incident'); execute(runDemo); return; }
    setPage(item);
  }
  function toggleAction(index) { setCompleted((current) => ({ ...current, [index]: !current[index] })); }
  const actions = data?.recommended_actions || [];
  const evidence = useMemo(() => (data?.evidence || []).filter((row) => (evidenceType === 'All' || row.type === evidenceType) && `${row.source} ${row.finding}`.toLowerCase().includes(search.toLowerCase())), [data, evidenceType, search]);
  const allComplete = actions.length > 0 && actions.every((_, i) => completed[i]);
  const severity = data?.severity || 'LOW';

  async function copySummary() {
    try { await navigator.clipboard.writeText(data.summary || ''); setToast('Summary copied'); }
    catch { setToast('Clipboard unavailable in this browser'); }
  }
  function exportReport() {
    const report = { incident_id: data.incident_id, title: data.title, severity: data.severity, status, summary: data.summary, impact: data.impact, timeline: data.timeline, evidence: data.evidence, root_cause_candidates: data.root_cause_candidates, conflicts: data.conflicts, unknowns: data.unknowns, recommended_actions: data.recommended_actions };
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${(data.incident_id || 'incident').toLowerCase()}-report.json`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); setToast('Report downloaded');
  }

  return <div className="app">
    <header className="topbar"><button className="brand" onClick={() => navigate('Dashboard')} aria-label="IncidentIQ dashboard"><span className="brand-symbol"><Fingerprint size={22}/></span><span>Incident<span>IQ</span><small>INCIDENT RECONSTRUCTION</small></span></button>
      <nav className="main-nav" aria-label="Main navigation">{NAV.map((item) => <button key={item} disabled={busy} className={`${page === item || (item === 'Analyze Incident' && page === 'Incident') ? 'active' : ''}`} onClick={() => navigate(item)}>{item === 'Demo' && <Zap size={14}/ >}{item}</button>)}</nav>
      <div className="top-actions"><span className={`api-status ${apiOnline ? 'online' : 'offline'}`}><i/>{apiOnline ? 'System status: Online' : 'API offline'}</span><button className="button primary small" disabled={busy} onClick={newIncident}><Plus size={15}/>New Incident</button></div>
    </header>

    <main className="main-content">
      {page === 'Dashboard' && <Dashboard data={data} status={status} busy={busy} onAnalyze={() => navigate('Analyze Incident')} onDemo={() => navigate('Demo')} onOpen={() => setPage('Incident')}/>}
      {page === 'Analyze Incident' && <section className="page narrow"><PageHeading eyebrow="EVIDENCE INTAKE" title="Analyze Incident" description="Upload fragmented evidence and reconstruct a traceable incident story."/>
        <Panel title="Upload incident evidence" icon={<Upload size={17}/>} action={<span className="quiet">UP TO 20 MB PER FILE</span>}>
          <div className="dropzone" role="button" tabIndex="0" onClick={() => inputRef.current?.click()} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}>
            <input ref={inputRef} type="file" multiple accept=".csv,.txt,.log,.pdf" onChange={(e) => addFiles(e.target.files)} aria-label="Choose incident evidence files"/>
            <IconBox tone="large"><Upload size={21}/></IconBox><strong>Drag &amp; drop files here</strong><span>or <button className="inline-link" type="button" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>choose files</button></span><small>CSV, TXT, LOG, and PDF documents</small>
          </div>
          {files.length > 0 && <div className="file-section"><div className="file-section-head"><b>Selected files <span>{files.length}</span></b><button className="text-button danger-text" onClick={clearFiles}>Clear all</button></div><div className="file-list">{files.map((file, i) => <div className="file-row" key={`${file.name}-${file.lastModified}-${i}`}><IconBox><FileText size={16}/></IconBox><div className="file-meta"><b>{file.name}</b><small>{file.name.split('.').pop().toUpperCase()} · {formatSize(file.size)}</small></div><button className="icon-button" aria-label={`Remove ${file.name}`} title={`Remove ${file.name}`} onClick={() => removeFile(i)}><X size={16}/></button></div>)}</div></div>}
          {error && <ErrorMessage message={error}/>}<div className="upload-footer"><span><ShieldCheck size={15}/> Files are processed locally by your IncidentIQ backend.</span><button className="button primary" disabled={!files.length || busy} onClick={() => execute(() => analyzeIncident(files))}>{busy ? <><Spinner/>Analyzing incident…</> : <>Analyze Incident <ArrowRight size={15}/></>}</button></div>
        </Panel>
        <div className="demo-callout"><span className="demo-icon"><Zap size={17}/></span><div><b>Want to see IncidentIQ in action?</b><p>Use the included multi-source payment incident. No API key or uploads needed.</p></div><button className="button secondary" disabled={busy} onClick={() => execute(runDemo)}>{busy ? <Spinner/> : <Zap size={15}/>}Run Demo Incident</button></div>
      </section>}
      {page === 'Incident' && data && <IncidentPage data={data} tab={tab} setTab={setTab} status={status} setStatus={setStatus} actions={actions} completed={completed} toggleAction={toggleAction} allComplete={allComplete} markAll={() => setCompleted(Object.fromEntries(actions.map((_, i) => [i, true])))} resetActions={() => setCompleted({})} evidence={evidence} evidenceType={evidenceType} setEvidenceType={setEvidenceType} search={search} setSearch={setSearch} copySummary={copySummary} exportReport={exportReport} newIncident={newIncident}/>}
      {page === 'Incident' && !data && <EmptyPage title="No incident loaded" text="Run a demo or analyze evidence to see your incident reconstruction." action="Analyze Incident" onClick={() => setPage('Analyze Incident')}/>}
      {page === 'About' && <AboutPage onAnalyze={() => navigate('Analyze Incident')} onDemo={() => navigate('Demo')}/>}
      {toast && <div className="toast" role="status"><Check size={15}/>{toast}</div>}
    </main>
    <footer className="site-footer"><span>INCIDENTIQ <i>·</i> EVIDENCE-DRIVEN INCIDENT RECONSTRUCTION</span><span>Facts, inferences, and unknowns kept distinct.</span></footer>
  </div>;
}

function formatSize(size) { if (size < 1024) return `${size} B`; if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} KB`; return `${(size / 1024 / 1024).toFixed(1)} MB`; }
function PageHeading({ eyebrow, title, description, action }) { return <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action}</div>; }
function ErrorMessage({ message }) { return <div className="error-message" role="alert"><AlertTriangle size={16}/><span>{message}</span></div>; }
function EmptyPage({ title, text, action, onClick }) { return <div className="empty-page"><IconBox tone="large"><CircleHelp size={22}/></IconBox><h2>{title}</h2><p>{text}</p><button className="button primary" onClick={onClick}>{action}<ArrowRight size={15}/></button></div>; }

function Dashboard({ data, status, busy, onAnalyze, onDemo, onOpen }) {
  const high = data && ['HIGH', 'CRITICAL'].includes(data.severity) ? 1 : 0;
  const sources = new Set((data?.evidence || []).map((item) => item.source)).size;
  return <section className="page"><PageHeading eyebrow="INCIDENT OPERATIONS" title="IncidentIQ" description="Evidence-Driven Incident Reconstruction" action={<span className="dashboard-mark"><Activity size={15}/> Evidence-first analysis</span>}/>
    <div className="welcome-banner"><div><span className="eyebrow">INCIDENT RESPONSE, WITH CONTEXT</span><h2>Turn fragmented evidence into a clear incident story.</h2><p>Trace what happened, when it happened, and what evidence supports each conclusion.</p><div className="welcome-actions"><button className="button primary" onClick={onAnalyze}>Analyze Incident <ArrowRight size={15}/></button><button className="button secondary" onClick={onDemo}><Zap size={15}/>Run Demo</button></div></div><div className="welcome-art"><div className="art-line line-one"/><div className="art-line line-two"/><div className="art-node"><Activity size={25}/></div><span>LOGS</span><span>METRICS</span><span>EVENTS</span></div></div>
    <div className="stat-grid"><Stat title="Total Incidents" value={data ? 1 : 0} detail={data ? 'Current workspace' : 'No incidents yet'} icon={<LayoutDashboard size={17}/>} tone="blue"/><Stat title="High Severity" value={high} detail="High or critical" icon={<AlertTriangle size={17}/>} tone="red"/><Stat title="Open Investigations" value={data && status !== 'Resolved' ? 1 : 0} detail="Awaiting resolution" icon={<Activity size={17}/>} tone="amber"/><Stat title="Evidence Sources" value={sources} detail={data ? 'Analyzed artifacts' : 'Upload to get started'} icon={<FileText size={17}/>} tone="green"/></div>
    {data ? <section className="panel recent-panel"><header className="panel-head"><div className="panel-title"><IconBox><Clock3 size={17}/></IconBox><h2>Current investigation</h2></div><button className="text-button" onClick={onAnalyze}>New analysis <ArrowRight size={14}/></button></header><button className="incident-row" onClick={onOpen}><Badge tone={`severity-${data.severity?.toLowerCase()}`}>{data.severity}</Badge><div><b>{data.title}</b><small>{data.incident_id} · {data.evidence?.length || 0} evidence items</small></div><ArrowRight size={16}/></button></section> : <section className="first-incident"><IconBox tone="large"><Gauge size={21}/></IconBox><h2>Analyze your first incident</h2><p>Bring logs, metrics, tickets, and engineer notes together in one traceable reconstruction.</p><div className="welcome-actions"><button className="button primary" disabled={busy} onClick={onAnalyze}>Analyze Incident <ArrowRight size={15}/></button><button className="button secondary" disabled={busy} onClick={onDemo}>{busy ? <Spinner/> : <Zap size={15}/>}Run Demo</button></div></section>}
  </section>;
}
function Stat({ title, value, detail, icon, tone }) { return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><span>{title}</span><strong>{value}</strong><small>{detail}</small></div>; }

function IncidentPage({ data, tab, setTab, status, setStatus, actions, completed, toggleAction, allComplete, markAll, resetActions, evidence, evidenceType, setEvidenceType, search, setSearch, copySummary, exportReport, newIncident }) {
  return <section className="page"><PageHeading eyebrow="INCIDENT RECONSTRUCTION" title={data.title || 'Incident overview'} description={`${data.incident_id || 'Incident'} · Reconstructed from ${data.evidence?.length || 0} evidence items`} action={<div className="heading-actions"><button className="button secondary" onClick={copySummary}><Copy size={15}/>Copy Summary</button><button className="button secondary" onClick={exportReport}><ArrowDownToLine size={15}/>Export Report</button></div>}/>
    <div className="incident-banner"><div className="incident-id"><span>{data.incident_id || 'INC-001'}</span><Badge tone={`severity-${(data.severity || 'LOW').toLowerCase()}`}>{data.severity || 'LOW'}</Badge>{data.analysis_mode === 'DEMO' && <Badge tone="demo-mode"><Zap size={12}/>Demo Mode</Badge>}</div><label className="status-control">Incident status<select value={status} onChange={(e) => setStatus(e.target.value)}>{STATUSES.map((value) => <option key={value}>{value}</option>)}</select><ChevronDown size={14}/></label></div>
    <div className="incident-stats"><div><b>{data.evidence?.length || 0}</b><span>Evidence items</span></div><div><b>{data.timeline?.length || 0}</b><span>Timeline events</span></div><div><b>{data.unknowns?.length || 0}</b><span>Unknowns</span></div><div><b>{data.root_cause_candidates?.length || 0}</b><span>Cause candidates</span></div></div>
    <div className="tabs" role="tablist" aria-label="Incident sections">{TABS.map((item) => <button role="tab" aria-selected={tab === item} key={item} className={tab === item ? 'selected' : ''} onClick={() => setTab(item)}>{item}</button>)}</div>
    {tab === 'Overview' && <Overview data={data} setTab={setTab}/>}
    {tab === 'Timeline' && <TimelinePanel events={data.timeline || []}/>}
    {tab === 'Evidence' && <EvidencePanel evidence={evidence} type={evidenceType} setType={setEvidenceType} search={search} setSearch={setSearch}/>}
    {tab === 'Root Cause' && <RootCausePanel causes={data.root_cause_candidates || []}/>}
    {tab === 'Conflicts' && <ConflictsPanel conflicts={data.conflicts || []} unknowns={data.unknowns || []}/>}
    {tab === 'Actions' && <ActionsPanel actions={actions} completed={completed} toggle={toggleAction} allComplete={allComplete} markAll={markAll} reset={resetActions}/>}
    <div className="new-incident-row"><span>Need to investigate another event?</span><button className="text-button" onClick={newIncident}>Start a new incident <ArrowRight size={14}/></button></div>
  </section>;
}

function Overview({ data, setTab }) {
  const causes = data.root_cause_candidates || [];
  return <div className="content-grid">
    <Panel title="What happened?" icon={<FileText size={17}/>} className="span-2"><p className="summary-text">{data.summary || 'No summary was returned for this incident.'}</p><div className="impact-block"><h3>System &amp; business impact</h3>{data.impact?.length ? <ul className="bullet-list">{data.impact.map((item, i) => <li key={i}>{item}</li>)}</ul> : <EmptyInline>No confirmed impact was identified.</EmptyInline>}</div><div className="overview-actions"><button className="button secondary small" onClick={() => setTab('Timeline')}>Explore timeline <ArrowRight size={14}/></button><button className="button secondary small" onClick={() => setTab('Evidence')}>Review evidence <ArrowRight size={14}/></button></div></Panel>
    <Panel title="Root cause" icon={<Fingerprint size={17}/>} action={<Badge tone="unknown">{causes.length ? (causes[0].status || 'POSSIBLE').replace('_', ' ') : 'UNKNOWN'}</Badge>}>{causes.length ? causes.map((cause, i) => <CauseCard cause={cause} key={i}/>) : <EmptyInline>Root cause is unknown from the available evidence.</EmptyInline>}</Panel>
    <Panel title="Key findings" icon={<ShieldCheck size={17}/>}><div className="key-finding"><b>{data.evidence?.length || 0}</b><span>Evidence sources analyzed</span></div><div className="key-finding"><b>{data.unknowns?.length || 0}</b><span>Open questions remain</span></div><button className="text-button" onClick={() => setTab('Conflicts')}>Review conflicts and unknowns <ArrowRight size={13}/></button></Panel>
    <Panel title="Timeline highlights" icon={<Clock3 size={17}/>} action={<button className="text-button" onClick={() => setTab('Timeline')}>Full timeline <ArrowRight size={13}/></button>} className="span-2"><Timeline events={(data.timeline || []).slice(0, 4)}/></Panel>
  </div>;
}
function EmptyInline({ children }) { return <div className="empty-inline"><CircleHelp size={16}/>{children}</div>; }
function Timeline({ events }) { if (!events?.length) return <EmptyInline>No timeline events were found.</EmptyInline>; return <div className="timeline">{events.map((event, i) => <div className="timeline-item" key={`${event.time}-${i}`}><time>{event.time}</time><span className={`timeline-dot ${event.classification === 'INFERENCE' ? 'inference' : ''}`}/><div className="timeline-copy"><p>{event.event}</p><div className="trace"><span><FileText size={13}/>{event.source || 'Source unknown'}</span><Badge tone={event.classification === 'INFERENCE' ? 'inference' : 'fact'}>{event.classification || 'FACT'}</Badge></div></div></div>)}</div>; }
function TimelinePanel({ events }) { return <Panel title="Incident timeline" icon={<Clock3 size={17}/>} action={<span className="quiet">CHRONOLOGICAL EVIDENCE</span>}><Timeline events={events}/></Panel>; }
function EvidencePanel({ evidence, type, setType, search, setSearch }) { return <Panel title="Evidence sources" icon={<FileText size={17}/>} action={<span className="quiet">{evidence.length} FINDINGS</span>}><div className="evidence-tools"><label className="search-box"><Search size={16}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search source or finding" aria-label="Search evidence"/></label><div className="filter-group" aria-label="Filter evidence type">{['All', 'FACT', 'INFERENCE'].map((option) => <button className={type === option ? 'chosen' : ''} key={option} onClick={() => setType(option)}>{option}</button>)}</div></div>{evidence.length ? <div className="evidence-table-wrap"><table className="evidence-table"><thead><tr><th>Source</th><th>Finding</th><th>Classification</th></tr></thead><tbody>{evidence.map((item, i) => <tr key={`${item.source}-${i}`}><td className="mono">{item.source}</td><td>{item.finding}</td><td><Badge tone={item.type === 'INFERENCE' ? 'inference' : 'fact'}>{item.type || 'FACT'}</Badge></td></tr>)}</tbody></table></div> : <EmptyInline>No evidence matches this search and filter.</EmptyInline>}</Panel>; }
function CauseCard({ cause }) { const confidence = Math.max(0, Math.min(100, Number(cause.confidence) || 0)); const status = (cause.status || 'POSSIBLE').replaceAll('_', ' '); return <article className="cause-card"><div className="cause-top"><b>{cause.cause}</b><Badge tone={status === 'CONFIRMED' ? 'success' : 'unknown'}>{status}</Badge></div><div className="confidence-label"><span>Confidence</span><b>{confidence}%</b></div><div className="progress"><span style={{ width: `${confidence}%` }}/></div>{cause.evidence?.length ? <ul className="source-points">{cause.evidence.map((item, i) => <li key={i}>{item}</li>)}</ul> : <p className="quiet">No supporting evidence was returned.</p>}</article>; }
function RootCausePanel({ causes }) { return <Panel title="Root cause candidates" icon={<Fingerprint size={17}/>} action={<Badge tone="unknown">UNCONFIRMED</Badge>}>{causes.length ? <div className="cause-grid">{causes.map((cause, i) => <CauseCard cause={cause} key={i}/>)}</div> : <EmptyInline>No root cause candidates were identified. The cause remains unknown.</EmptyInline>}</Panel>; }
function ConflictsPanel({ conflicts, unknowns }) { return <div className="content-grid"><Panel title="Conflicting evidence" icon={<AlertTriangle size={17}/>} action={<Badge tone={conflicts.length ? 'warning' : 'success'}>{conflicts.length ? `${conflicts.length} CONFLICT${conflicts.length > 1 ? 'S' : ''}` : 'NO CONFLICTS'}</Badge>}>{conflicts.length ? conflicts.map((item, i) => <article className="conflict-card" key={i}><b><AlertTriangle size={15}/> Conflict detected</b><p>{item}</p></article>) : <EmptyInline>No conflicts detected across the supplied sources.</EmptyInline>}</Panel><Panel title="What remains unknown" icon={<CircleHelp size={17}/>} action={<Badge tone="unknown">{unknowns.length} OPEN</Badge>}>{unknowns.length ? <ul className="unknown-list">{unknowns.map((item, i) => <li key={i}>{item}</li>)}</ul> : <EmptyInline>No unknowns were reported.</EmptyInline>}</Panel></div>; }
function ActionsPanel({ actions, completed, toggle, allComplete, markAll, reset }) { return <Panel title="Recommended actions" icon={<Check size={17}/>} action={<div className="action-tools"><button className="text-button" onClick={markAll} disabled={!actions.length || allComplete}><CheckCheck size={14}/>Mark all complete</button><button className="text-button" onClick={reset} disabled={!actions.length || !Object.values(completed).some(Boolean)}>Reset actions</button></div>}>{actions.length ? <div className="action-list">{actions.map((action, i) => <label className={`action-row ${completed[i] ? 'done' : ''}`} key={i}><input type="checkbox" checked={!!completed[i]} onChange={() => toggle(i)}/><span className="action-number">{String(i + 1).padStart(2, '0')}</span><span>{action}</span></label>)}</div> : <EmptyInline>No recommended actions were returned.</EmptyInline>}</Panel>; }

function AboutPage({ onAnalyze, onDemo }) { const features = ['Multi-source evidence processing', 'Source-linked timeline reconstruction', 'Fact and inference traceability', 'Root cause candidates with confidence', 'Conflict and unknown detection', 'Actionable recommendations']; return <section className="page"><PageHeading eyebrow="ABOUT INCIDENTIQ" title="Clarity when incidents get complicated." description="Evidence-Driven Incident Reconstruction using Generative AI"/><div className="about-hero"><IconBox tone="large"><Fingerprint size={25}/></IconBox><h2>Reconstruct the story behind an incident.</h2><p>IncidentIQ helps operations teams connect fragmented logs, monitoring exports, support tickets, and engineer notes. Every reconstruction keeps facts, inferences, conflicts, and unknowns visible.</p><div className="welcome-actions"><button className="button primary" onClick={onAnalyze}>Analyze Incident <ArrowRight size={15}/></button><button className="button secondary" onClick={onDemo}><Zap size={15}/>Run Demo</button></div></div><div className="about-grid"><Panel title="What IncidentIQ does" icon={<Activity size={17}/>}><ul className="feature-list">{features.map((feature) => <li key={feature}><Check size={15}/>{feature}</li>)}</ul></Panel><Panel title="Technology" icon={<Gauge size={17}/>}><div className="tech-tags">{['React', 'Vite', 'FastAPI', 'Python', 'Pandas', 'PDF processing', 'LLM JSON output'].map((tag) => <span key={tag}>{tag}</span>)}</div><p className="about-note">The demo works without an LLM key. Configure a backend environment variable to enable optional model analysis.</p></Panel></div></section>; }
