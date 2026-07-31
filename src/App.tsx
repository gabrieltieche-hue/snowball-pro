import { useEffect, useRef, useState, useCallback } from "react"
import { Chart, registerables, ChartDataset } from "chart.js"
Chart.register(...registerables)

// ─── Types ────────────────────────────────────────────────────────────────────
interface YearRow {
  year: number
  date: string
  investedNom: number
  interestsNom: number
  nominal: number
  real: number
  taxNet: number
}

interface Settings {
  p: number
  m: number
  r: number
  t: number
  idx: number
  inf: number
  month: number
  envelope: string
  kraschYear: number
  kraschPct: number
  showReal: boolean
  activeTab: string
}

interface GoalResult {
  pmt: number | null
  rate: number | null
}

// ─── Constants ────────────────────────────────────────────────────────────────
const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
]

const ENVELOPES: Record<
  string,
  { name: string; desc: string; color: string; taxFn: (interests: number, years: number) => number }
> = {
  cto: {
    name: "Compte-Titres (CTO)",
    desc: "PFU 30% sur tous les gains",
    color: "#ef4444",
    taxFn: interests => interests * 0.3,
  },
  pea: {
    name: "PEA",
    desc: "Exonéré après 5 ans (17.2% PS)",
    color: "#6366f1",
    taxFn: (interests, years) => (years >= 5 ? interests * 0.172 : interests * 0.3),
  },
  av: {
    name: "Assurance Vie",
    desc: "7.5% + PS après 8 ans",
    color: "#f59e0b",
    taxFn: (interests, years) => (years >= 8 ? interests * (0.075 + 0.172) : interests * 0.3),
  },
  none: {
    name: "Sans fiscalité",
    desc: "Simulation brute (ex: livret réglementé)",
    color: "#00f291",
    taxFn: () => 0,
  },
}

const DEFAULTS: Settings = {
  p: 10000,
  m: 500,
  r: 8,
  t: 25,
  idx: 2,
  inf: 2,
  month: 0,
  envelope: "cto",
  kraschYear: 10,
  kraschPct: 30,
  showReal: false,
  activeTab: "simulator",
}

// ─── Helper: format currency ──────────────────────────────────────────────────
const fmt = (n: number) => Math.round(n).toLocaleString("fr-FR") + " €"
const fmtN = (n: number) => Math.round(n).toLocaleString("fr-FR")

const fmtTick = (v: number | string) =>
  typeof v === "number"
    ? v >= 1000000
      ? (v / 1000000).toFixed(1) + "M€"
      : v >= 1000
        ? Math.round(v / 1000) + "k€"
        : v + "€"
    : v

// ─── Core calculation engine ──────────────────────────────────────────────────
function runSimulation(
  P: number,
  PMT_init: number,
  r_nom: number,
  t: number,
  indexation: number,
  inflation: number,
  startMonth: number,
  envelope: string,
  kraschYear: number,
  kraschPct: number,
  applyKrasch: boolean,
): YearRow[] {
  const monthlyRate = r_nom / 12
  const startYear = new Date().getFullYear()
  const rows: YearRow[] = []

  let capNom = P
  let totalInvNom = P
  let pmt = PMT_init

  const env = ENVELOPES[envelope] || ENVELOPES.cto

  for (let y = 0; y <= t; y++) {
    const labelDate = new Date(startYear + y, startMonth)
    const dateStr = labelDate.toLocaleDateString("fr-FR", { month: "short", year: "numeric" })
    const discFactor = Math.pow(1 + inflation, y)

    if (y > 0) {
      for (let m = 1; m <= 12; m++) {
        capNom = capNom * (1 + monthlyRate) + pmt
        totalInvNom += pmt
      }
      // Krach boursier
      if (applyKrasch && y === kraschYear) {
        capNom *= 1 - kraschPct / 100
      }
      pmt *= 1 + indexation
    }

    const interestsNom = Math.max(0, capNom - totalInvNom)
    const tax = env.taxFn(interestsNom, y)
    const taxNet = capNom - tax
    const real = capNom / discFactor

    rows.push({
      year: y,
      date: dateStr,
      investedNom: Math.round(totalInvNom),
      interestsNom: Math.round(interestsNom),
      nominal: Math.round(capNom),
      real: Math.round(real),
      taxNet: Math.round(taxNet),
    })
  }
  return rows
}

// ─── Monte Carlo simulation ───────────────────────────────────────────────────
function runMonteCarlo(
  P: number,
  PMT_init: number,
  r_nom: number,
  t: number,
  indexation: number,
  simCount = 200,
): { p10: number[]; p50: number[]; p90: number[] } {
  const volatility = r_nom * 0.6 // Rough std dev approximation
  const results: number[][] = []

  for (let sim = 0; sim < simCount; sim++) {
    let cap = P
    let pmt = PMT_init
    const annual: number[] = [cap]

    for (let y = 1; y <= t; y++) {
      // Random annual return using Box-Muller
      const u1 = Math.random(),
        u2 = Math.random()
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
      const annualReturn = r_nom + z * volatility
      const mr = annualReturn / 12

      for (let m = 0; m < 12; m++) {
        cap = cap * (1 + mr) + pmt
        cap = Math.max(0, cap)
      }
      pmt *= 1 + indexation
      annual.push(Math.round(cap))
    }
    results.push(annual)
  }

  const p10: number[] = [],
    p50: number[] = [],
    p90: number[] = []
  for (let y = 0; y <= t; y++) {
    const vals = results.map(r => r[y]).sort((a, b) => a - b)
    p10.push(vals[Math.floor(simCount * 0.1)])
    p50.push(vals[Math.floor(simCount * 0.5)])
    p90.push(vals[Math.floor(simCount * 0.9)])
  }
  return { p10, p50, p90 }
}

// ─── Goal solver ─────────────────────────────────────────────────────────────
function solveGoal(target: number, P: number, r_nom: number, t: number): GoalResult {
  if (t <= 0 || target <= 0) return { pmt: null, rate: null }
  const n = t * 12
  const mr = r_nom / 12

  // Solve for PMT
  let pmt: number | null
  if (mr > 0) {
    const factor = (Math.pow(1 + mr, n) - 1) / mr
    const capitalGrowth = P * Math.pow(1 + mr, n)
    pmt = Math.max(0, (target - capitalGrowth) / factor)
  } else {
    pmt = Math.max(0, (target - P) / n)
  }

  // Solve for rate (bisection)
  let rate: number | null
  const f = (rr: number) => {
    const mm = rr / 12
    if (mm === 0) return P + 500 * n
    return P * Math.pow(1 + mm, n) + 500 * ((Math.pow(1 + mm, n) - 1) / mm)
  }
  if (f(0) < target) {
    let lo = 0,
      hi = 1.0
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2
      const mm = mid / 12
      const val = P * Math.pow(1 + mm, n) + 500 * ((Math.pow(1 + mm, n) - 1) / mm)
      if (val < target) lo = mid
      else hi = mid
    }
    rate = (lo + hi) / 2
  } else {
    rate = 0
  }

  return { pmt, rate }
}

