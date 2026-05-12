'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  Building2, Calculator, Sparkles, FileText, Bot, FolderOpen, Plus, Trash2, Download,
  Upload, Loader2, Moon, Sun, Languages, BarChart3, LayoutDashboard, ArrowRight,
  CheckCircle2, FileSpreadsheet, FileDown, Send, Image as ImageIcon, X, Wand2, Layers, Hammer, PaintBucket, Box, Zap
} from 'lucide-react'
import { getT } from '@/lib/i18n'
import { calculators } from '@/lib/calculators'

const HERO_IMG = 'https://images.unsplash.com/photo-1721244654394-36a7bc2da288?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600'

export default function App() {
  const [view, setView] = useState('landing') // landing | app
  const [lang, setLang] = useState('en')
  const [dark, setDark] = useState(false)
  const [tab, setTab] = useState('overview')
  const [projects, setProjects] = useState([])
  const [activeProject, setActiveProject] = useState(null)
  const [showNew, setShowNew] = useState(false)

  const t = getT(lang)
  const rtl = lang === 'ar'

  // Apply dark mode + dir
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.dir = rtl ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }, [dark, rtl, lang])

  // Load projects
  useEffect(() => {
    if (view === 'app') loadProjects()
  }, [view])

  async function loadProjects() {
    try {
      const r = await fetch('/api/projects')
      const data = await r.json()
      setProjects(Array.isArray(data) ? data : [])
    } catch (e) { console.error(e) }
  }

  async function createProject(data) {
    const r = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    const p = await r.json()
    setProjects(prev => [p, ...prev])
    setActiveProject(p)
    setShowNew(false)
    setTab('calculators')
    toast.success(t.create + ' ✓')
  }

  async function deleteProject(id) {
    await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    setProjects(prev => prev.filter(p => p.id !== id))
    if (activeProject?.id === id) setActiveProject(null)
    toast.success(t.delete + ' ✓')
  }

  async function updateProject(updates) {
    if (!activeProject) return
    const next = { ...activeProject, ...updates }
    setActiveProject(next)
    setProjects(prev => prev.map(p => p.id === next.id ? next : p))
    await fetch(`/api/projects/${activeProject.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
  }

  if (view === 'landing') {
    return <Landing t={t} rtl={rtl} lang={lang} setLang={setLang} dark={dark} setDark={setDark} onEnter={() => setView('app')} />
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar t={t} rtl={rtl} lang={lang} setLang={setLang} dark={dark} setDark={setDark} onHome={() => setView('landing')} activeProject={activeProject} />
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid grid-cols-6 mb-6 h-12">
            <TabsTrigger value="overview" className="gap-2"><LayoutDashboard className="h-4 w-4" />{t.overview}</TabsTrigger>
            <TabsTrigger value="projects" className="gap-2"><FolderOpen className="h-4 w-4" />{t.projects}</TabsTrigger>
            <TabsTrigger value="calculators" className="gap-2"><Calculator className="h-4 w-4" />{t.calculators}</TabsTrigger>
            <TabsTrigger value="aivision" className="gap-2"><Sparkles className="h-4 w-4" />{t.aiVision}</TabsTrigger>
            <TabsTrigger value="boq" className="gap-2"><FileText className="h-4 w-4" />{t.boq}</TabsTrigger>
            <TabsTrigger value="assistant" className="gap-2"><Bot className="h-4 w-4" />{t.assistant}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><Overview t={t} projects={projects} setTab={setTab} setShowNew={setShowNew} setActiveProject={setActiveProject} /></TabsContent>
          <TabsContent value="projects"><ProjectsTab t={t} projects={projects} onCreate={() => setShowNew(true)} onOpen={(p) => { setActiveProject(p); setTab('calculators') }} onDelete={deleteProject} /></TabsContent>
          <TabsContent value="calculators"><CalculatorsTab t={t} activeProject={activeProject} updateProject={updateProject} /></TabsContent>
          <TabsContent value="aivision"><AIVisionTab t={t} activeProject={activeProject} updateProject={updateProject} /></TabsContent>
          <TabsContent value="boq"><BOQTab t={t} activeProject={activeProject} updateProject={updateProject} rtl={rtl} /></TabsContent>
          <TabsContent value="assistant"><AssistantTab t={t} activeProject={activeProject} /></TabsContent>
        </Tabs>
      </div>

      <NewProjectDialog open={showNew} onOpenChange={setShowNew} onCreate={createProject} t={t} />
    </div>
  )
}

function Landing({ t, rtl, lang, setLang, dark, setDark, onEnter }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/50 backdrop-blur sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-4 max-w-7xl flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center"><Building2 className="h-5 w-5 text-white" /></div>
            <span className="font-bold text-xl">{t.appName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}><Languages className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setDark(!dark)}>{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</Button>
            <Button onClick={onEnter} className="gap-2">{t.getStarted}<ArrowRight className="h-4 w-4 rtl:rotate-180" /></Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-cyan-50 to-white dark:from-blue-950/40 dark:via-slate-900 dark:to-background" />
        <div className="absolute top-20 -right-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-20 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 max-w-7xl py-20 lg:py-28 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="outline" className="gap-1 py-1.5 px-3"><Sparkles className="h-3 w-3" />{t.tagline}</Badge>
              <h1 className="text-5xl lg:text-6xl font-bold tracking-tight leading-tight bg-gradient-to-br from-foreground via-foreground to-blue-600 bg-clip-text text-transparent">{t.heroTitle}</h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">{t.heroSubtitle}</p>
              <div className="flex gap-3 flex-wrap">
                <Button size="lg" onClick={onEnter} className="gap-2 h-12 px-6 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600">{t.getStarted}<ArrowRight className="h-4 w-4 rtl:rotate-180" /></Button>
                <Button size="lg" variant="outline" className="h-12 px-6" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>{t.watchDemo}</Button>
              </div>
              <div className="flex gap-6 pt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" />AI-powered</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" />Cloud sync</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" />Pro exports</div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/30 to-cyan-400/30 blur-2xl rounded-3xl" />
              <img src={HERO_IMG} alt="Blueprint" className="relative rounded-2xl shadow-2xl border border-border/50 w-full" />
              <div className="absolute -bottom-6 -left-6 bg-card border rounded-xl shadow-xl p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center"><CheckCircle2 className="h-5 w-5 text-green-500" /></div>
                <div><div className="text-xs text-muted-foreground">AI Extracted</div><div className="font-bold">247 BOQ items</div></div>
              </div>
              <div className="absolute -top-4 -right-4 bg-card border rounded-xl shadow-xl p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><Sparkles className="h-5 w-5 text-blue-500" /></div>
                <div><div className="text-xs text-muted-foreground">Analysis</div><div className="font-bold">~12 sec</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="container mx-auto px-4 max-w-7xl py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-3">{t.features}</h2>
          <p className="text-muted-foreground text-lg">World-class tools for modern construction professionals.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Sparkles, title: t.aiExtract, desc: t.aiExtractDesc, color: 'from-blue-500 to-cyan-500' },
            { icon: Calculator, title: t.smartCalc, desc: t.smartCalcDesc, color: 'from-purple-500 to-pink-500' },
            { icon: FileText, title: t.boqGen, desc: t.boqGenDesc, color: 'from-orange-500 to-red-500' },
            { icon: FileDown, title: t.exports, desc: t.exportsDesc, color: 'from-green-500 to-emerald-500' },
            { icon: Bot, title: t.aiAssist, desc: t.aiAssistDesc, color: 'from-indigo-500 to-purple-500' },
            { icon: FolderOpen, title: t.multiProj, desc: t.multiProjDesc, color: 'from-cyan-500 to-blue-500' },
          ].map((f, i) => (
            <Card key={i} className="group hover:shadow-xl transition-all border-border/50 hover:-translate-y-1">
              <CardHeader>
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}><f.icon className="h-6 w-6 text-white" /></div>
                <CardTitle>{f.title}</CardTitle>
                <CardDescription className="leading-relaxed">{f.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-7xl pb-20">
        <Card className="bg-gradient-to-br from-blue-600 to-cyan-500 text-white border-0">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-3">Ready to transform your takeoff workflow?</h2>
            <p className="text-blue-50 mb-6 max-w-2xl mx-auto">Join thousands of engineers and contractors using {t.appName} to estimate faster, smarter, and with confidence.</p>
            <Button size="lg" variant="secondary" onClick={onEnter} className="gap-2 h-12 px-8">{t.getStarted}<ArrowRight className="h-4 w-4 rtl:rotate-180" /></Button>
          </CardContent>
        </Card>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © 2025 {t.appName}. Built for construction professionals.
      </footer>
    </div>
  )
}

function TopBar({ t, rtl, lang, setLang, dark, setDark, onHome, activeProject }) {
  return (
    <header className="border-b backdrop-blur sticky top-0 z-50 bg-background/80">
      <div className="container mx-auto px-4 max-w-7xl flex items-center justify-between h-16">
        <button onClick={onHome} className="flex items-center gap-2 hover:opacity-80">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center"><Building2 className="h-5 w-5 text-white" /></div>
          <span className="font-bold text-xl">{t.appName}</span>
        </button>
        <div className="flex items-center gap-3">
          {activeProject && <Badge variant="secondary" className="gap-1 hidden md:flex"><FolderOpen className="h-3 w-3" />{activeProject.name}</Badge>}
          <Button variant="ghost" size="icon" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}><Languages className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => setDark(!dark)}>{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</Button>
        </div>
      </div>
    </header>
  )
}

function Overview({ t, projects, setTab, setShowNew, setActiveProject }) {
  const totalItems = projects.reduce((s, p) => s + (p.boqItems?.length || 0), 0)
  const totalValue = projects.reduce((s, p) => s + (p.boqItems || []).reduce((a, i) => a + (Number(i.quantity || 0) * Number(i.unitPrice || 0)), 0), 0)
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={FolderOpen} label={t.totalProjects} value={projects.length} color="blue" />
        <StatCard icon={FileText} label={t.totalItems} value={totalItems} color="purple" />
        <StatCard icon={BarChart3} label={t.estimatedValue} value={`$${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} color="green" />
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t.recentProjects}</CardTitle>
          <Button onClick={() => setShowNew(true)} className="gap-2"><Plus className="h-4 w-4" />{t.newProject}</Button>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? <EmptyState t={t} onCreate={() => setShowNew(true)} /> : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.slice(0, 6).map(p => (
                <Card key={p.id} className="hover:shadow-md transition cursor-pointer" onClick={() => { setActiveProject(p); setTab('calculators') }}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold truncate">{p.name}</h3>
                      <Badge variant="outline">{p.currency}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{p.client || '—'}</p>
                    <p className="text-xs text-muted-foreground mt-1">{p.location || '—'}</p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <span className="text-sm text-muted-foreground">{p.boqItems?.length || 0} {t.items}</span>
                      <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = { blue: 'from-blue-500 to-cyan-500', purple: 'from-purple-500 to-pink-500', green: 'from-green-500 to-emerald-500' }
  return (
    <Card>
      <CardContent className="p-6 flex items-center gap-4">
        <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center`}><Icon className="h-7 w-7 text-white" /></div>
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold">{value}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ t, onCreate }) {
  return (
    <div className="text-center py-12">
      <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
      <p className="text-muted-foreground mb-4">{t.noProjects}</p>
      <Button onClick={onCreate} className="gap-2"><Plus className="h-4 w-4" />{t.newProject}</Button>
    </div>
  )
}

function ProjectsTab({ t, projects, onCreate, onOpen, onDelete }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div><CardTitle>{t.projects}</CardTitle><CardDescription>{projects.length} {t.items}</CardDescription></div>
        <Button onClick={onCreate} className="gap-2"><Plus className="h-4 w-4" />{t.newProject}</Button>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? <EmptyState t={t} onCreate={onCreate} /> : (
          <div className="space-y-2">
            {projects.map(p => (
              <div key={p.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-sm text-muted-foreground">{p.client || '—'} • {p.location || '—'} • {p.boqItems?.length || 0} {t.items}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => onOpen(p)}>{t.open}</Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function NewProjectDialog({ open, onOpenChange, onCreate, t }) {
  const [form, setForm] = useState({ name: '', client: '', location: '', currency: 'USD' })
  function submit() {
    if (!form.name.trim()) { toast.error('Name required'); return }
    onCreate(form)
    setForm({ name: '', client: '', location: '', currency: 'USD' })
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{t.newProject}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>{t.projectName}</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Tower A — Phase 1" /></div>
          <div><Label>{t.client}</Label><Input value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} /></div>
          <div><Label>{t.location}</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
          <div><Label>{t.currency}</Label>
            <Select value={form.currency} onValueChange={v => setForm({ ...form, currency: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="SAR">SAR (﷼)</SelectItem>
                <SelectItem value="AED">AED (د.إ)</SelectItem>
                <SelectItem value="EGP">EGP (£)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t.cancel}</Button>
          <Button onClick={submit}>{t.create}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CalculatorsTab({ t, activeProject, updateProject }) {
  const [selected, setSelected] = useState('floor')
  const [inputs, setInputs] = useState({})
  const [result, setResult] = useState(null)
  const calc = calculators[selected]

  function compute() {
    const nums = Object.fromEntries(Object.entries(inputs).map(([k, v]) => [k, Number(v) || 0]))
    try {
      const res = calc.calculate(nums)
      setResult(res)
    } catch (e) { toast.error('Invalid inputs') }
  }

  function addAllToBoq() {
    if (!activeProject) { toast.error('Select a project first'); return }
    if (!result?.items) return
    const newItems = result.items.map(it => ({
      id: crypto.randomUUID(), category: selected, description: it.description, quantity: Number(it.qty), unit: it.unit, unitPrice: 0,
    }))
    updateProject({ boqItems: [...(activeProject.boqItems || []), ...newItems] })
    toast.success(`Added ${newItems.length} items to BOQ`)
  }

  const icons = { floor: Layers, wall: Hammer, ceiling: Box, concrete: Box, steel: Zap }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1">
        <CardHeader><CardTitle>{t.calculators}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {Object.entries(calculators).map(([key, c]) => {
            const Icon = icons[key] || Calculator
            return (
              <button key={key} onClick={() => { setSelected(key); setResult(null); setInputs({}) }}
                className={`w-full text-start flex items-center gap-3 p-3 rounded-lg transition border ${selected === key ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent border-transparent'}`}>
                <Icon className="h-5 w-5" />
                <span className="font-medium">{c.name}</span>
              </button>
            )
          })}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>{calc.name}</CardTitle>
          <CardDescription>{activeProject ? `→ ${activeProject.name}` : 'No active project — select one to add results to BOQ'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {calc.inputs.map(inp => (
              <div key={inp}>
                <Label>{t[inp] || inp}</Label>
                <Input type="number" step="0.01" value={inputs[inp] || ''} onChange={e => setInputs({ ...inputs, [inp]: e.target.value })} />
              </div>
            ))}
          </div>
          <Button onClick={compute} className="gap-2 w-full"><Calculator className="h-4 w-4" />{t.calculate}</Button>

          {result && (
            <Card className="bg-accent/30 border-primary/30">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">{result.area ? t.area : result.volume ? t.volume : t.qty}</div>
                    <div className="text-3xl font-bold">{result.area || result.volume || result.weight} <span className="text-base text-muted-foreground">{result.unit}</span></div>
                  </div>
                  <Button onClick={addAllToBoq} className="gap-2" disabled={!activeProject}><Plus className="h-4 w-4" />{t.addToBoq}</Button>
                </div>
                <Separator />
                <div className="space-y-1.5">
                  {result.items.map((it, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span>{it.description}</span>
                      <Badge variant="secondary">{it.qty} {it.unit}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function AIVisionTab({ t, activeProject, updateProject }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [extracted, setExtracted] = useState(null)
  const fileRef = useRef(null)

  function handleFile(f) {
    if (!f) return
    if (f.size > 20 * 1024 * 1024) { toast.error('Max 20MB'); return }
    setFile(f)
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target.result)
    reader.readAsDataURL(f)
  }

  async function analyze() {
    if (!file) return
    setLoading(true); setExtracted(null)
    try {
      const dataUrl = preview
      const base64 = dataUrl.split(',')[1]
      const r = await fetch('/api/ai/extract', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
      })
      const data = await r.json()
      if (data.error) {
        if (String(data.error).toLowerCase().includes('budget')) {
          toast.error('AI credits exhausted. Please top up your Emergent LLM key budget.')
        } else {
          toast.error(data.error)
        }
        return
      }
      setExtracted(data)
      toast.success(`AI extracted ${data.items?.length || 0} items`)
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  function addAllToBoq() {
    if (!activeProject) { toast.error('Select a project first'); return }
    if (!extracted?.items) return
    const newItems = extracted.items.map(it => ({
      id: crypto.randomUUID(), category: it.category, description: it.description, quantity: Number(it.quantity), unit: it.unit, unitPrice: Number(it.unitPrice) || 0, confidence: it.confidence,
    }))
    updateProject({ boqItems: [...(activeProject.boqItems || []), ...newItems] })
    toast.success(`Added ${newItems.length} items to BOQ`)
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Wand2 className="h-5 w-5 text-primary" />{t.aiExtract}</CardTitle>
          <CardDescription>{t.aiExtractDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]) }}
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-accent/30 transition">
            {preview ? (
              <div className="relative">
                <img src={preview} alt="" className="max-h-64 mx-auto rounded" />
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); setExtracted(null) }} className="absolute top-2 right-2"><X className="h-4 w-4" /></Button>
              </div>
            ) : (
              <>
                <Upload className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="font-medium">{t.dropFiles}</p>
                <p className="text-sm text-muted-foreground mt-1">{t.supportedFormats}</p>
              </>
            )}
            <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
          </div>

          <Button onClick={analyze} disabled={!file || loading} className="w-full gap-2 h-12 bg-gradient-to-r from-blue-600 to-cyan-500">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" />{t.analyzing}</> : <><Sparkles className="h-4 w-4" />Analyze with AI</>}
          </Button>
          {loading && <Progress value={66} className="h-2" />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div><CardTitle>{t.extractedItems}</CardTitle><CardDescription>{extracted?.items?.length || 0} items detected</CardDescription></div>
          {extracted && <Button onClick={addAllToBoq} size="sm" disabled={!activeProject} className="gap-2"><Plus className="h-4 w-4" />{t.addToBoq}</Button>}
        </CardHeader>
        <CardContent>
          {!extracted ? (
            <div className="text-center py-12 text-muted-foreground"><ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />Upload a drawing to see AI extraction</div>
          ) : (
            <ScrollArea className="h-[420px] pr-3">
              {extracted.summary && (
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <Mini label="Rooms" value={extracted.summary.totalRooms} />
                  <Mini label="Area m²" value={extracted.summary.totalArea} />
                  <Mini label="Doors" value={extracted.summary.totalDoors} />
                  <Mini label="Windows" value={extracted.summary.totalWindows} />
                </div>
              )}
              {extracted.rooms?.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm font-semibold mb-2">Rooms ({extracted.rooms.length})</div>
                  <div className="space-y-1.5">
                    {extracted.rooms.map((r, i) => (
                      <div key={i} className="text-xs flex justify-between p-2 bg-accent/30 rounded">
                        <span className="font-medium">{r.name}</span>
                        <span className="text-muted-foreground">{r.width}×{r.length}m = <b>{r.area} m²</b></span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {extracted.openings?.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm font-semibold mb-2">Openings ({extracted.openings.length})</div>
                  <div className="space-y-1.5">
                    {extracted.openings.map((o, i) => (
                      <div key={i} className="text-xs flex justify-between p-2 bg-accent/30 rounded">
                        <span><Badge variant="outline" className="me-2">{o.type}</Badge>{o.label || o.location}</span>
                        <span className="text-muted-foreground">{o.width}×{o.height}m = <b>{o.area} m²</b> {o.count > 1 && `(×${o.count})`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="text-sm font-semibold mb-2">BOQ Items</div>
              <div className="space-y-2">
                {extracted.items?.map((it, i) => (
                  <div key={i} className="p-3 border rounded-lg flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{it.description}</div>
                      <div className="text-xs text-muted-foreground">{it.category} • {it.location || '—'}</div>
                    </div>
                    <div className="text-end">
                      <div className="font-bold">{it.quantity} <span className="text-xs font-normal text-muted-foreground">{it.unit}</span></div>
                      <div className="text-xs text-muted-foreground">{Math.round((it.confidence || 0) * 100)}% {t.confidence}</div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Mini({ label, value }) {
  return <div className="bg-accent/40 rounded-lg p-2 text-center"><div className="text-xs text-muted-foreground">{label}</div><div className="font-bold">{value ?? '—'}</div></div>
}

function BOQTab({ t, activeProject, updateProject, rtl }) {
  if (!activeProject) return (
    <Card><CardContent className="py-16 text-center text-muted-foreground"><FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />Select a project to view its BOQ</CardContent></Card>
  )

  const items = activeProject.boqItems || []
  const grandTotal = items.reduce((s, it) => s + (Number(it.quantity || 0) * Number(it.unitPrice || 0)), 0)
  const cur = activeProject.currency || 'USD'

  function updateItem(idx, patch) {
    const next = items.map((it, i) => i === idx ? { ...it, ...patch } : it)
    updateProject({ boqItems: next })
  }
  function removeItem(idx) {
    updateProject({ boqItems: items.filter((_, i) => i !== idx) })
  }
  function addItem() {
    updateProject({ boqItems: [...items, { id: crypto.randomUUID(), category: 'other', description: 'New item', quantity: 1, unit: 'pcs', unitPrice: 0 }] })
  }

  async function exportPDF() {
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default
    const doc = new jsPDF()
    doc.setFontSize(18); doc.text('Bill of Quantities', 14, 18)
    doc.setFontSize(11); doc.text(`Project: ${activeProject.name}`, 14, 28)
    doc.text(`Client: ${activeProject.client || '-'}`, 14, 34)
    doc.text(`Location: ${activeProject.location || '-'}`, 14, 40)
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 46)
    autoTable(doc, {
      startY: 52,
      head: [['#', 'Category', 'Description', 'Qty', 'Unit', `Unit Price (${cur})`, `Total (${cur})`]],
      body: items.map((it, i) => [i + 1, it.category, it.description, it.quantity, it.unit, Number(it.unitPrice).toFixed(2), (Number(it.quantity) * Number(it.unitPrice)).toFixed(2)]),
      foot: [['', '', '', '', '', 'GRAND TOTAL', grandTotal.toFixed(2)]],
      headStyles: { fillColor: [37, 99, 235] }, footStyles: { fillColor: [219, 234, 254], textColor: 20, fontStyle: 'bold' },
    })
    doc.save(`BOQ_${activeProject.name}.pdf`)
    toast.success('PDF exported')
  }

  async function exportExcel() {
    const XLSX = await import('xlsx')
    const rows = items.map((it, i) => ({ '#': i + 1, Category: it.category, Description: it.description, Qty: Number(it.quantity), Unit: it.unit, [`Unit Price (${cur})`]: Number(it.unitPrice), [`Total (${cur})`]: Number(it.quantity) * Number(it.unitPrice) }))
    rows.push({ Description: 'GRAND TOTAL', [`Total (${cur})`]: grandTotal })
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'BOQ')
    XLSX.writeFile(wb, `BOQ_${activeProject.name}.xlsx`)
    toast.success('Excel exported')
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
        <div>
          <CardTitle>{t.boq} — {activeProject.name}</CardTitle>
          <CardDescription>{items.length} {t.items}</CardDescription>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={addItem} className="gap-2"><Plus className="h-4 w-4" />{t.addItem}</Button>
          <Button variant="outline" onClick={exportPDF} className="gap-2"><FileDown className="h-4 w-4" />{t.exportPdf}</Button>
          <Button onClick={exportExcel} className="gap-2"><FileSpreadsheet className="h-4 w-4" />{t.exportExcel}</Button>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground"><FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />No items yet. Use Calculators or AI Vision to populate.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-start p-2">#</th>
                  <th className="text-start p-2">{t.description}</th>
                  <th className="text-start p-2">{t.qty}</th>
                  <th className="text-start p-2">{t.unit}</th>
                  <th className="text-start p-2">{t.unitPrice} ({cur})</th>
                  <th className="text-end p-2">{t.total}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => {
                  const total = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)
                  return (
                    <tr key={it.id || i} className="border-b hover:bg-accent/30">
                      <td className="p-2 text-muted-foreground">{i + 1}</td>
                      <td className="p-2"><Input value={it.description} onChange={e => updateItem(i, { description: e.target.value })} className="h-8" /></td>
                      <td className="p-2"><Input type="number" value={it.quantity} onChange={e => updateItem(i, { quantity: e.target.value })} className="h-8 w-20" /></td>
                      <td className="p-2"><Input value={it.unit} onChange={e => updateItem(i, { unit: e.target.value })} className="h-8 w-16" /></td>
                      <td className="p-2"><Input type="number" value={it.unitPrice} onChange={e => updateItem(i, { unitPrice: e.target.value })} className="h-8 w-24" /></td>
                      <td className="p-2 text-end font-medium">{total.toFixed(2)}</td>
                      <td className="p-2"><Button variant="ghost" size="icon" onClick={() => removeItem(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-accent/40 font-bold">
                  <td colSpan="5" className="p-3 text-end">{t.grandTotal}</td>
                  <td className="p-3 text-end text-lg">{grandTotal.toFixed(2)} {cur}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function AssistantTab({ t, activeProject }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '👋 Hi! I am your construction estimation assistant. Ask me about quantities, materials, BOQ standards, formulas, or anything related to your project.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const sessionId = useMemo(() => crypto.randomUUID(), [])
  const scrollRef = useRef(null)

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send() {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', content: input }
    const next = [...messages, userMsg]
    setMessages(next); setInput(''); setLoading(true)
    try {
      const r = await fetch('/api/ai/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, sessionId, projectContext: activeProject }),
      })
      const data = await r.json()
      if (data.error) { toast.error(data.error); return }
      setMessages([...next, { role: 'assistant', content: data.reply }])
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  return (
    <Card className="flex flex-col h-[calc(100vh-220px)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-primary" />{t.assistant}</CardTitle>
        {activeProject && <CardDescription>Context: {activeProject.name}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-6">
          <div className="space-y-4 py-2">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 whitespace-pre-wrap ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && <div className="flex justify-start"><div className="bg-muted rounded-2xl px-4 py-2.5"><Loader2 className="h-4 w-4 animate-spin" /></div></div>}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
      </CardContent>
      <div className="border-t p-4 flex gap-2">
        <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder={t.chatPlaceholder} disabled={loading} />
        <Button onClick={send} disabled={loading || !input.trim()} className="gap-2"><Send className="h-4 w-4" />{t.send}</Button>
      </div>
    </Card>
  )
}
