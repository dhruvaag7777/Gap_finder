import React, { useMemo } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts'

function getSaturationColor(level) {
  if (level <= 30) return '#10b981'
  if (level <= 60) return '#f59e0b'
  return '#ef4444'
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const item = payload[0]?.payload
  return (
    <div className="px-4 py-3 rounded-xl bg-[#111111] border border-[#2a2a2a] shadow-2xl">
      <p className="font-medium text-white text-sm mb-1">{item?.fullName || label}</p>
      <p className="text-[#9ca3af] text-xs">Saturation: {Math.round(item?.level || 0)}%</p>
    </div>
  )
}

export default function LandscapeCard({ landscape, sources }) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rx = useSpring(useTransform(y, [-60, 60], [8, -8]), { stiffness: 140, damping: 20 })
  const ry = useSpring(useTransform(x, [-60, 60], [-8, 8]), { stiffness: 140, damping: 20 })

  if (!landscape) return null

  const { summary, saturated_areas = [] } = landscape
  const chartData = useMemo(() => saturated_areas.map((a) => ({
    name: a.name?.slice(0, 28) + (a.name?.length > 28 ? '…' : ''),
    fullName: a.name,
    level: Number(a.saturation_level) || 0,
    fill: getSaturationColor(Number(a.saturation_level) || 0),
  })), [saturated_areas])

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    x.set(e.clientX - rect.left - rect.width / 2)
    y.set(e.clientY - rect.top - rect.height / 2)
  }

  const onLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      className="tilt-card bg-[#121212]/95 border border-[#2a2a2a] rounded-2xl p-8 relative overflow-hidden group hover:border-[#414141]"
      style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_30%,rgba(124,58,237,0.15),transparent_42%)] pointer-events-none" />
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-emerald opacity-70 group-hover:opacity-100 transition-opacity" />

      <div className="pl-4 relative z-10">
        <h2 className="text-xl font-bold text-white mb-4 tracking-tight">Research Landscape</h2>
        <p className="text-[#e5e7eb] leading-relaxed mb-8 max-w-3xl">{summary}</p>

        {chartData.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-4">Saturation Map</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 24 }}>
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fill: '#9ca3af', fontSize: 13 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="level" radius={[0, 6, 6, 0]} animationDuration={1200} animationBegin={100}>
                    {chartData.map((entry, idx) => (<Cell key={idx} fill={entry.fill} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {sources?.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-3">Sources</h3>
            <div className="flex flex-wrap gap-2">
              {sources.map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm text-primary hover:border-primary/50 hover:-translate-y-0.5 transition-all duration-200 truncate max-w-[220px]">
                  {s.title || 'Source'}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