// ─── Decumulation calc ────────────────────────────────────────────────────────
function calcDecumulation(capital: number, monthlyWithdrawal: number, r_nom: number): number | null {
  const mr = r_nom / 12
  if (monthlyWithdrawal <= 0) return null
  if (mr > 0 && monthlyWithdrawal <= capital * mr) return Infinity // Never depleted
  if (mr === 0) return capital / monthlyWithdrawal
  // n = -log(1 - capital*mr/PMT) / log(1+mr)
  const x = 1 - (capital * mr) / monthlyWithdrawal
  if (x <= 0) return Infinity
  return -Math.log(x) / Math.log(1 + mr)
}

function calcPerpetualRent(capital: number, r_nom: number): number {
  return capital * (r_nom / 12)
}

// ─── Slider + Number Input component ─────────────────────────────────────────
interface SliderInputProps {
  label: string
  id: string
  value: number
  min: number
  max: number
  step: number
  suffix?: string
  onChange: (v: number) => void
  color?: string
}

function SliderInput({ label, id, value, min, max, step, suffix = "", onChange, color }: SliderInputProps) {
  return (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-2">
        <label
          htmlFor={id}
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          {label}
        </label>
        <input
          type="number"
          id={id}
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          style={{
            background: "var(--accent-glass)",
            border: "1px solid var(--border)",
            color: color || "var(--primary)",
            fontSize: 14,
            fontWeight: 700,
            padding: "5px 10px",
            borderRadius: 8,
            width: 100,
            textAlign: "right",
            outline: "none",
          }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
      />
      {suffix && (
        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3, textAlign: "right" }}>{suffix}</div>
      )}
    </div>
  )
}

