import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://fxyxkdomzisuprbriyri.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4eXhrZG9temlzdXByYnJpeXJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNTY4MDksImV4cCI6MjA5MDkzMjgwOX0.fe2_TTDLuEyo2UfiFxlTPSIIe2HXqRBgPi-I6XTcK28'
)

// DB row ↔ JS object mappers
export const dbToEv = r => ({
  id: r.id, title: r.title, date: r.date,
  endDate: r.end_date || null, cat: r.cat, note: r.note || ''
})
export const evToDb = (o, ws) => ({
  id: o.id, workspace_id: ws, title: o.title, date: o.date,
  end_date: o.endDate || null, cat: o.cat, note: o.note || ''
})

export const dbToSup = r => ({
  id: r.id, name: r.name || '', nameKo: r.name_ko, city: r.city || '',
  country: r.country || 'CN', cat: r.cat || '가구', contact: r.contact || '',
  wechat: r.wechat || '', phone: r.phone || '',
  rating: r.rating || 3, status: r.status || 'active', note: r.note || ''
})
export const supToDb = (o, ws) => ({
  id: o.id, workspace_id: ws, name: o.name, name_ko: o.nameKo,
  city: o.city, country: o.country, cat: o.cat, contact: o.contact,
  wechat: o.wechat, phone: o.phone, rating: Number(o.rating),
  status: o.status, note: o.note
})

export const dbToPo = r => ({
  id: r.id, title: r.title, supplierId: r.supplier_id || null,
  cat: r.cat || '가구', qty: r.qty || '', amount: r.amount || '',
  currency: r.currency || 'CNY', stage: r.stage, deadline: r.deadline || '',
  note: r.note || ''
})
export const poToDb = (o, ws) => ({
  id: o.id, workspace_id: ws, title: o.title,
  supplier_id: o.supplierId ? String(o.supplierId) : null,
  cat: o.cat, qty: o.qty, amount: o.amount, currency: o.currency,
  stage: o.stage, deadline: o.deadline, note: o.note
})