// ─── Section Title ────────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 800,
        color: "white",
        margin: "22px 0 14px 0",
        paddingBottom: 8,
        borderBottom: "1px solid var(--border)",
        textTransform: "uppercase",
        letterSpacing: 1,
      }}
    >
      {children}
    </div>
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div
      className="stat-card"
      style={{
        background: "var(--card-bg)",
        padding: "22px 24px",
        borderRadius: 20,
        border: "1px solid var(--border)",
        transition: "all 0.3s",
      }}
    >
      <p
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          marginBottom: 8,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {label}
      </p>
      <h2 style={{ fontSize: 24, fontWeight: 800, color }}>{value}</h2>
      {sub && <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{sub}</p>}
    </div>
  )
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({
  checked,
  onChange,
  label,
  sub,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  sub?: string
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "var(--card-bg-alt)",
        padding: "13px 15px",
        borderRadius: 14,
        border: "1px solid var(--border)",
        marginBottom: 12,
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#cbd5e1" }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>}
      </div>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 42,
          height: 23,
          borderRadius: 12,
          background: checked ? "var(--warning)" : "#475569",
          position: "relative",
          cursor: "pointer",
          transition: "background 0.3s",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 17,
            height: 17,
            borderRadius: "50%",
            background: "white",
            top: 3,
            left: checked ? 22 : 3,
            transition: "left 0.3s",
          }}
        />
      </div>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  // ── State ──
  const [p, setP] = useState(DEFAULTS.p)
  const [m, setM] = useState(DEFAULTS.m)
  const [r, setR] = useState(DEFAULTS.r)
  const [t, setT] = useState(DEFAULTS.t)
  const [idx, setIdx] = useState(DEFAULTS.idx)
  const [inf, setInf] = useState(DEFAULTS.inf)
  const [month, setMonth] = useState(DEFAULTS.month)
  const [envelope, setEnvelope] = useState(DEFAULTS.envelope)
  const [showReal, setShowReal] = useState(false)
  const [activeTab, setActiveTab] = useState("simulator")

  // Krach
  const [applyKrasch, setApplyKrasch] = useState(false)
  const [kraschYear, setKraschYear] = useState(10)
  const [kraschPct, setKraschPct] = useState(30)

  // Rente
  const [withdrawal, setWithdrawal] = useState(2000)

  // Goal Inverse
  const [goalTarget, setGoalTarget] = useState(500000)
  const [goalDuration, setGoalDuration] = useState(15)
  const [goalRate, setGoalRate] = useState(7)
  const [goalCapital, setGoalCapital] = useState(10000)

  // Monte Carlo
  const [mcRuns, setMcRuns] = useState(false)
  const [mcData, setMcData] = useState<{ p10: number[]; p50: number[]; p90: number[] } | null>(null)

  // Amortissement table
  const [tableOpen, setTableOpen] = useState(false)

  // Data
  const [rows, setRows] = useState<YearRow[]>([])

  // Charts refs
  const mainChartRef = useRef<HTMLCanvasElement>(null)
  const mcChartRef = useRef<HTMLCanvasElement>(null)
  const mainChartInstance = useRef<Chart | null>(null)
  const mcChartInstance = useRef<Chart | null>(null)

  // ── Load settings ──
  useEffect(() => {
    try {
      const saved = localStorage.getItem("snowball_v4_settings")
      if (saved) {
        const s: Partial<Settings> = JSON.parse(saved)
        if (s.p !== undefined) setP(s.p)
        if (s.m !== undefined) setM(s.m)
        if (s.r !== undefined) setR(s.r)
        if (s.t !== undefined) setT(s.t)
        if (s.idx !== undefined) setIdx(s.idx)
        if (s.inf !== undefined) setInf(s.inf)
        if (s.month !== undefined) setMonth(s.month)
        if (s.envelope) setEnvelope(s.envelope)
        if (s.kraschYear !== undefined) setKraschYear(s.kraschYear)
        if (s.kraschPct !== undefined) setKraschPct(s.kraschPct)
        if (s.showReal !== undefined) setShowReal(s.showReal)
        if (s.activeTab) setActiveTab(s.activeTab)
      }
    } catch {
      /* settings invalides ou localStorage indisponible */
    }
  }, [])

  // ── Save settings ──
  const saveSettings = useCallback(() => {
    try {
      const s: Settings = { p, m, r, t, idx, inf, month, envelope, kraschYear, kraschPct, showReal, activeTab }
      localStorage.setItem("snowball_v4_settings", JSON.stringify(s))
    } catch {
      /* localStorage indisponible */
    }
  }, [p, m, r, t, idx, inf, month, envelope, kraschYear, kraschPct, showReal, activeTab])

  // ── Run simulation ──
  const computedRows = useCallback(() => {
    return runSimulation(p, m, r / 100, t, idx / 100, inf / 100, month, envelope, kraschYear, kraschPct, applyKrasch)
  }, [p, m, r, t, idx, inf, month, envelope, kraschYear, kraschPct, applyKrasch])

  useEffect(() => {
    const newRows = computedRows()
    setRows(newRows)
    saveSettings()
  }, [computedRows, saveSettings])

  // ── Main chart ──
  useEffect(() => {
    if (!mainChartRef.current || rows.length === 0) return
    const ctx = mainChartRef.current.getContext("2d")
    if (!ctx) return

    if (mainChartInstance.current) {
      mainChartInstance.current.destroy()
    }

    const isReal = showReal
    const labels = rows.map(r => "An " + r.year)

    const principalData = rows.map(r =>
      isReal ? Math.round(r.investedNom / Math.pow(1 + inf / 100, r.year)) : r.investedNom,
    )
    const interestData = rows.map(r => {
      const cap = isReal ? r.real : r.nominal
      const inv = isReal ? Math.round(r.investedNom / Math.pow(1 + inf / 100, r.year)) : r.investedNom
      return Math.max(0, cap - inv)
    })
    const taxData = rows.map(r => {
      if (envelope === "none") return 0
      return Math.max(0, r.nominal - r.taxNet)
    })

    const gradInterest = ctx.createLinearGradient(0, 0, 0, 400)
    if (isReal) {
      gradInterest.addColorStop(0, "rgba(245,158,11,0.4)")
      gradInterest.addColorStop(1, "rgba(245,158,11,0)")
    } else {
      gradInterest.addColorStop(0, "rgba(0,242,145,0.4)")
      gradInterest.addColorStop(1, "rgba(0,242,145,0)")
    }
    const gradPrincipal = ctx.createLinearGradient(0, 0, 0, 400)
    gradPrincipal.addColorStop(0, "rgba(148,163,184,0.25)")
    gradPrincipal.addColorStop(1, "rgba(148,163,184,0)")
    const gradTax = ctx.createLinearGradient(0, 0, 0, 400)
    gradTax.addColorStop(0, "rgba(239,68,68,0.3)")
    gradTax.addColorStop(1, "rgba(239,68,68,0)")

    const datasets: ChartDataset<"line", number[]>[] = [
      {
        label: isReal ? "Gains (réel)" : "Gains générés",
        data: interestData,
        borderColor: isReal ? "#f59e0b" : "#00f291",
        backgroundColor: gradInterest,
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 6,
        order: 1,
      },
      {
        label: "Capital investi",
        data: principalData,
        borderColor: "#94a3b8",
        backgroundColor: gradPrincipal,
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        order: 2,
      },
    ]

    if (envelope !== "none") {
      datasets.push({
        label: "Impact fiscal",
        data: taxData,
        borderColor: "#ef4444",
        backgroundColor: gradTax,
        fill: false,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        borderDash: [6, 3],
        order: 0,
      })
    }

    mainChartInstance.current = new Chart(ctx, {
      type: "line",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            position: "top",
            align: "end",
            labels: { color: "#94a3b8", font: { size: 11 }, usePointStyle: true, padding: 16 },
          },
          tooltip: {
            backgroundColor: "#1e293b",
            titleFont: { size: 14, family: "Plus Jakarta Sans" },
            bodyFont: { size: 13, family: "Plus Jakarta Sans" },
            padding: 14,
            cornerRadius: 12,
            borderColor: "rgba(255,255,255,0.1)",
            borderWidth: 1,
            callbacks: {
              label: ctx => ` ${ctx.dataset.label}: ${Math.round(ctx.parsed.y ?? 0).toLocaleString("fr-FR")} €`,
            },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: "#64748b", font: { size: 11 } } },
          y: {
            stacked: true,
            grid: { color: "rgba(255,255,255,0.05)" },
            ticks: {
              color: "#64748b",
              callback: fmtTick,
            },
          },
        },
      },
    })
    return () => {
      if (mainChartInstance.current) mainChartInstance.current.destroy()
    }
  }, [rows, showReal, envelope, inf])

  // ── Monte Carlo chart ──
  useEffect(() => {
    if (!mcChartRef.current || !mcData) return
    const ctx = mcChartRef.current.getContext("2d")
    if (!ctx) return

    if (mcChartInstance.current) mcChartInstance.current.destroy()

    const labels = mcData.p50.map((_, i) => "An " + i)

    mcChartInstance.current = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Scénario optimiste (P90)",
            data: mcData.p90,
            borderColor: "#00f291",
            backgroundColor: "rgba(0,242,145,0.08)",
            fill: "+1",
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 0,
          },
          {
            label: "Scénario médian (P50)",
            data: mcData.p50,
            borderColor: "#6366f1",
            backgroundColor: "rgba(99,102,241,0.15)",
            fill: "+1",
            tension: 0.4,
            borderWidth: 3,
            pointRadius: 0,
          },
          {
            label: "Scénario pessimiste (P10)",
            data: mcData.p10,
            borderColor: "#ef4444",
            backgroundColor: "rgba(239,68,68,0.08)",
            fill: false,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            position: "top",
            align: "end",
            labels: { color: "#94a3b8", font: { size: 11 }, usePointStyle: true },
          },
          tooltip: {
            backgroundColor: "#1e293b",
            padding: 14,
            cornerRadius: 12,
            borderColor: "rgba(255,255,255,0.1)",
            borderWidth: 1,
            callbacks: {
              label: ctx => ` ${ctx.dataset.label}: ${Math.round(ctx.parsed.y ?? 0).toLocaleString("fr-FR")} €`,
            },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: "#64748b", font: { size: 11 } } },
          y: {
            grid: { color: "rgba(255,255,255,0.05)" },
            ticks: { color: "#64748b", callback: fmtTick },
          },
        },
      },
    })
  }, [mcData])

  // ── Derived values ──
  const lastRow = rows[rows.length - 1]
  const env = ENVELOPES[envelope]

  const displayFinal = lastRow ? (showReal ? lastRow.real : lastRow.nominal) : 0
  const displayInvested = lastRow
    ? showReal
      ? Math.round(lastRow.investedNom / Math.pow(1 + inf / 100, t))
      : lastRow.investedNom
    : 0
  const displayInterests = Math.max(0, displayFinal - displayInvested)
  const netAfterTax = lastRow ? lastRow.taxNet : 0
  const taxAmount = lastRow ? Math.max(0, lastRow.nominal - lastRow.taxNet) : 0

  const perpetualRent = lastRow ? calcPerpetualRent(lastRow.nominal, r / 100) : 0
  const monthsToZero = lastRow ? calcDecumulation(lastRow.nominal, withdrawal, r / 100) : null

  // Goal result
  const goalResult: GoalResult = solveGoal(goalTarget, goalCapital, goalRate / 100, goalDuration)

  const exportCSV = () => {
    let csv = "Annee;Date;Total Verse;Interets;Valeur Nominale;Valeur Reelle;Net Fiscal\n"
    rows.forEach(r => {
      csv += `${r.year};${r.date};${r.investedNom};${r.interestsNom};${r.nominal};${r.real};${r.taxNet}\n`
    })
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.setAttribute("download", "snowball_v4_projection.csv")
    link.click()
  }

  const handleMonteCarlo = () => {
    setMcRuns(true)
    setTimeout(() => {
      const result = runMonteCarlo(p, m, r / 100, t, idx / 100, 300)
      setMcData(result)
      setMcRuns(false)
    }, 50)
  }

  // ── Tab config ──
  const tabs = [
    { id: "simulator", label: "📈 Simulateur" },
    { id: "montecarlo", label: "🎲 Monte Carlo" },
    { id: "rente", label: "💸 Rente & Sortie" },
    { id: "goal", label: "🎯 Objectif Inversé" },
  ]

  // ── Render ──
  return (
    <div
      className="app-root"
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        padding: 20,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 1380,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "400px 1fr",
          gap: 28,
          animation: "fadeIn 0.6s ease-out",
        }}
        className="responsive-grid"
      >
        {/* ── SIDEBAR ── */}
        <aside
          style={{
            background: "var(--card-bg)",
            padding: 28,
            borderRadius: 28,
            border: "1px solid var(--border)",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
            maxHeight: "97vh",
            overflowY: "auto",
            position: "sticky",
            top: 20,
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: "var(--primary)", letterSpacing: -1 }}>
              ● SNOWBALL
            </span>
            <span
              style={{
                background: "var(--secondary)",
                color: "white",
                fontSize: 10,
                padding: "3px 8px",
                borderRadius: 12,
                letterSpacing: 1,
                fontWeight: 700,
              }}
            >
              PRO v4
            </span>
          </div>

          {/* Calendar */}
          <SectionTitle>📅 Calendrier</SectionTitle>
          <div className="mb-5">
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: 1,
                display: "block",
                marginBottom: 8,
              }}
            >
              Mois de début
            </label>
            <select
              value={month}
              onChange={e => setMonth(parseInt(e.target.value))}
              style={{
                width: "100%",
                background: "var(--accent-glass)",
                border: "1px solid var(--border)",
                color: "white",
                fontSize: 14,
                padding: "8px 12px",
                borderRadius: 10,
                outline: "none",
                cursor: "pointer",
              }}
            >
              {MONTHS.map((mn, i) => (
                <option key={i} value={i} style={{ background: "#1e293b" }}>
                  {mn}
                </option>
              ))}
            </select>
          </div>

          {/* Base params */}
          <SectionTitle>💰 Bases de l'investissement</SectionTitle>
          <SliderInput label="Capital Départ (€)" id="p" value={p} min={0} max={200000} step={1000} onChange={setP} />
          <SliderInput label="Versement Mensuel (€)" id="m" value={m} min={0} max={10000} step={50} onChange={setM} />
          <SliderInput
            label="Rendement Annuel (%)"
            id="r"
            value={r}
            min={0.1}
            max={20}
            step={0.1}
            onChange={setR}
            suffix={`Taux mensuel : ${(r / 12).toFixed(3)}%`}
          />
          <SliderInput label="Durée (Années)" id="t" value={t} min={1} max={50} step={1} onChange={setT} />

          {/* Advanced */}
          <SectionTitle>⚙️ Paramètres Avancés</SectionTitle>
          <SliderInput
            label="Indexation Versements (%/an)"
            id="idx"
            value={idx}
            min={0}
            max={10}
            step={0.1}
            onChange={setIdx}
            suffix="Augmentation annuelle du versement mensuel"
          />
          <SliderInput
            label="Inflation Annuelle (%)"
            id="inf"
            value={inf}
            min={0}
            max={10}
            step={0.1}
            onChange={setInf}
          />
          <Toggle
            checked={showReal}
            onChange={setShowReal}
            label="Pouvoir d'achat réel"
            sub="Affiche en euros d'aujourd'hui"
          />

          {/* Fiscalité */}
          <SectionTitle>🏛️ Enveloppe Fiscale</SectionTitle>
          <div style={{ display: "grid", gap: 8 }}>
            {Object.entries(ENVELOPES).map(([key, env]) => (
              <div
                key={key}
                onClick={() => setEnvelope(key)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  cursor: "pointer",
                  border: `2px solid ${envelope === key ? env.color : "var(--border)"}`,
                  background: envelope === key ? `${env.color}18` : "var(--accent-glass)",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: envelope === key ? env.color : "white" }}>
                  {env.name}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{env.desc}</div>
              </div>
            ))}
          </div>

          {/* Krach */}
          <SectionTitle>💥 Stress Test – Krach Boursier</SectionTitle>
          <Toggle
            checked={applyKrasch}
            onChange={setApplyKrasch}
            label="Simuler un krach boursier"
            sub="Applique une chute soudaine du capital"
          />
          {applyKrasch && (
            <div style={{ animation: "slideIn 0.3s ease-out" }}>
              <SliderInput
                label="Année du krach"
                id="ky"
                value={kraschYear}
                min={1}
                max={t}
                step={1}
                onChange={setKraschYear}
                color="#ef4444"
              />
              <SliderInput
                label="Amplitude du krach (%)"
                id="kp"
                value={kraschPct}
                min={5}
                max={80}
                step={1}
                onChange={setKraschPct}
                color="#ef4444"
                suffix={`Perte de -${kraschPct}% du capital en An ${kraschYear}`}
              />
            </div>
          )}

          {/* Insight */}
          <div
            style={{
              marginTop: 20,
              background: showReal
                ? "linear-gradient(135deg,#451a03,#1c1917)"
                : "linear-gradient(135deg,#312e81,#1e1b4b)",
              padding: 18,
              borderRadius: 18,
              borderLeft: `5px solid ${showReal ? "var(--warning)" : "var(--primary)"}`,
            }}
          >
            <p style={{ fontSize: 13, lineHeight: 1.6, color: "#e2e8f0" }}>
              Projection sur <strong style={{ color: "white" }}>{t} ans</strong>. Patrimoine final :{" "}
              <strong style={{ color: showReal ? "var(--warning)" : "var(--primary)" }}>{fmt(displayFinal)}</strong>{" "}
              {showReal ? "en pouvoir d'achat actuel" : "en valeur nominale"}.
              {idx > 0 && ` Versements indexés à ${idx}%/an.`}
              {applyKrasch && (
                <span style={{ color: "#ef4444" }}>
                  {" "}
                  ⚠️ Krach simulé en An {kraschYear} (-{kraschPct}%).
                </span>
              )}
            </p>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {/* Action bar */}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }} className="no-print action-bar">
            <button
              onClick={exportCSV}
              style={{
                padding: "9px 18px",
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--accent-glass)",
                color: "white",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              📊 Export CSV
            </button>
            <button
              onClick={() => window.print()}
              style={{
                padding: "9px 18px",
                borderRadius: 12,
                border: "none",
                background: "var(--secondary)",
                color: "white",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              🖨️ Rapport PDF
            </button>
          </div>

          {/* Stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }} className="stats-grid">
            <StatCard label="Effort d'épargne" value={fmt(displayInvested)} color="#cbd5e1" />
            <StatCard
              label="Gains générés"
              value={`+${fmt(displayInterests)}`}
              color={showReal ? "var(--warning)" : "var(--primary)"}
            />
            <StatCard
              label={`Net fiscal (${env.name.split(" ")[0]})`}
              value={fmt(netAfterTax)}
              color={env.color}
              sub={envelope !== "none" ? `Impôts : -${fmt(taxAmount)}` : "Aucune fiscalité"}
            />
            <StatCard
              label="Patrimoine final"
              value={fmt(displayFinal)}
              color="white"
              sub={showReal ? "Euros d'aujourd'hui" : "Valeur nominale"}
            />
          </div>

          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: 8,
              background: "var(--card-bg)",
              padding: 6,
              borderRadius: 18,
              border: "1px solid var(--border)",
            }}
            className="no-print tabs-bar"
          >
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: "10px 8px",
                  borderRadius: 12,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 700,
                  transition: "all 0.2s",
                  background: activeTab === tab.id ? "var(--primary)" : "transparent",
                  color: activeTab === tab.id ? "#0f172a" : "var(--text-muted)",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── TAB: SIMULATOR ── */}
          {activeTab === "simulator" && (
            <>
                <div
                  style={{
                    background: "var(--card-bg)",
                    padding: 28,
                    borderRadius: 28,
                    border: "1px solid var(--border)",
                    minHeight: 420,
                  }}
                  className="card-mobile chart-card"
                >
                <canvas ref={mainChartRef} style={{ width: "100%", height: "100%" }} />
              </div>

              {/* Amortissement table */}
              <div
                style={{
                  background: "var(--card-bg)",
                  borderRadius: 24,
                  border: "1px solid var(--border)",
                  overflow: "hidden",
                }}
              >
                <div
                  onClick={() => setTableOpen(!tableOpen)}
                  style={{
                    padding: "18px 28px",
                    fontWeight: 700,
                    cursor: "pointer",
                    color: "var(--primary)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                  className="table-toggle"
                >
                  <span>📋 TABLEAU D'AMORTISSEMENT DÉTAILLÉ</span>
                  <span style={{ fontSize: 12, opacity: 0.7 }}>
                    {tableOpen ? "Réduire ↑" : "Voir le détail annuel ↓"}
                  </span>
                </div>
                {tableOpen && (
                  <div style={{ overflowX: "auto", padding: "0 20px 20px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr>
                          {[
                            "Année",
                            "Date",
                            "Total Versé",
                            "Intérêts",
                            "Valeur Nominale",
                            "Valeur Réelle",
                            "Net Fiscal",
                          ].map(h => (
                            <th
                              key={h}
                              style={{
                                color: "var(--text-muted)",
                                fontWeight: 700,
                                padding: "10px 12px",
                                borderBottom: "1px solid var(--border)",
                                textTransform: "uppercase",
                                fontSize: 10,
                                textAlign: "left",
                              }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map(row => (
                          <tr key={row.year} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                            <td style={{ padding: "10px 12px", color: "#94a3b8" }}>An {row.year}</td>
                            <td style={{ padding: "10px 12px", color: "#e2e8f0" }}>{row.date}</td>
                            <td style={{ padding: "10px 12px", color: "#e2e8f0" }}>{fmtN(row.investedNom)} €</td>
                            <td style={{ padding: "10px 12px", color: "var(--primary)", fontWeight: 600 }}>
                              {fmtN(row.interestsNom)} €
                            </td>
                            <td
                              style={{
                                padding: "10px 12px",
                                color: showReal ? "#94a3b8" : "white",
                                fontWeight: showReal ? 400 : 600,
                              }}
                            >
                              {fmtN(row.nominal)} €
                            </td>
                            <td
                              style={{
                                padding: "10px 12px",
                                color: showReal ? "var(--warning)" : "#94a3b8",
                                fontWeight: showReal ? 600 : 400,
                              }}
                            >
                              {fmtN(row.real)} €
                            </td>
                            <td style={{ padding: "10px 12px", color: env.color, fontWeight: 600 }}>
                              {fmtN(row.taxNet)} €
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── TAB: MONTE CARLO ── */}
          {activeTab === "montecarlo" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div
                style={{
                  background: "var(--card-bg)",
                  padding: 28,
                  borderRadius: 28,
                  border: "1px solid var(--border)",
                }}
                className="card-mobile"
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 24,
                  }}
                  className="mc-header"
                >
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>🎲 Simulation de Monte Carlo</h2>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 520 }}>
                      300 simulations avec un rendement aléatoire (loi normale, σ ≈ 60% du rendement cible). Résultats :
                      P10 (pessimiste), P50 (médian), P90 (optimiste).
                    </p>
                  </div>
                  <button
                    onClick={handleMonteCarlo}
                    disabled={mcRuns}
                    style={{
                      padding: "12px 22px",
                      borderRadius: 14,
                      border: "none",
                      background: mcRuns ? "#334155" : "var(--secondary)",
                      color: "white",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: mcRuns ? "not-allowed" : "pointer",
                      transition: "all 0.2s",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {mcRuns ? "⏳ Calcul..." : "▶ Lancer 300 simulations"}
                  </button>
                </div>

                {!mcData && (
                  <div
                    style={{
                      minHeight: 350,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column",
                      gap: 16,
                      color: "var(--text-muted)",
                    }}
                  >
                    <div style={{ fontSize: 48 }}>🎲</div>
                    <p style={{ fontSize: 14, fontWeight: 600 }}>
                      Cliquez sur "Lancer" pour générer le nuage de probabilités
                    </p>
                  </div>
                )}

                {mcData && (
                  <>
                    <div className="mc-chart-wrap" style={{ minHeight: 380 }}>
                      <canvas ref={mcChartRef} style={{ width: "100%", height: 380 }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 20 }} className="mc-scenarios">
                      <div
                        style={{
                          background: "rgba(239,68,68,0.1)",
                          border: "1px solid rgba(239,68,68,0.3)",
                          padding: "16px 20px",
                          borderRadius: 14,
                        }}
                      >
                        <p style={{ fontSize: 11, color: "#ef4444", fontWeight: 700, marginBottom: 6 }}>
                          SCÉNARIO PESSIMISTE (P10)
                        </p>
                        <p style={{ fontSize: 22, fontWeight: 800, color: "white" }}>
                          {fmt(mcData.p10[mcData.p10.length - 1])}
                        </p>
                        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                          1 chance sur 10 de faire moins
                        </p>
                      </div>
                      <div
                        style={{
                          background: "rgba(99,102,241,0.1)",
                          border: "1px solid rgba(99,102,241,0.3)",
                          padding: "16px 20px",
                          borderRadius: 14,
                        }}
                      >
                        <p style={{ fontSize: 11, color: "#6366f1", fontWeight: 700, marginBottom: 6 }}>
                          SCÉNARIO MÉDIAN (P50)
                        </p>
                        <p style={{ fontSize: 22, fontWeight: 800, color: "white" }}>
                          {fmt(mcData.p50[mcData.p50.length - 1])}
                        </p>
                        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                          Résultat le plus probable
                        </p>
                      </div>
                      <div
                        style={{
                          background: "rgba(0,242,145,0.1)",
                          border: "1px solid rgba(0,242,145,0.3)",
                          padding: "16px 20px",
                          borderRadius: 14,
                        }}
                      >
                        <p style={{ fontSize: 11, color: "var(--primary)", fontWeight: 700, marginBottom: 6 }}>
                          SCÉNARIO OPTIMISTE (P90)
                        </p>
                        <p style={{ fontSize: 22, fontWeight: 800, color: "white" }}>
                          {fmt(mcData.p90[mcData.p90.length - 1])}
                        </p>
                        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                          1 chance sur 10 de faire mieux
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Krach recap */}
              {applyKrasch && lastRow && (
                <div
                  style={{
                    background: "linear-gradient(135deg,#450a0a,#1c0606)",
                    padding: 24,
                    borderRadius: 20,
                    border: "1px solid rgba(239,68,68,0.3)",
                    borderLeft: "5px solid #ef4444",
                  }}
                >
                  <h3
                    style={{
                      fontSize: 14,
                      color: "#ef4444",
                      fontWeight: 800,
                      marginBottom: 10,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    ⚠️ Impact du Krach Simulé
                  </h3>
                  <p style={{ fontSize: 13, color: "#fca5a5", lineHeight: 1.7 }}>
                    Un krach de <strong style={{ color: "white" }}>-{kraschPct}%</strong> en{" "}
                    <strong style={{ color: "white" }}>An {kraschYear}</strong> est intégré dans votre simulation. Le
                    patrimoine final est de <strong style={{ color: "#ef4444" }}>{fmt(lastRow.nominal)}</strong> au lieu
                    de{" "}
                    <strong style={{ color: "white" }}>
                      {fmt(
                        runSimulation(
                          p,
                          m,
                          r / 100,
                          t,
                          idx / 100,
                          inf / 100,
                          month,
                          envelope,
                          kraschYear,
                          kraschPct,
                          false,
                        ).slice(-1)[0]?.nominal || 0,
                      )}
                    </strong>{" "}
                    sans krach.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: RENTE ── */}
          {activeTab === "rente" && lastRow && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Perpetual rent */}
              <div
                style={{
                  background: "var(--card-bg)",
                  padding: 32,
                  borderRadius: 28,
                  border: "1px solid var(--border)",
                }}
                className="card-mobile"
              >
                <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>💸 Rente Perpétuelle</h2>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24, lineHeight: 1.6 }}>
                  La rente que vous pouvez retirer chaque mois sans jamais entamer votre capital (basée sur le seul
                  rendement généré).
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }} className="rente-grid">
                  <div
                    style={{
                      background: "linear-gradient(135deg,rgba(0,242,145,0.15),rgba(0,242,145,0.05))",
                      border: "1px solid rgba(0,242,145,0.3)",
                      padding: "24px",
                      borderRadius: 18,
                    }}
                  >
                    <p
                      style={{
                        fontSize: 11,
                        color: "var(--primary)",
                        fontWeight: 700,
                        marginBottom: 8,
                        textTransform: "uppercase",
                      }}
                    >
                      Capital final
                    </p>
                    <p style={{ fontSize: 28, fontWeight: 800, color: "white" }}>{fmt(lastRow.nominal)}</p>
                  </div>
                  <div
                    style={{
                      background: "linear-gradient(135deg,rgba(99,102,241,0.15),rgba(99,102,241,0.05))",
                      border: "1px solid rgba(99,102,241,0.3)",
                      padding: "24px",
                      borderRadius: 18,
                    }}
                  >
                    <p
                      style={{
                        fontSize: 11,
                        color: "#6366f1",
                        fontWeight: 700,
                        marginBottom: 8,
                        textTransform: "uppercase",
                      }}
                    >
                      Rente mensuelle perpétuelle
                    </p>
                    <p style={{ fontSize: 28, fontWeight: 800, color: "white" }}>{fmt(perpetualRent)}</p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                      Capital intact pour vos héritiers
                    </p>
                  </div>
                  <div
                    style={{
                      background: "linear-gradient(135deg,rgba(245,158,11,0.15),rgba(245,158,11,0.05))",
                      border: "1px solid rgba(245,158,11,0.3)",
                      padding: "24px",
                      borderRadius: 18,
                    }}
                  >
                    <p
                      style={{
                        fontSize: 11,
                        color: "var(--warning)",
                        fontWeight: 700,
                        marginBottom: 8,
                        textTransform: "uppercase",
                      }}
                    >
                      Rente annuelle
                    </p>
                    <p style={{ fontSize: 28, fontWeight: 800, color: "white" }}>{fmt(perpetualRent * 12)}</p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                      ≈ {(((perpetualRent * 12) / lastRow.nominal) * 100).toFixed(2)}% du capital / an
                    </p>
                  </div>
                </div>
              </div>

              {/* Decumulation */}
              <div
                style={{
                  background: "var(--card-bg)",
                  padding: 32,
                  borderRadius: 28,
                  border: "1px solid var(--border)",
                }}
                className="card-mobile"
              >
                <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>📉 Simulation de Décaissement</h2>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20, lineHeight: 1.6 }}>
                  Si vous retirez un montant mensuel fixe, combien de temps votre capital tiendra-t-il ?
                </p>

                <SliderInput
                  label="Retrait mensuel (€)"
                  id="wd"
                  value={withdrawal}
                  min={100}
                  max={Math.max(30000, withdrawal)}
                  step={100}
                  onChange={setWithdrawal}
                  color="#f59e0b"
                  suffix={`Rendement de ${r}% maintenu pendant la phase de retrait`}
                />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 10 }} className="decumulation-grid">
                  <div
                    style={{
                      background:
                        monthsToZero === Infinity
                          ? "linear-gradient(135deg,rgba(0,242,145,0.15),rgba(0,242,145,0.05))"
                          : monthsToZero !== null && monthsToZero < 12 * 10
                            ? "linear-gradient(135deg,rgba(239,68,68,0.15),rgba(239,68,68,0.05))"
                            : "linear-gradient(135deg,rgba(99,102,241,0.15),rgba(99,102,241,0.05))",
                      border: `1px solid ${monthsToZero === Infinity ? "rgba(0,242,145,0.3)" : monthsToZero !== null && monthsToZero < 12 * 10 ? "rgba(239,68,68,0.3)" : "rgba(99,102,241,0.3)"}`,
                      padding: 24,
                      borderRadius: 18,
                    }}
                  >
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color:
                          monthsToZero === Infinity
                            ? "var(--primary)"
                            : monthsToZero !== null && monthsToZero < 120
                              ? "#ef4444"
                              : "#6366f1",
                        textTransform: "uppercase",
                        marginBottom: 8,
                      }}
                    >
                      Durée avant épuisement
                    </p>
                    <p style={{ fontSize: 26, fontWeight: 800, color: "white" }}>
                      {monthsToZero === null
                        ? "—"
                        : monthsToZero === Infinity
                          ? "♾️ Indéfini"
                          : monthsToZero < 1
                            ? "< 1 mois"
                            : `${Math.floor(monthsToZero / 12)} ans ${Math.round(monthsToZero % 12)} mois`}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                      {monthsToZero === Infinity
                        ? `✅ Le rendement (${fmt(perpetualRent)}/mois) couvre le retrait !`
                        : withdrawal > perpetualRent
                          ? `⚠️ Le retrait dépasse la rente perpétuelle (${fmt(perpetualRent)}/mois)`
                          : ""}
                    </p>
                  </div>

                  <div
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid var(--border)",
                      padding: 24,
                      borderRadius: 18,
                    }}
                  >
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        marginBottom: 8,
                      }}
                    >
                      Comparaison des retraits
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {[withdrawal, Math.round(perpetualRent), Math.round(perpetualRent * 0.75)].map((w, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 12, color: "#e2e8f0" }}>
                            {i === 0
                              ? `Votre retrait (${fmtN(w)} €)`
                              : i === 1
                                ? `Rente max perpétuelle`
                                : `75% de la rente max`}
                          </span>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: i === 0 ? "var(--warning)" : "var(--primary)",
                            }}
                          >
                            {(() => {
                              const d = calcDecumulation(lastRow.nominal, w, r / 100)
                              if (!d) return "—"
                              if (d === Infinity) return "♾️"
                              return `${Math.floor(d / 12)}a ${Math.round(d % 12)}m`
                            })()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: GOAL INVERSÉ ── */}
          {activeTab === "goal" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div
                style={{
                  background: "var(--card-bg)",
                  padding: 32,
                  borderRadius: 28,
                  border: "1px solid var(--border)",
                }}
                className="card-mobile"
              >
                <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>🎯 Objectif Inversé</h2>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 28, lineHeight: 1.6 }}>
                  Vous connaissez votre objectif patrimonial. Le simulateur calcule automatiquement le versement mensuel
                  nécessaire et le rendement requis.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }} className="goal-inputs">
                  <SliderInput
                    label="Objectif patrimonial (€)"
                    id="gt"
                    value={goalTarget}
                    min={10000}
                    max={5000000}
                    step={10000}
                    onChange={setGoalTarget}
                    color="#6366f1"
                  />
                  <SliderInput
                    label="Capital de départ (€)"
                    id="gc"
                    value={goalCapital}
                    min={0}
                    max={200000}
                    step={1000}
                    onChange={setGoalCapital}
                    color="#6366f1"
                  />
                  <SliderInput
                    label="Durée (années)"
                    id="gd"
                    value={goalDuration}
                    min={1}
                    max={50}
                    step={1}
                    onChange={setGoalDuration}
                    color="#6366f1"
                  />
                  <SliderInput
                    label="Rendement cible (%)"
                    id="gr"
                    value={goalRate}
                    min={0.1}
                    max={20}
                    step={0.1}
                    onChange={setGoalRate}
                    color="#6366f1"
                    suffix="Utilisé pour calculer le PMT nécessaire"
                  />
                </div>

                {/* Results */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }} className="goal-results">
                  <div
                    style={{
                      background: "linear-gradient(135deg,rgba(99,102,241,0.2),rgba(99,102,241,0.05))",
                      border: "2px solid rgba(99,102,241,0.4)",
                      padding: 28,
                      borderRadius: 20,
                    }}
                  >
                    <p
                      style={{
                        fontSize: 12,
                        color: "#6366f1",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        marginBottom: 10,
                      }}
                    >
                      💰 Versement mensuel nécessaire
                    </p>
                    <p style={{ fontSize: 36, fontWeight: 800, color: "white", marginBottom: 4 }}>
                      {goalResult.pmt !== null ? fmt(goalResult.pmt) : "—"}
                    </p>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
                      Pour atteindre <strong style={{ color: "white" }}>{fmt(goalTarget)}</strong> en{" "}
                      <strong style={{ color: "white" }}>{goalDuration} ans</strong> avec un rendement de{" "}
                      <strong style={{ color: "white" }}>{goalRate}%</strong>/an
                      {goalCapital > 0 && ` et un capital de départ de ${fmt(goalCapital)}`}.
                    </p>
                    {goalResult.pmt !== null && goalResult.pmt > 0 && (
                      <div
                        style={{
                          marginTop: 16,
                          padding: "10px 14px",
                          background: "rgba(255,255,255,0.05)",
                          borderRadius: 10,
                        }}
                      >
                        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          Effort total versé :{" "}
                          <strong style={{ color: "white" }}>
                            {fmt(goalResult.pmt * goalDuration * 12 + goalCapital)}
                          </strong>{" "}
                          — Gains générés par les intérêts :{" "}
                          <strong style={{ color: "var(--primary)" }}>
                            {fmt(goalTarget - goalResult.pmt * goalDuration * 12 - goalCapital)}
                          </strong>
                        </p>
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      background: "linear-gradient(135deg,rgba(0,242,145,0.12),rgba(0,242,145,0.03))",
                      border: "2px solid rgba(0,242,145,0.3)",
                      padding: 28,
                      borderRadius: 20,
                    }}
                  >
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--primary)",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        marginBottom: 10,
                      }}
                    >
                      📈 Rendement requis (PMT = 500€/mois)
                    </p>
                    <p style={{ fontSize: 36, fontWeight: 800, color: "white", marginBottom: 4 }}>
                      {goalResult.rate !== null ? `${(goalResult.rate * 100).toFixed(2)}%` : "> 100% — Impossible"}
                    </p>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
                      Rendement annuel à atteindre pour obtenir{" "}
                      <strong style={{ color: "white" }}>{fmt(goalTarget)}</strong> en{" "}
                      <strong style={{ color: "white" }}>{goalDuration} ans</strong> en épargnant{" "}
                      <strong style={{ color: "white" }}>500€/mois</strong>
                      {goalCapital > 0 && ` avec un capital initial de ${fmt(goalCapital)}`}.
                    </p>
                    {goalResult.rate !== null && (
                      <div
                        style={{
                          marginTop: 16,
                          padding: "10px 14px",
                          background: "rgba(255,255,255,0.05)",
                          borderRadius: 10,
                        }}
                      >
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <div
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              background:
                                goalResult.rate < 0.05
                                  ? "var(--primary)"
                                  : goalResult.rate < 0.1
                                    ? "var(--warning)"
                                    : "#ef4444",
                            }}
                          />
                          <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            {goalResult.rate < 0.05
                              ? "✅ Atteignable (livrets, obligations)"
                              : goalResult.rate < 0.1
                                ? "⚡ Marché actions diversifié"
                                : "🚨 Très ambitieux (>10% requis)"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Comparison table */}
                <div
                  style={{
                    marginTop: 24,
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: 16,
                    padding: 20,
                    border: "1px solid var(--border)",
                  }}
                >
                  <p style={{ fontSize: 13, fontWeight: 700, color: "white", marginBottom: 14 }}>
                    📊 Comparaison des scénarios (objectif : {fmt(goalTarget)})
                  </p>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr>
                          {["Rendement", "PMT nécessaire", "Total versé", "Gains intérêts", "Ratio effort/gains"].map(
                            h => (
                              <th
                                key={h}
                                style={{
                                  textAlign: "left",
                                  padding: "8px 12px",
                                  color: "var(--text-muted)",
                                  fontWeight: 700,
                                  fontSize: 10,
                                  textTransform: "uppercase",
                                  borderBottom: "1px solid var(--border)",
                                }}
                              >
                                {h}
                              </th>
                            ),
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {[3, 5, 7, 10, 12].map(rr => {
                          const res = solveGoal(goalTarget, goalCapital, rr / 100, goalDuration)
                          if (res.pmt === null) return null
                          const totalPaid = res.pmt * goalDuration * 12 + goalCapital
                          const gains = goalTarget - totalPaid
                          return (
                            <tr
                              key={rr}
                              style={{
                                background: rr === goalRate ? "rgba(99,102,241,0.1)" : "transparent",
                                borderBottom: "1px solid rgba(255,255,255,0.03)",
                              }}
                            >
                              <td
                                style={{
                                  padding: "10px 12px",
                                  color: rr === goalRate ? "#6366f1" : "white",
                                  fontWeight: rr === goalRate ? 700 : 400,
                                }}
                              >
                                {rr}%{rr === goalRate ? " ←" : ""}
                              </td>
                              <td style={{ padding: "10px 12px", color: "var(--primary)", fontWeight: 600 }}>
                                {fmt(res.pmt)}
                              </td>
                              <td style={{ padding: "10px 12px", color: "#e2e8f0" }}>{fmt(totalPaid)}</td>
                              <td style={{ padding: "10px 12px", color: gains > 0 ? "var(--primary)" : "#ef4444" }}>
                                {gains > 0 ? "+" : ""}
                                {fmt(gains)}
                              </td>
                              <td style={{ padding: "10px 12px", color: "var(--text-muted)" }}>
                                {totalPaid > 0 ? Math.round((totalPaid / goalTarget) * 100) : 0}% effort
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Responsive style */}
      <style>{`
        @media (max-width: 1050px) {
          .responsive-grid {
            grid-template-columns: 1fr !important;
          }
          aside {
            max-height: none !important;
            position: relative !important;
            top: 0 !important;
          }
        }
        @media (max-width: 900px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 800px) {
          .rente-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 640px) {
          .app-root {
            padding: 12px !important;
          }
          .responsive-grid {
            gap: 16px !important;
          }
          .responsive-grid main {
            gap: 16px !important;
          }
          aside {
            padding: 18px !important;
            border-radius: 20px !important;
          }
          .card-mobile {
            padding: 18px !important;
            border-radius: 20px !important;
          }
          .stat-card {
            padding: 14px 16px !important;
            border-radius: 16px !important;
          }
          .stat-card h2 {
            font-size: 20px !important;
          }
          .stats-grid {
            gap: 12px !important;
          }
          .mc-chart-wrap,
          .chart-card {
            min-height: 300px !important;
          }
          .tabs-bar {
            flex-wrap: wrap !important;
          }
          .tabs-bar button {
            flex: 1 1 44% !important;
            font-size: 11px !important;
            padding: 10px 4px !important;
          }
          .action-bar {
            flex-wrap: wrap !important;
          }
          .action-bar button {
            flex: 1 1 47% !important;
            justify-content: center !important;
          }
          .mc-header {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }
          .mc-header button {
            width: 100% !important;
          }
          .table-toggle {
            flex-wrap: wrap !important;
            gap: 6px !important;
          }
          .mc-scenarios,
          .rente-grid,
          .decumulation-grid,
          .goal-inputs,
          .goal-results {
            grid-template-columns: 1fr !important;
          }
          .goal-results > div {
            padding: 20px !important;
            border-radius: 16px !important;
          }
          .responsive-grid input[type="number"] {
            font-size: 16px !important;
          }
          .responsive-grid select {
            font-size: 16px !important;
          }
          input[type="range"]::-webkit-slider-thumb {
            width: 22px;
            height: 22px;
          }
          input[type="range"]::-moz-range-thumb {
            width: 22px;
            height: 22px;
          }
          body {
            -webkit-tap-highlight-color: transparent;
          }
        }
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
        }
      `}</style>
    </div>
  )
}
