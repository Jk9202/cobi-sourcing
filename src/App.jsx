import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { supabase, dbToEv, evToDb, dbToSup, supToDb, dbToPo, poToDb } from './supabase'

/* ═══════════════════ CONSTANTS ═══════════════════ */
const ECAT = {
  po:        { label:'PO 마감',     color:'#EF4444', bg:'rgba(239,68,68,0.13)',  icon:'📋' },
  supplier:  { label:'공급사 미팅', color:'#F59E0B', bg:'rgba(245,158,11,0.13)', icon:'🤝' },
  fair:      { label:'박람회/전시', color:'#10B981', bg:'rgba(16,185,129,0.13)', icon:'🏛️' },
  qc:        { label:'검수/QC',     color:'#3B82F6', bg:'rgba(59,130,246,0.13)', icon:'✅' },
  payment:   { label:'결제/송금',   color:'#8B5CF6', bg:'rgba(139,92,246,0.13)', icon:'💰' },
  contract:  { label:'계약/협상',   color:'#EC4899', bg:'rgba(236,72,153,0.13)', icon:'📝' },
  milestone: { label:'마일스톤',    color:'#6366F1', bg:'rgba(99,102,241,0.13)', icon:'🎯' },
  other:     { label:'기타',        color:'#64748B', bg:'rgba(100,116,139,0.13)',icon:'📌' },
}
const PO_STAGES = ['RFQ발송','견적검토','발주확정','생산중','검수','완료']
const PC = {
  'RFQ발송':  { color:'#64748B', bg:'rgba(100,116,139,0.15)' },
  '견적검토': { color:'#F59E0B', bg:'rgba(245,158,11,0.15)'  },
  '발주확정': { color:'#3B82F6', bg:'rgba(59,130,246,0.15)'  },
  '생산중':   { color:'#8B5CF6', bg:'rgba(139,92,246,0.15)'  },
  '검수':     { color:'#F97316', bg:'rgba(249,115,22,0.15)'  },
  '완료':     { color:'#10B981', bg:'rgba(16,185,129,0.15)'  },
}
const SUP_CATS   = ['가구','조명','패브릭/소품','수납','침구','데코','주방','기타']
const SUP_STATUS = { active:'활성', inactive:'비활성', watch:'요주의' }
const SUP_STATUS_COLOR = { active:'#10B981', inactive:'#64748B', watch:'#EF4444' }
const WD = ['일','월','화','수','목','금','토']
const MO = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

/* ═══════════════════ SEED DATA ═══════════════════ */
const SEED_EV = [
  {id:'s-ev-1', title:'🎉 입사 D-day',           date:'2026-04-13', endDate:null,        cat:'milestone', note:'COBI Group 중국소싱팀 대리 입사'},
  {id:'s-ev-2', title:'COBI HOME 쇼룸 워크스루', date:'2026-04-14', endDate:'2026-04-16',cat:'qc',        note:'입점 브랜드별 단가 현황 메모'},
  {id:'s-ev-3', title:'1688 RFQ 발송 마감',       date:'2026-04-28', endDate:null,        cat:'po',        note:'이우 공급사 RFQ 발송'},
  {id:'s-ev-4', title:'광저우 가구 박람회',       date:'2026-03-15', endDate:'2026-03-20',cat:'fair',      note:'신규 공급사 발굴'},
  {id:'s-ev-5', title:'VIFA ASEAN 전시',          date:'2026-08-10', endDate:'2026-08-15',cat:'fair',      note:'호치민 SECC'},
  {id:'s-ev-6', title:'소파 1차 T/T 송금',        date:'2026-04-10', endDate:null,        cat:'payment',   note:'30% 선금 ¥3,600'},
  {id:'s-ev-7', title:'공급사 연간계약 검토',     date:'2026-04-22', endDate:null,        cat:'contract',  note:'佛山格兰家具 연간계약'},
  {id:'s-ev-8', title:'수납장 입고 검수',         date:'2026-04-08', endDate:null,        cat:'qc',        note:'3PL 창고 검수'},
]
const SEED_SUP = [
  {id:'s-su-1', name:'义乌华美家居', nameKo:'화메이가구', city:'义乌', country:'CN', cat:'가구',       contact:'李伟',  wechat:'liwei_hw',    phone:'+86-138-0001-0001', rating:4, status:'active', note:'COG/HIKO 주력 공급사. MOQ 100pcs.'},
  {id:'s-su-2', name:'广州美家软装', nameKo:'메이자소품', city:'广州', country:'CN', cat:'패브릭/소품', contact:'张晓梅', wechat:'mj_zhangmei', phone:'+86-139-0002-0002', rating:3, status:'active', note:'쿠션·커튼류 전문.'},
  {id:'s-su-3', name:'佛山格兰家具', nameKo:'거란가구',   city:'佛山', country:'CN', cat:'가구',       contact:'陈志强', wechat:'gelan_chen',  phone:'+86-137-0003-0003', rating:5, status:'active', note:'소파·침대프레임 전문.'},
  {id:'s-su-4', name:'深圳优雅灯具', nameKo:'유야조명',   city:'深圳', country:'CN', cat:'조명',       contact:'王芳',  wechat:'yd_wangfang', phone:'+86-136-0004-0004', rating:4, status:'active', note:'LED 펜던트·스탠드.'},
  {id:'s-su-5', name:'杭州简约家居', nameKo:'젠약가구',   city:'杭州', country:'CN', cat:'수납',       contact:'刘明',  wechat:'jianyue_lm',  phone:'+86-135-0005-0005', rating:2, status:'watch',  note:'납기 지연 2회. 요주의.'},
  {id:'s-su-6', name:'成都温馨家纺', nameKo:'원신침구',   city:'成都', country:'CN', cat:'침구',       contact:'赵雪',  wechat:'wx_zhaoxue',  phone:'+86-134-0006-0006', rating:3, status:'active', note:'침구·타월류. 계절 주문 위주.'},
]
const SEED_PO = [
  {id:'s-po-1', title:'소파 3인용 샘플',   supplierId:'s-su-3', cat:'가구',       qty:'2세트',  amount:'¥12,000', currency:'CNY', stage:'생산중',   deadline:'2026-04-20', note:'컬러: 베이지·그레이'},
  {id:'s-po-2', title:'LED 펜던트 샘플',   supplierId:'s-su-4', cat:'조명',       qty:'5개',    amount:'¥3,500',  currency:'CNY', stage:'견적검토', deadline:'2026-04-15', note:'E27소켓'},
  {id:'s-po-3', title:'쿠션·커튼 세트',    supplierId:'s-su-2', cat:'패브릭/소품', qty:'20세트', amount:'¥8,200',  currency:'CNY', stage:'발주확정', deadline:'2026-05-10', note:'패턴 3종'},
  {id:'s-po-4', title:'수납장 모듈 세트',  supplierId:'s-su-1', cat:'수납',       qty:'10세트', amount:'¥15,000', currency:'CNY', stage:'검수',     deadline:'2026-04-08', note:'화이트 오크'},
  {id:'s-po-5', title:'사이드테이블 샘플', supplierId:'s-su-5', cat:'가구',       qty:'3개',    amount:'TBD',     currency:'CNY', stage:'RFQ발송',  deadline:'2026-04-30', note:'대리석 상판'},
  {id:'s-po-6', title:'펜던트 조명 벌크',  supplierId:'s-su-4', cat:'조명',       qty:'50개',   amount:'¥29,000', currency:'CNY', stage:'완료',     deadline:'2026-03-15', note:'입고 완료'},
]

/* ═══════════════════ HELPERS ═══════════════════ */
const toStr  = d => { const y=d.getFullYear(),mo=String(d.getMonth()+1).padStart(2,'0'),dy=String(d.getDate()).padStart(2,'0'); return `${y}-${mo}-${dy}` }
const toDate = s => { const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d) }
const dN     = s => { const t=new Date(); t.setHours(0,0,0,0); const g=toDate(s); g.setHours(0,0,0,0); return Math.round((g-t)/864e5) }
const dL     = s => { const n=dN(s); if(n===0)return'D-Day'; if(n<0)return`D+${Math.abs(n)}`; return`D-${n}` }
const onDate = (ev,s) => ev.endDate?(ev.date<=s&&ev.endDate>=s):ev.date===s
const TODAY  = toStr(new Date())
const CUR_MO = TODAY.slice(0,7)
const uid    = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
const Stars  = ({n}) => <span style={{color:'#F59E0B',letterSpacing:1}}>{'★'.repeat(n)}{'☆'.repeat(5-n)}</span>

/* ═══════════════════ CSS ═══════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap');
:root{
  --bg:#0A0F1A;--p1:#111827;--p2:#1A2537;--p3:#243044;
  --bd:#1E2D42;--bd2:#2A3A52;
  --tx:#E8EEF6;--tx2:#8FA3BC;--tx3:#4A6380;
  --ac:#F59E0B;--ac2:rgba(245,158,11,0.14);--ac3:rgba(245,158,11,0.06);
  --red:#EF4444;--grn:#10B981;--blu:#3B82F6;
  --sh:0 4px 20px rgba(0,0,0,0.4);--sh2:0 8px 40px rgba(0,0,0,0.6);
  --nav:220px;--bnav:60px;
  --font:'Noto Sans KR',system-ui,sans-serif;
  --mono:'DM Mono',monospace;
  --display:'Syne',sans-serif;
}
[data-theme=light]{
  --bg:#F0F4F8;--p1:#FFFFFF;--p2:#F8FAFC;--p3:#EEF2F7;
  --bd:#E2E8F0;--bd2:#CBD5E1;
  --tx:#0F1923;--tx2:#4A6380;--tx3:#94A3B8;
  --ac:#F59E0B;--ac2:rgba(245,158,11,0.12);--ac3:rgba(245,158,11,0.05);
  --sh:0 2px 12px rgba(0,0,0,0.07);--sh2:0 8px 30px rgba(0,0,0,0.12);
}
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
html,body,#root{height:100%;overflow:hidden;}
body{font-family:var(--font);background:var(--bg);color:var(--tx);font-size:14px;-webkit-font-smoothing:antialiased;}

/* Layout */
.wrap{display:flex;height:100vh;position:relative;}
.nav{width:var(--nav);min-width:var(--nav);background:var(--p1);border-right:1px solid var(--bd);display:flex;flex-direction:column;z-index:50;transition:transform .3s cubic-bezier(.4,0,.2,1),box-shadow .3s;overflow:hidden;}
.nav-in{padding:20px 14px 20px;display:flex;flex-direction:column;gap:6px;height:100%;overflow-y:auto;}
.logo{display:flex;align-items:center;gap:10px;padding:4px 10px 16px;border-bottom:1px solid var(--bd);margin-bottom:8px;}
.logo-ic{width:32px;height:32px;background:var(--ac);border-radius:8px;display:flex;align-items:center;justify-content:center;color:#000;font-weight:800;font-size:11px;flex-shrink:0;font-family:var(--display);}
.logo-txt{font-family:var(--display);font-size:15px;font-weight:800;letter-spacing:-.3px;}
.logo-sub{font-size:9px;color:var(--tx3);font-weight:500;margin-top:1px;}
.nav-section{font-size:9px;font-weight:700;color:var(--tx3);text-transform:uppercase;letter-spacing:1.5px;padding:12px 10px 6px;}
.ni{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:10px;cursor:pointer;font-size:13px;color:var(--tx2);user-select:none;transition:all .15s;font-weight:500;}
.ni:hover{background:var(--p2);color:var(--tx);}
.ni.on{background:var(--ac2);color:var(--ac);font-weight:700;}
.ni-icon{font-size:15px;width:20px;text-align:center;flex-shrink:0;}
.nav-divider{height:1px;background:var(--bd);margin:8px 0;}
.cat-row{display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:8px;cursor:pointer;font-size:12px;color:var(--tx2);transition:all .15s;user-select:none;}
.cat-row:hover{background:var(--p2);color:var(--tx);}
.cat-row.on{background:var(--ac2);color:var(--ac);font-weight:600;}
.cat-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;}
.up-card{background:var(--p2);border:1px solid var(--bd);padding:10px 12px;border-radius:10px;margin-bottom:6px;cursor:pointer;transition:border-color .2s;}
.up-card:hover{border-color:var(--ac);}
.bk{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(3px);z-index:40;}
.main{flex:1;display:flex;flex-direction:column;min-width:0;overflow:hidden;}
.app-hdr{height:56px;padding:0 20px;display:flex;align-items:center;justify-content:space-between;background:var(--p1);border-bottom:1px solid var(--bd);flex-shrink:0;gap:10px;}
.app-hdr-l{display:flex;align-items:center;gap:10px;}
.app-hdr-r{display:flex;align-items:center;gap:8px;}
.page-title{font-family:var(--display);font-size:17px;font-weight:800;letter-spacing:-.4px;}
.page-title span{color:var(--ac);}
.btn{padding:7px 13px;border-radius:8px;border:1px solid var(--bd2);background:var(--p1);cursor:pointer;font-weight:600;font-size:12px;color:var(--tx);display:flex;align-items:center;gap:5px;transition:all .15s;font-family:var(--font);white-space:nowrap;}
.btn:hover{background:var(--p2);}
.btn-ac{background:var(--ac);border-color:var(--ac);color:#000;}
.btn-ac:hover{opacity:.88;}
.btn-sm{padding:5px 10px;font-size:11px;}
.btn-danger{color:var(--red);border-color:var(--red);}
.btn-danger:hover{background:rgba(239,68,68,.08);}
.ic-btn{width:34px;height:34px;border-radius:8px;border:1px solid var(--bd);display:flex;align-items:center;justify-content:center;cursor:pointer;background:var(--p1);font-size:15px;transition:all .15s;flex-shrink:0;}
.ic-btn:hover{background:var(--p2);}
.view{flex:1;overflow:hidden;display:flex;flex-direction:column;}

/* Sync indicator */
.sync-dot{width:8px;height:8px;border-radius:50%;background:var(--grn);flex-shrink:0;transition:background .3s;}
.sync-dot.syncing{background:var(--ac);animation:pulse 1s infinite;}
.sync-dot.offline{background:var(--red);}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}

/* Loading overlay */
.loading-overlay{position:fixed;inset:0;background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:200;gap:16px;}
.loading-logo{font-family:var(--display);font-size:32px;font-weight:800;color:var(--ac);}
.loading-sub{font-size:13px;color:var(--tx3);}
.spinner{width:32px;height:32px;border:3px solid var(--bd);border-top-color:var(--ac);border-radius:50%;animation:spin .8s linear infinite;}
@keyframes spin{to{transform:rotate(360deg)}}

/* Workspace gate */
.ws-gate{position:fixed;inset:0;background:var(--bg);display:flex;align-items:center;justify-content:center;z-index:200;padding:20px;}
.ws-card{background:var(--p1);border:1px solid var(--bd);border-radius:20px;padding:32px 28px;width:100%;max-width:400px;box-shadow:var(--sh2);}
.ws-logo{font-family:var(--display);font-size:28px;font-weight:800;color:var(--ac);margin-bottom:4px;}
.ws-sub{font-size:13px;color:var(--tx3);margin-bottom:28px;}
.ws-input{width:100%;padding:12px 16px;border-radius:10px;border:1px solid var(--bd2);background:var(--bg);color:var(--tx);font-size:16px;font-family:var(--font);outline:none;letter-spacing:2px;transition:border-color .2s;}
.ws-input:focus{border-color:var(--ac);}
.ws-hint{font-size:11px;color:var(--tx3);margin-top:8px;margin-bottom:20px;}
.ws-btn{width:100%;padding:13px;border-radius:10px;background:var(--ac);border:none;color:#000;font-weight:700;font-size:14px;cursor:pointer;font-family:var(--font);transition:opacity .2s;}
.ws-btn:hover{opacity:.88;}
.ws-btn:disabled{opacity:.4;cursor:not-allowed;}

/* Dashboard */
.dash{flex:1;overflow-y:auto;padding:20px;}
.kpi-row{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;}
.kpi{background:var(--p1);border:1px solid var(--bd);border-radius:14px;padding:16px 18px;position:relative;overflow:hidden;transition:border-color .2s;}
.kpi:hover{border-color:var(--ac);}
.kpi-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px;}
.kpi-icon{font-size:20px;}
.kpi-val{font-family:var(--display);font-size:26px;font-weight:800;line-height:1;margin-bottom:4px;}
.kpi-label{font-size:11px;color:var(--tx3);font-weight:600;text-transform:uppercase;letter-spacing:.5px;}
.kpi-bar{position:absolute;bottom:0;left:0;right:0;height:3px;background:var(--bd);}
.kpi-bar-fill{height:100%;border-radius:2px;transition:width .6s ease;}
.dash-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;}
.panel{background:var(--p1);border:1px solid var(--bd);border-radius:14px;padding:16px;}
.panel-title{font-family:var(--display);font-size:13px;font-weight:800;margin-bottom:14px;display:flex;align-items:center;gap:8px;letter-spacing:-.2px;}
.panel-title .pt-badge{font-size:10px;font-weight:700;background:var(--ac2);color:var(--ac);padding:2px 8px;border-radius:20px;font-family:var(--font);}
.dl-row{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--bd);}
.dl-row:last-child{border-bottom:none;}
.dl-ic{width:28px;height:28px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;}
.dl-info{flex:1;min-width:0;}
.dl-title{font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.dl-sub{font-size:10px;color:var(--tx3);margin-top:1px;}
.d-badge{font-size:11px;font-weight:800;font-family:var(--mono);flex-shrink:0;}
.stage-row{display:flex;align-items:center;gap:10px;margin-bottom:10px;}
.stage-row:last-child{margin-bottom:0;}
.stage-name{font-size:12px;font-weight:600;width:60px;flex-shrink:0;}
.stage-bar-wrap{flex:1;height:6px;background:var(--p3);border-radius:3px;overflow:hidden;}
.stage-bar-fill{height:100%;border-radius:3px;transition:width .6s ease;}
.stage-count{font-size:12px;font-weight:700;font-family:var(--mono);width:20px;text-align:right;flex-shrink:0;}
.alert-row{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--bd);}
.alert-row:last-child{border-bottom:none;}
.alert-icon{font-size:16px;flex-shrink:0;}
.alert-info{flex:1;min-width:0;}
.alert-title{font-size:12px;font-weight:600;}
.alert-sub{font-size:10px;color:var(--tx3);}
.alert-badge{font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;}

/* Calendar */
.cal-stats{padding:10px 20px;background:var(--p1);border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:24px;flex-shrink:0;flex-wrap:wrap;}
.sl{font-size:10px;color:var(--tx3);font-weight:600;text-transform:uppercase;letter-spacing:.5px;}
.sv{font-size:14px;font-weight:700;margin-top:1px;font-family:var(--mono);}
.pw{height:4px;background:var(--bd);border-radius:2px;overflow:hidden;margin-top:4px;}
.pb{height:100%;background:var(--ac);border-radius:2px;transition:width .6s;}
.cal-cat-strip{display:none;padding:6px 10px;background:var(--p1);border-bottom:1px solid var(--bd);gap:6px;overflow-x:auto;flex-shrink:0;-webkit-overflow-scrolling:touch;}
.cal-cat-strip::-webkit-scrollbar{display:none;}
.ccs-pill{display:flex;align-items:center;gap:4px;padding:4px 10px;border-radius:20px;border:1px solid var(--bd);background:var(--p2);font-size:11px;font-weight:600;color:var(--tx2);cursor:pointer;white-space:nowrap;flex-shrink:0;transition:all .15s;}
.ccs-pill.on{border-color:var(--ac);color:var(--ac);background:var(--ac2);}
.ccs-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;}
.cal-body{flex:1;padding:14px 20px;overflow-y:auto;overflow-x:hidden;}
.wd-row{display:grid;grid-template-columns:repeat(7,1fr);margin-bottom:6px;}
.wd{text-align:center;font-size:11px;font-weight:700;color:var(--tx3);}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);grid-auto-rows:minmax(88px,1fr);background:var(--bd);border-radius:12px;overflow:hidden;gap:1px;}
.day{background:var(--p1);padding:8px 7px;display:flex;flex-direction:column;gap:3px;cursor:pointer;min-width:0;transition:background .15s;}
.day:hover{background:var(--p2);}
.day.dim{opacity:.3;}
.day.tc{background:var(--ac3);}
.dn{font-size:12px;font-weight:700;color:var(--tx2);margin-bottom:1px;flex-shrink:0;font-family:var(--mono);}
.tc .dn{color:var(--ac);font-weight:800;}
.dn-today{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:var(--ac);color:#000;font-size:11px;font-weight:800;}
.epill{padding:2px 6px;border-radius:5px;font-size:10px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.6;}
.emore{font-size:9px;color:var(--tx3);font-family:var(--mono);}
.ev-dots{display:none;flex-wrap:wrap;gap:3px;margin-top:2px;}
.ev-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;}

/* Agenda */
.agenda{flex:1;overflow-y:auto;padding:12px 14px;display:none;}
.ag-grp{margin-bottom:16px;}
.ag-hdr{font-size:11px;font-weight:700;color:var(--tx3);padding:6px 0;border-bottom:1px solid var(--bd);margin-bottom:8px;display:flex;align-items:center;gap:8px;}
.ag-hdr .adate{font-size:14px;font-weight:800;color:var(--tx);font-family:var(--mono);}
.ag-card{background:var(--p1);border:1px solid var(--bd);border-radius:10px;padding:11px 14px;margin-bottom:7px;display:flex;align-items:flex-start;gap:10px;cursor:pointer;transition:border-color .2s;}
.ag-card:hover{border-color:var(--ac);}
.ag-bar{width:3px;min-height:36px;border-radius:2px;flex-shrink:0;align-self:stretch;}
.ag-info{flex:1;min-width:0;}
.ag-title{font-weight:700;font-size:13px;margin-bottom:2px;}
.ag-meta{font-size:11px;color:var(--tx3);}
.ag-d{font-size:11px;font-weight:800;padding:3px 8px;border-radius:20px;flex-shrink:0;font-family:var(--mono);}

/* Suppliers */
.sup-view{flex:1;overflow-y:auto;padding:18px 20px;}
.toolbar{display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap;}
.search-wrap{flex:1;min-width:160px;position:relative;}
.search-ic{position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:14px;pointer-events:none;}
.search-in{width:100%;padding:8px 12px 8px 32px;border-radius:9px;border:1px solid var(--bd2);background:var(--p2);color:var(--tx);font-size:13px;font-family:var(--font);outline:none;transition:border-color .2s;}
.search-in:focus{border-color:var(--ac);}
.filter-pills{display:flex;gap:6px;flex-wrap:wrap;}
.fp{padding:5px 12px;border-radius:20px;border:1px solid var(--bd);background:var(--p2);font-size:11px;font-weight:600;color:var(--tx2);cursor:pointer;transition:all .15s;user-select:none;}
.fp:hover{border-color:var(--ac);color:var(--ac);}
.fp.on{background:var(--ac2);border-color:var(--ac);color:var(--ac);}
.sup-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
.sup-card{background:var(--p1);border:1px solid var(--bd);border-radius:14px;padding:16px;cursor:pointer;transition:all .2s;position:relative;}
.sup-card:hover{border-color:var(--ac);transform:translateY(-2px);box-shadow:var(--sh);}
.sup-card-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px;}
.sup-name-ko{font-family:var(--display);font-size:14px;font-weight:800;margin-bottom:2px;}
.sup-name-cn{font-size:11px;color:var(--tx3);}
.status-badge{font-size:10px;font-weight:700;padding:3px 9px;border-radius:20px;}
.sup-meta{display:flex;flex-direction:column;gap:5px;margin-bottom:10px;}
.sup-meta-row{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--tx2);}
.sup-meta-ic{font-size:12px;width:16px;text-align:center;}
.sup-card-footer{display:flex;align-items:center;justify-content:space-between;padding-top:10px;border-top:1px solid var(--bd);}
.cat-badge{font-size:10px;font-weight:700;padding:3px 9px;border-radius:20px;background:var(--ac2);color:var(--ac);}

/* PO Pipeline */
.po-view{flex:1;display:flex;flex-direction:column;overflow:hidden;}
.po-toolbar{padding:12px 20px;background:var(--p1);border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:10px;flex-shrink:0;flex-wrap:wrap;}
.po-board{flex:1;display:flex;gap:0;overflow-x:auto;padding:16px 12px;background:var(--bg);}
.po-col{min-width:220px;max-width:220px;background:var(--p2);border-radius:12px;display:flex;flex-direction:column;border:1px solid var(--bd);margin:0 6px;transition:border-color .2s;}
.po-col.drag-over{border-color:var(--ac);background:var(--ac3);}
.po-col-hdr{padding:12px 14px;border-bottom:1px solid var(--bd);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
.po-col-title{font-size:12px;font-weight:700;display:flex;align-items:center;gap:7px;}
.po-stage-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
.po-count{font-size:11px;font-weight:700;font-family:var(--mono);padding:1px 7px;border-radius:12px;}
.po-cards{flex:1;padding:10px;display:flex;flex-direction:column;gap:8px;overflow-y:auto;min-height:100px;}
.po-card{background:var(--p1);border:1px solid var(--bd);border-radius:10px;padding:12px;cursor:grab;transition:all .2s;user-select:none;}
.po-card:hover{border-color:var(--ac);box-shadow:var(--sh);}
.po-card:active{cursor:grabbing;opacity:.85;}
.po-card-title{font-size:12px;font-weight:700;margin-bottom:7px;line-height:1.3;}
.po-card-meta{display:flex;flex-direction:column;gap:3px;}
.po-meta-row{display:flex;align-items:center;justify-content:space-between;font-size:10px;color:var(--tx3);}
.po-meta-val{font-weight:600;color:var(--tx2);font-family:var(--mono);}
.po-deadline{font-size:10px;font-weight:800;font-family:var(--mono);}
.po-add-btn{width:100%;padding:8px;border-radius:8px;border:1px dashed var(--bd2);background:transparent;cursor:pointer;font-size:11px;color:var(--tx3);transition:all .2s;font-family:var(--font);margin-top:4px;}
.po-add-btn:hover{border-color:var(--ac);color:var(--ac);}
.po-empty{padding:20px;text-align:center;font-size:11px;color:var(--tx3);}

/* Modal */
.ov{position:fixed;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(5px);display:flex;align-items:flex-end;justify-content:center;z-index:100;}
.modal{background:var(--p1);width:100%;max-width:520px;border-radius:20px 20px 0 0;padding:24px 22px 32px;box-shadow:var(--sh2);border:1px solid var(--bd);animation:su .25s ease;max-height:92vh;overflow-y:auto;}
@keyframes su{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
.m-handle{width:40px;height:4px;background:var(--bd2);border-radius:2px;margin:0 auto 16px;}
.m-title{font-family:var(--display);font-size:18px;font-weight:800;margin-bottom:20px;letter-spacing:-.3px;}
.fg{margin-bottom:14px;}
.fl{display:block;font-size:10px;font-weight:700;color:var(--tx3);margin-bottom:5px;text-transform:uppercase;letter-spacing:.6px;}
.fi{width:100%;padding:10px 12px;border-radius:9px;border:1px solid var(--bd2);background:var(--bg);color:var(--tx);outline:none;font-size:13px;font-family:var(--font);transition:border-color .2s;}
.fi:focus{border-color:var(--ac);}
textarea.fi{resize:none;}
.two{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.three{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;}
.m-actions{display:flex;gap:10px;margin-top:22px;align-items:center;flex-wrap:wrap;}

/* Bottom Nav */
.bnav{display:none;height:var(--bnav);background:var(--p1);border-top:1px solid var(--bd);flex-shrink:0;align-items:center;justify-content:space-around;}
.bi{display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;flex:1;padding:8px 0;border-radius:10px;transition:background .15s;}
.bi:hover{background:var(--p2);}
.bi-ic{font-size:18px;line-height:1;}
.bi-lb{font-size:9px;font-weight:600;color:var(--tx3);}
.bi.on .bi-lb{color:var(--ac);}

/* Common */
.badge{font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;}
.empty-state{text-align:center;padding:40px 20px;color:var(--tx3);font-size:13px;}
.empty-icon{font-size:36px;margin-bottom:12px;}
.sep{height:1px;background:var(--bd);margin:8px 0;}
.hbg{display:none;}

/* Responsive */
@media(min-width:769px){
  .nav{position:static;transform:none!important;box-shadow:none!important;}
  .bk{display:none!important;}
  .ov{align-items:center;}
  .modal{border-radius:18px;max-width:520px;padding:28px;}
  .m-handle{display:none;}
  .bnav{display:none!important;}
  .hbg{display:none!important;}
  .agenda{display:none!important;}
  .cal-body{display:flex!important;flex-direction:column;}
  .cal-cat-strip{display:none!important;}
}
@media(max-width:1100px){
  .kpi-row{grid-template-columns:repeat(2,1fr);}
  .dash-grid{grid-template-columns:1fr;}
}
@media(max-width:900px){
  .sup-grid{grid-template-columns:repeat(2,1fr);}
}
@media(max-width:768px){
  .nav{position:fixed;top:0;left:0;bottom:0;box-shadow:var(--sh2);transform:translateX(-100%);}
  .nav.open{transform:translateX(0);}
  .bk.open{display:block;}
  .hbg{display:flex!important;}
  .bnav{display:flex;}
  .app-hdr{padding:0 12px;height:50px;}
  .page-title{font-size:15px;}
  .kpi-row{grid-template-columns:repeat(2,1fr);gap:8px;}
  .dash-grid{grid-template-columns:1fr;}
  .dash{padding:12px;}
  .sup-view{padding:12px;}
  .sup-grid{grid-template-columns:1fr;}
  .cal-cat-strip{display:flex;}
  .cal-stats{padding:8px 12px;gap:12px;overflow-x:auto;-webkit-overflow-scrolling:touch;flex-wrap:nowrap;}
  .cal-stats::-webkit-scrollbar{display:none;}
  .cal-body{padding:6px;}
  .cal-grid{grid-auto-rows:minmax(56px,1fr);gap:1px;}
  .day{padding:4px 3px;gap:2px;}
  .dn{font-size:11px;}
  .epill{display:none;}
  .ev-dots{display:flex;}
  .emore{display:none;}
  .po-view .po-toolbar{padding:10px 12px;}
  .show-cal .cal-body{display:flex;flex-direction:column;}
  .show-cal .agenda{display:none;}
  .show-agenda .cal-body{display:none!important;}
  .show-agenda .agenda{display:block;}
}
@media(max-width:400px){
  .kpi-val{font-size:20px;}
  .two,.three{grid-template-columns:1fr;}
  .cal-grid{grid-auto-rows:minmax(48px,1fr);}
  .day{padding:3px 2px;}
  .dn{font-size:10px;}
}
`

/* ═══════════════════ WORKSPACE GATE ═══════════════════ */
function WorkspaceGate({ onEnter }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const enter = async () => {
    const trimmed = code.trim().toLowerCase()
    if (!trimmed) return setError('코드를 입력해주세요')
    setLoading(true)
    setError('')
    try {
      // Test connection
      const { error: err } = await supabase.from('events').select('id').eq('workspace_id', trimmed).limit(1)
      if (err) throw err
      localStorage.setItem('cobi_ws', trimmed)
      onEnter(trimmed)
    } catch {
      setError('연결에 실패했습니다. 잠시 후 다시 시도해주세요.')
    }
    setLoading(false)
  }

  return (
    <div className="ws-gate">
      <div className="ws-card">
        <div className="ws-logo">COBI</div>
        <div className="ws-sub">Sourcing OS — 워크스페이스 코드를 입력하세요<br/>모든 기기에서 같은 코드 사용 = 데이터 동기화</div>
        <input
          className="ws-input"
          placeholder="예: cobi2026"
          value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && enter()}
          autoFocus
        />
        <div className="ws-hint" style={{color: error ? 'var(--red)' : 'var(--tx3)'}}>
          {error || '영문 소문자 + 숫자 조합 권장 · 처음 입력 시 자동 생성됩니다'}
        </div>
        <button className="ws-btn" onClick={enter} disabled={loading || !code.trim()}>
          {loading ? '연결 중...' : '입장하기 →'}
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════ DASHBOARD ═══════════════════ */
function Dashboard({ evs, pos, suppliers, setView }) {
  const upcoming7 = useMemo(() =>
    evs.filter(e => { const n=dN(e.date); return n>=0&&n<=7 })
       .sort((a,b) => a.date.localeCompare(b.date))
  ,[evs])

  const monthEvs   = evs.filter(e => e.date.startsWith(CUR_MO))
  const activePOs  = pos.filter(p => p.stage !== '완료')
  const stageCounts = {}
  PO_STAGES.forEach(s => stageCounts[s] = pos.filter(p => p.stage === s).length)
  const maxCount   = Math.max(...Object.values(stageCounts), 1)
  const watchSups  = suppliers.filter(s => s.status === 'watch')
  const activeSups = suppliers.filter(s => s.status === 'active')

  const kpis = [
    { icon:'📅', val:monthEvs.length,  label:'이번 달 일정', color:'var(--ac)',  bar:70 },
    { icon:'📦', val:activePOs.length, label:'진행중 발주',  color:'var(--blu)', bar:(activePOs.length/Math.max(pos.length,1))*100 },
    { icon:'🏭', val:activeSups.length,label:'활성 공급사',  color:'var(--grn)', bar:(activeSups.length/Math.max(suppliers.length,1))*100 },
    { icon:'⚠️', val:upcoming7.length, label:'7일 내 마감',  color:upcoming7.length>0?'var(--red)':'var(--grn)', bar:upcoming7.length>5?100:(upcoming7.length/5)*100 },
  ]

  return (
    <div className="dash">
      <div className="kpi-row">
        {kpis.map((k,i) => (
          <div key={i} className="kpi">
            <div className="kpi-top"><span className="kpi-icon">{k.icon}</span></div>
            <div className="kpi-val" style={{color:k.color}}>{k.val}</div>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-bar"><div className="kpi-bar-fill" style={{width:`${k.bar}%`,background:k.color}}/></div>
          </div>
        ))}
      </div>

      <div className="dash-grid">
        <div className="panel">
          <div className="panel-title">📌 임박 마감 <span className="pt-badge">{upcoming7.length}건</span></div>
          {upcoming7.length === 0
            ? <div className="empty-state"><div className="empty-icon">🎉</div>7일 내 마감 없음</div>
            : upcoming7.map(ev => (
              <div key={ev.id} className="dl-row">
                <div className="dl-ic" style={{background:ECAT[ev.cat].bg}}>{ECAT[ev.cat].icon}</div>
                <div className="dl-info">
                  <div className="dl-title">{ev.title}</div>
                  <div className="dl-sub">{ev.date}</div>
                </div>
                <div className="d-badge" style={{color:dN(ev.date)<=2?'var(--red)':'var(--ac)'}}>{dL(ev.date)}</div>
              </div>
            ))
          }
        </div>

        <div className="panel">
          <div className="panel-title">📦 발주 파이프라인</div>
          {PO_STAGES.map(s => (
            <div key={s} className="stage-row">
              <div className="stage-name" style={{color:PC[s].color}}>{s}</div>
              <div className="stage-bar-wrap"><div className="stage-bar-fill" style={{width:`${(stageCounts[s]/maxCount)*100}%`,background:PC[s].color}}/></div>
              <div className="stage-count" style={{color:PC[s].color}}>{stageCounts[s]}</div>
            </div>
          ))}
          <div className="sep"/>
          <button className="btn btn-sm" style={{marginTop:4}} onClick={() => setView('po')}>발주현황 보기 →</button>
        </div>
      </div>

      <div className="panel" style={{marginBottom:16}}>
        <div className="panel-title">🔄 진행중 발주 <span className="pt-badge">{activePOs.length}건</span></div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{borderBottom:'1px solid var(--bd)'}}>
                {['품목','공급사','단계','수량','금액','마감'].map(h => (
                  <th key={h} style={{padding:'7px 8px',color:'var(--tx3)',fontWeight:700,textAlign:'left',whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activePOs.map(po => {
                const sup = suppliers.find(s => s.id === po.supplierId)
                const urgent = dN(po.deadline) <= 3
                return (
                  <tr key={po.id} style={{borderBottom:'1px solid var(--bd)'}}>
                    <td style={{padding:'8px',fontWeight:600}}>{po.title}</td>
                    <td style={{padding:'8px',color:'var(--tx2)'}}>{sup?.nameKo || '-'}</td>
                    <td style={{padding:'8px'}}><span className="badge" style={{background:PC[po.stage].bg,color:PC[po.stage].color}}>{po.stage}</span></td>
                    <td style={{padding:'8px',color:'var(--tx2)',fontFamily:'var(--mono)'}}>{po.qty}</td>
                    <td style={{padding:'8px',fontWeight:700,fontFamily:'var(--mono)'}}>{po.amount}</td>
                    <td style={{padding:'8px',fontWeight:800,fontFamily:'var(--mono)',color:urgent?'var(--red)':'var(--tx2)'}}>{dL(po.deadline)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {watchSups.length > 0 && (
        <div className="panel">
          <div className="panel-title">⚠️ 요주의 공급사</div>
          {watchSups.map(s => (
            <div key={s.id} className="alert-row">
              <span className="alert-icon">🏭</span>
              <div className="alert-info">
                <div className="alert-title">{s.nameKo} ({s.name})</div>
                <div className="alert-sub">{s.note}</div>
              </div>
              <span className="alert-badge" style={{background:'rgba(239,68,68,0.12)',color:'var(--red)'}}>요주의</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════ CALENDAR ═══════════════════ */
function CalView({ evs, onSaveEvent, onDeleteEvent, cats, setCats, calDate, setCalDate, calTab, setCalTab }) {
  const [modal, setModal] = useState(false)
  const [edit, setEdit]   = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm]   = useState({ title:'', date:TODAY, endDate:'', cat:'other', note:'' })

  const y = calDate.getFullYear(), m = calDate.getMonth()
  const mStr = `${y}-${String(m+1).padStart(2,'0')}`
  const filtered = evs.filter(e => cats.has(e.cat))

  const monthStats = useMemo(() => {
    const inM = evs.filter(e => e.date.startsWith(mStr))
    const total = inM.length, done = inM.filter(e => e.date < TODAY).length
    return { total, done, pct: total ? (done/total)*100 : 0 }
  }, [evs, mStr])

  const agendaGroups = useMemo(() => {
    const days = {}
    filtered.forEach(ev => {
      const s = toDate(ev.date), e = ev.endDate ? toDate(ev.endDate) : new Date(s)
      let d = new Date(s)
      while (d <= e) {
        const ds = toStr(d)
        if (ds.startsWith(mStr)) { if (!days[ds]) days[ds] = []; if (!days[ds].find(x => x.id === ev.id)) days[ds].push(ev) }
        d.setDate(d.getDate() + 1)
      }
    })
    return Object.entries(days).sort(([a],[b]) => a.localeCompare(b))
  }, [filtered, mStr])

  const openAdd = d => { setForm({ title:'', date:d||TODAY, endDate:'', cat:'other', note:'' }); setEdit(null); setModal(true) }
  const openEdit = ev => { setForm({ ...ev, endDate:ev.endDate||'' }); setEdit(ev); setModal(true) }
  const save = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    await onSaveEvent(form, edit?.id)
    setSaving(false)
    setModal(false)
  }
  const del = async id => {
    setSaving(true)
    await onDeleteEvent(id)
    setSaving(false)
    setModal(false)
  }

  const fd = new Date(y,m,1).getDay()
  const cells = Array.from({length:42}, (_,i) => { const d=new Date(y,m,1-fd+i); return { date:d, str:toStr(d), isCur:d.getMonth()===m } })

  return (
    <div className={`view ${calTab==='agenda'?'show-agenda':'show-cal'}`}>
      <div className="cal-stats">
        <div style={{flex:'0 0 auto',minWidth:110}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end'}}>
            <div className="sl">달성률</div>
            <div className="sv" style={{color:'var(--ac)',fontSize:12}}>{Math.round(monthStats.pct)}%</div>
          </div>
          <div className="pw" style={{width:90}}><div className="pb" style={{width:`${monthStats.pct}%`}}/></div>
        </div>
        <div style={{flex:'0 0 auto'}}><div className="sl">이번 달</div><div className="sv">{monthStats.total}건</div></div>
        <div style={{flex:'0 0 auto'}}><div className="sl">완료</div><div className="sv" style={{color:'var(--grn)'}}>{monthStats.done}건</div></div>
        <div style={{flex:'0 0 auto'}}><div className="sl">예정</div><div className="sv" style={{color:'var(--ac)'}}>{monthStats.total-monthStats.done}건</div></div>
        <div style={{marginLeft:'auto',display:'flex',gap:6,flex:'0 0 auto'}}>
          {['cal','agenda'].map(t => (
            <button key={t} className={`btn btn-sm${calTab===t?' btn-ac':''}`} onClick={() => setCalTab(t)}>
              {t==='cal'?'📅 캘린더':'📋 목록'}
            </button>
          ))}
        </div>
      </div>

      <div className="cal-cat-strip">
        {Object.entries(ECAT).map(([k,v]) => (
          <div key={k} className={`ccs-pill${cats.has(k)?' on':''}`}
            onClick={() => setCats(p => { const n=new Set(p); n.has(k)?n.delete(k):n.add(k); return n })}>
            <div className="ccs-dot" style={{background:v.color}}/>{v.label}
          </div>
        ))}
      </div>

      <div className="cal-body">
        <div className="wd-row">{WD.map(d => <div key={d} className="wd">{d}</div>)}</div>
        <div className="cal-grid">
          {cells.map((cell,i) => {
            const dayEvs = filtered.filter(e => onDate(e, cell.str))
            const isToday = cell.str === TODAY
            return (
              <div key={i} className={`day${!cell.isCur?' dim':''}${isToday?' tc':''}`} onClick={() => openAdd(cell.str)}>
                {isToday
                  ? <span className="dn"><span className="dn-today">{cell.date.getDate()}</span></span>
                  : <span className="dn">{cell.date.getDate()}</span>
                }
                {dayEvs.slice(0,3).map(ev => (
                  <div key={ev.id} className="epill" style={{background:ECAT[ev.cat].bg,color:ECAT[ev.cat].color}}
                    onClick={e => { e.stopPropagation(); openEdit(ev) }}>
                    {ev.title}
                  </div>
                ))}
                {dayEvs.length > 3 && <div className="emore">+{dayEvs.length-3}</div>}
                {dayEvs.length > 0 && (
                  <div className="ev-dots" onClick={e => { e.stopPropagation(); openEdit(dayEvs[0]) }}>
                    {dayEvs.slice(0,5).map(ev => <div key={ev.id} className="ev-dot" style={{background:ECAT[ev.cat].color}}/>)}
                    {dayEvs.length > 5 && <div style={{fontSize:8,color:'var(--tx3)',lineHeight:'6px'}}>+{dayEvs.length-5}</div>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="agenda">
        {agendaGroups.length === 0
          ? <div className="empty-state"><div className="empty-icon">📭</div>이번 달 일정이 없습니다.</div>
          : agendaGroups.map(([ds,dayEvs]) => {
              const d = toDate(ds), isToday = ds === TODAY
              return (
                <div key={ds} className="ag-grp">
                  <div className="ag-hdr">
                    <span className="adate" style={isToday?{color:'var(--ac)'}:{}}>{d.getMonth()+1}월 {d.getDate()}일</span>
                    <span>{WD[d.getDay()]}요일</span>
                    {isToday && <span className="badge" style={{background:'var(--ac)',color:'#000',fontSize:9}}>TODAY</span>}
                  </div>
                  {dayEvs.map(ev => (
                    <div key={ev.id} className="ag-card" onClick={() => openEdit(ev)}>
                      <div className="ag-bar" style={{background:ECAT[ev.cat].color}}/>
                      <div className="ag-info">
                        <div className="ag-title">{ev.title}</div>
                        <div className="ag-meta">{ECAT[ev.cat].icon} {ECAT[ev.cat].label}{ev.note?` · ${ev.note}`:''}</div>
                      </div>
                      <div className="ag-d" style={{background:ECAT[ev.cat].bg,color:ECAT[ev.cat].color}}>{dL(ev.date)}</div>
                    </div>
                  ))}
                </div>
              )
            })
        }
      </div>

      {modal && (
        <div className="ov" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="m-handle"/>
            <div className="m-title">{edit ? '일정 수정' : '새 일정 추가'}</div>
            <div className="fg">
              <label className="fl">일정 제목</label>
              <input className="fi" value={form.title} onChange={e => setForm({...form,title:e.target.value})} placeholder="일정 이름"/>
            </div>
            <div className="two">
              <div className="fg"><label className="fl">시작일</label><input type="date" className="fi" value={form.date} onChange={e => setForm({...form,date:e.target.value})}/></div>
              <div className="fg"><label className="fl">종료일 (선택)</label><input type="date" className="fi" value={form.endDate} onChange={e => setForm({...form,endDate:e.target.value})}/></div>
            </div>
            <div className="fg">
              <label className="fl">카테고리</label>
              <select className="fi" value={form.cat} onChange={e => setForm({...form,cat:e.target.value})}>
                {Object.entries(ECAT).map(([k,v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginTop:-6,marginBottom:14}}>
              <div style={{width:10,height:10,borderRadius:'50%',background:ECAT[form.cat].color}}/>
              <span style={{fontSize:11,color:'var(--tx3)'}}>{ECAT[form.cat].label} 색상으로 표시됩니다</span>
            </div>
            <div className="fg"><label className="fl">메모</label><textarea className="fi" style={{height:64}} value={form.note} onChange={e => setForm({...form,note:e.target.value})}/></div>
            <div className="m-actions">
              {edit && <button className="btn btn-danger" onClick={() => del(edit.id)} disabled={saving}>삭제</button>}
              <button className="btn" style={{marginLeft:'auto'}} onClick={() => setModal(false)}>취소</button>
              <button className="btn btn-ac" onClick={save} disabled={saving}>{saving ? '저장 중...' : '저장'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════ SUPPLIERS ═══════════════════ */
function SupView({ suppliers, onSaveSupplier, onDeleteSupplier }) {
  const [modal, setModal]     = useState(false)
  const [edit, setEdit]       = useState(null)
  const [saving, setSaving]   = useState(false)
  const [search, setSearch]   = useState('')
  const [catFilter, setCatFilter]       = useState('전체')
  const [statusFilter, setStatusFilter] = useState('전체')
  const emptyForm = { name:'',nameKo:'',city:'',country:'CN',cat:'가구',contact:'',wechat:'',phone:'',rating:3,status:'active',note:'' }
  const [form, setForm] = useState(emptyForm)

  const filtered = useMemo(() => suppliers.filter(s => {
    const q = search.toLowerCase()
    return (!q || s.name.toLowerCase().includes(q) || s.nameKo.toLowerCase().includes(q) || s.contact.toLowerCase().includes(q))
      && (catFilter === '전체' || s.cat === catFilter)
      && (statusFilter === '전체' || s.status === statusFilter)
  }), [suppliers, search, catFilter, statusFilter])

  const openAdd  = () => { setForm(emptyForm); setEdit(null); setModal(true) }
  const openEdit = s => { setForm({...s}); setEdit(s); setModal(true) }
  const save = async () => {
    if (!form.nameKo.trim()) return
    setSaving(true)
    await onSaveSupplier({...form, rating:Number(form.rating)}, edit?.id)
    setSaving(false)
    setModal(false)
  }
  const del = async id => {
    setSaving(true)
    await onDeleteSupplier(id)
    setSaving(false)
    setModal(false)
  }

  return (
    <div className="view">
      <div className="sup-view">
        <div className="toolbar">
          <div className="search-wrap">
            <span className="search-ic">🔍</span>
            <input className="search-in" placeholder="공급사 검색..." value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <div className="filter-pills">
            {['전체',...SUP_CATS].map(c => <div key={c} className={`fp${catFilter===c?' on':''}`} onClick={() => setCatFilter(c)}>{c}</div>)}
          </div>
          <div className="filter-pills">
            {['전체','active','inactive','watch'].map(s => (
              <div key={s} className={`fp${statusFilter===s?' on':''}`} onClick={() => setStatusFilter(s)}>
                {s==='전체'?'전체':SUP_STATUS[s]}
              </div>
            ))}
          </div>
          <button className="btn btn-ac" onClick={openAdd}>+ 공급사 추가</button>
        </div>

        {filtered.length === 0
          ? <div className="empty-state"><div className="empty-icon">🏭</div>공급사가 없습니다.</div>
          : <div className="sup-grid">
              {filtered.map(s => (
                <div key={s.id} className="sup-card" onClick={() => openEdit(s)}>
                  <div className="sup-card-top">
                    <div>
                      <div className="sup-name-ko">{s.nameKo}</div>
                      <div className="sup-name-cn">{s.name}</div>
                    </div>
                    <span className="status-badge" style={{background:`${SUP_STATUS_COLOR[s.status]}20`,color:SUP_STATUS_COLOR[s.status]}}>{SUP_STATUS[s.status]}</span>
                  </div>
                  <div className="sup-meta">
                    <div className="sup-meta-row"><span className="sup-meta-ic">📍</span>{s.city}, {s.country}</div>
                    <div className="sup-meta-row"><span className="sup-meta-ic">👤</span>{s.contact}</div>
                    <div className="sup-meta-row"><span className="sup-meta-ic">💬</span>{s.wechat}</div>
                    <div className="sup-meta-row"><span className="sup-meta-ic">📞</span><span style={{fontFamily:'var(--mono)',fontSize:10}}>{s.phone}</span></div>
                  </div>
                  {s.note && <div style={{fontSize:11,color:'var(--tx3)',marginBottom:10,lineHeight:1.5,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{s.note}</div>}
                  <div className="sup-card-footer">
                    <span className="cat-badge">{s.cat}</span>
                    <Stars n={s.rating}/>
                  </div>
                </div>
              ))}
            </div>
        }
      </div>

      {modal && (
        <div className="ov" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="m-handle"/>
            <div className="m-title">{edit ? '공급사 수정' : '공급사 등록'}</div>
            <div className="two">
              <div className="fg"><label className="fl">한국어 이름</label><input className="fi" value={form.nameKo} onChange={e => setForm({...form,nameKo:e.target.value})} placeholder="화메이가구"/></div>
              <div className="fg"><label className="fl">중국어 이름</label><input className="fi" value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="义乌华美家居"/></div>
            </div>
            <div className="three">
              <div className="fg"><label className="fl">도시</label><input className="fi" value={form.city} onChange={e => setForm({...form,city:e.target.value})} placeholder="义乌"/></div>
              <div className="fg"><label className="fl">국가</label><input className="fi" value={form.country} onChange={e => setForm({...form,country:e.target.value})} placeholder="CN"/></div>
              <div className="fg"><label className="fl">카테고리</label><select className="fi" value={form.cat} onChange={e => setForm({...form,cat:e.target.value})}>{SUP_CATS.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            </div>
            <div className="three">
              <div className="fg"><label className="fl">담당자</label><input className="fi" value={form.contact} onChange={e => setForm({...form,contact:e.target.value})} placeholder="李伟"/></div>
              <div className="fg"><label className="fl">WeChat</label><input className="fi" value={form.wechat} onChange={e => setForm({...form,wechat:e.target.value})} placeholder="wechat_id"/></div>
              <div className="fg"><label className="fl">전화</label><input className="fi" value={form.phone} onChange={e => setForm({...form,phone:e.target.value})} placeholder="+86-138-..."/></div>
            </div>
            <div className="two">
              <div className="fg"><label className="fl">평점</label><select className="fi" value={form.rating} onChange={e => setForm({...form,rating:e.target.value})}>{[1,2,3,4,5].map(n => <option key={n} value={n}>{'★'.repeat(n)} ({n}점)</option>)}</select></div>
              <div className="fg"><label className="fl">상태</label><select className="fi" value={form.status} onChange={e => setForm({...form,status:e.target.value})}>{Object.entries(SUP_STATUS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            </div>
            <div className="fg"><label className="fl">메모</label><textarea className="fi" style={{height:72}} value={form.note} onChange={e => setForm({...form,note:e.target.value})}/></div>
            <div className="m-actions">
              {edit && <button className="btn btn-danger" onClick={() => del(edit.id)} disabled={saving}>삭제</button>}
              <button className="btn" style={{marginLeft:'auto'}} onClick={() => setModal(false)}>취소</button>
              <button className="btn btn-ac" onClick={save} disabled={saving}>{saving?'저장 중...':'저장'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════ PO PIPELINE ═══════════════════ */
function POView({ pos, suppliers, onSavePO, onDeletePO, onMovePO }) {
  const [modal, setModal]   = useState(false)
  const [edit, setEdit]     = useState(null)
  const [saving, setSaving] = useState(false)
  const emptyForm = { title:'',supplierId:'',cat:'가구',qty:'',amount:'',currency:'CNY',stage:'RFQ발송',deadline:TODAY,note:'' }
  const [form, setForm]     = useState(emptyForm)
  const [search, setSearch] = useState('')
  const [dragOver, setDragOver] = useState(null)
  const dragId = useRef(null)

  const filteredPos = useMemo(() => {
    const q = search.toLowerCase()
    return pos.filter(p => !q || p.title.toLowerCase().includes(q) || (suppliers.find(s=>s.id===p.supplierId)?.nameKo||'').toLowerCase().includes(q))
  }, [pos, search, suppliers])

  const openAdd  = stage => { setForm({...emptyForm,stage}); setEdit(null); setModal(true) }
  const openEdit = po => { setForm({...po,supplierId:po.supplierId||''}); setEdit(po); setModal(true) }
  const save = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    await onSavePO({...form, supplierId: form.supplierId ? String(form.supplierId) : null}, edit?.id)
    setSaving(false)
    setModal(false)
  }
  const del = async id => {
    setSaving(true)
    await onDeletePO(id)
    setSaving(false)
    setModal(false)
  }
  const move = async (id, stage) => {
    await onMovePO(id, stage)
  }

  const onDragStart = (e, id) => { dragId.current = id; e.dataTransfer.effectAllowed = 'move' }
  const onDrop = (e, stage) => { e.preventDefault(); if (dragId.current) move(dragId.current, stage); dragId.current = null }
  const onDragOver = e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }

  return (
    <div className="view po-view">
      <div className="po-toolbar">
        <div className="search-wrap" style={{maxWidth:240}}>
          <span className="search-ic">🔍</span>
          <input className="search-in" placeholder="발주 검색..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <div style={{marginLeft:'auto',display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          <div style={{fontSize:12,color:'var(--tx3)'}}>
            진행 <span style={{color:'var(--ac)',fontWeight:700,fontFamily:'var(--mono)'}}>{pos.filter(p=>p.stage!=='완료').length}</span>건 / 완료 <span style={{fontWeight:700,fontFamily:'var(--mono)',color:'var(--grn)'}}>{pos.filter(p=>p.stage==='완료').length}</span>건
          </div>
          <button className="btn btn-ac" onClick={() => openAdd('RFQ발송')}>+ 발주 추가</button>
        </div>
      </div>

      <div className="po-board">
        {PO_STAGES.map(stage => {
          const stagePos = filteredPos.filter(p => p.stage === stage)
          return (
            <div key={stage} className={`po-col${dragOver===stage?' drag-over':''}`}
              onDragOver={e => { onDragOver(e); setDragOver(stage) }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => { onDrop(e,stage); setDragOver(null) }}>
              <div className="po-col-hdr">
                <div className="po-col-title">
                  <div className="po-stage-dot" style={{background:PC[stage].color}}/>
                  <span style={{color:PC[stage].color}}>{stage}</span>
                </div>
                <span className="po-count" style={{background:PC[stage].bg,color:PC[stage].color}}>{stagePos.length}</span>
              </div>
              <div className="po-cards">
                {stagePos.map(po => {
                  const sup = suppliers.find(s => s.id === po.supplierId)
                  const urgent = dN(po.deadline) <= 3 && stage !== '완료'
                  return (
                    <div key={po.id} className="po-card" draggable onDragStart={e => onDragStart(e, po.id)} onClick={() => openEdit(po)}>
                      <div className="po-card-title">{po.title}</div>
                      <div className="po-card-meta">
                        {sup && <div className="po-meta-row"><span>🏭</span><span className="po-meta-val">{sup.nameKo}</span></div>}
                        <div className="po-meta-row"><span>📦</span><span className="po-meta-val">{po.qty}</span></div>
                        <div className="po-meta-row"><span>💰</span><span className="po-meta-val">{po.amount}</span></div>
                        <div className="po-meta-row" style={{marginTop:6}}>
                          <span style={{color:'var(--tx3)'}}>마감</span>
                          <span className="po-deadline" style={{color:urgent?'var(--red)':'var(--tx2)'}}>{dL(po.deadline)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {stagePos.length === 0 && <div className="po-empty">드래그하여 이동</div>}
                <button className="po-add-btn" onClick={() => openAdd(stage)}>+ 추가</button>
              </div>
            </div>
          )
        })}
      </div>

      {modal && (
        <div className="ov" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="m-handle"/>
            <div className="m-title">{edit ? '발주 수정' : '발주 등록'}</div>
            <div className="fg"><label className="fl">품목명</label><input className="fi" value={form.title} onChange={e => setForm({...form,title:e.target.value})} placeholder="소파 3인용 샘플"/></div>
            <div className="two">
              <div className="fg">
                <label className="fl">공급사</label>
                <select className="fi" value={form.supplierId} onChange={e => setForm({...form,supplierId:e.target.value})}>
                  <option value="">-- 선택 --</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.nameKo} ({s.name})</option>)}
                </select>
              </div>
              <div className="fg">
                <label className="fl">단계</label>
                <select className="fi" value={form.stage} onChange={e => setForm({...form,stage:e.target.value})}>
                  {PO_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="three">
              <div className="fg"><label className="fl">수량</label><input className="fi" value={form.qty} onChange={e => setForm({...form,qty:e.target.value})} placeholder="10세트"/></div>
              <div className="fg"><label className="fl">금액</label><input className="fi" value={form.amount} onChange={e => setForm({...form,amount:e.target.value})} placeholder="¥12,000"/></div>
              <div className="fg"><label className="fl">마감일</label><input type="date" className="fi" value={form.deadline} onChange={e => setForm({...form,deadline:e.target.value})}/></div>
            </div>
            <div className="fg"><label className="fl">메모</label><textarea className="fi" style={{height:64}} value={form.note} onChange={e => setForm({...form,note:e.target.value})}/></div>
            <div className="m-actions">
              {edit && <button className="btn btn-danger" onClick={() => del(edit.id)} disabled={saving}>삭제</button>}
              {edit && (
                <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                  {PO_STAGES.filter(s=>s!==form.stage).map(s => (
                    <button key={s} className="btn btn-sm" style={{color:PC[s].color,borderColor:PC[s].color,fontSize:10,padding:'4px 8px'}}
                      onClick={() => { move(edit.id,s); setModal(false) }}>→{s}</button>
                  ))}
                </div>
              )}
              <button className="btn" style={{marginLeft:'auto'}} onClick={() => setModal(false)}>취소</button>
              <button className="btn btn-ac" onClick={save} disabled={saving}>{saving?'저장 중...':'저장'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════ SIDEBAR ═══════════════════ */
function SidebarContent({ view, setView, cats, setCats, evs, pos, suppliers, setSbOpen, workspace, onLogout }) {
  const upcoming = useMemo(() =>
    evs.filter(e => e.date >= TODAY).sort((a,b) => a.date.localeCompare(b.date)).slice(0,4)
  ,[evs])

  return (
    <>
      <div className="logo">
        <div className="logo-ic">CB</div>
        <div><div className="logo-txt">COBI</div><div className="logo-sub">Sourcing OS · {workspace}</div></div>
      </div>

      <div className="nav-section">메뉴</div>
      {[
        {id:'dash',icon:'📊',label:'대시보드'},
        {id:'cal', icon:'📅',label:'캘린더'},
        {id:'sup', icon:'🏭',label:'공급사 DB'},
        {id:'po',  icon:'📦',label:'발주현황'},
      ].map(n => (
        <div key={n.id} className={`ni${view===n.id?' on':''}`} onClick={() => { setView(n.id); setSbOpen(false) }}>
          <span className="ni-icon">{n.icon}</span>{n.label}
        </div>
      ))}

      {view === 'cal' && (
        <>
          <div className="nav-divider"/>
          <div className="nav-section">카테고리 필터</div>
          {Object.entries(ECAT).map(([k,v]) => (
            <div key={k} className={`cat-row${cats.has(k)?' on':''}`}
              onClick={() => setCats(p => { const n=new Set(p); n.has(k)?n.delete(k):n.add(k); return n })}>
              <div className="cat-dot" style={{background:v.color}}/>{v.icon} {v.label}
            </div>
          ))}
          <div className="nav-divider"/>
          <div className="nav-section">예정 일정</div>
          {upcoming.map(ev => (
            <div key={ev.id} className="up-card">
              <div style={{fontSize:10,color:'var(--tx3)',marginBottom:2}}>{ev.date}</div>
              <div style={{fontWeight:700,fontSize:12}}>{ECAT[ev.cat].icon} {ev.title}</div>
              <div style={{marginTop:4,fontSize:10,fontWeight:800,color:ECAT[ev.cat].color,fontFamily:'var(--mono)'}}>{dL(ev.date)}</div>
            </div>
          ))}
        </>
      )}

      {view === 'dash' && (
        <>
          <div className="nav-divider"/>
          <div className="nav-section">공급사 현황</div>
          {Object.entries(SUP_STATUS).map(([k,v]) => (
            <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'5px 10px',fontSize:12}}>
              <span style={{color:'var(--tx2)'}}>{v}</span>
              <span style={{fontWeight:700,fontFamily:'var(--mono)',color:SUP_STATUS_COLOR[k]}}>{suppliers.filter(s=>s.status===k).length}</span>
            </div>
          ))}
        </>
      )}

      <div style={{flex:1}}/>
      <div style={{padding:'10px 0',borderTop:'1px solid var(--bd)'}}>
        <div style={{padding:'4px 10px',fontSize:11,color:'var(--tx3)'}}>등록 공급사 {suppliers.length}개 · 발주 {pos.length}건</div>
        <div className="ni" style={{color:'var(--tx3)',fontSize:12,marginTop:4}} onClick={onLogout}>🔓 워크스페이스 변경</div>
      </div>
    </>
  )
}

/* ═══════════════════ APP ═══════════════════ */
export default function App() {
  const [workspace, setWorkspace] = useState(() => localStorage.getItem('cobi_ws') || '')
  const [theme, setTheme]   = useState('dark')
  const [view,  setView]    = useState('dash')
  const [evs,   setEvs]     = useState([])
  const [sup,   setSup]     = useState([])
  const [pos,   setPos]     = useState([])
  const [cats,  setCats]    = useState(new Set(Object.keys(ECAT)))
  const [calDate, setCalDate] = useState(new Date())
  const [calTab, setCalTab] = useState(() => typeof window!=='undefined' && window.innerWidth<=768 ? 'agenda' : 'cal')
  const [sbOpen,  setSbOpen]  = useState(false)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [online,  setOnline]  = useState(navigator.onLine)

  // ── Network status
  useEffect(() => {
    const on  = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online',on); window.removeEventListener('offline',off) }
  }, [])

  // ── Load + realtime when workspace set
  useEffect(() => {
    if (!workspace) return
    loadAll()

    const ch = supabase.channel(`ws-${workspace}`)
      .on('postgres_changes', {event:'*',schema:'public',table:'events'},       () => loadEvs())
      .on('postgres_changes', {event:'*',schema:'public',table:'suppliers'},    () => loadSup())
      .on('postgres_changes', {event:'*',schema:'public',table:'purchase_orders'}, () => loadPos())
      .subscribe()

    return () => supabase.removeChannel(ch)
  }, [workspace])

  const loadEvs = useCallback(async () => {
    const { data } = await supabase.from('events').select('*').eq('workspace_id', workspace).order('date')
    if (data) setEvs(data.map(dbToEv))
  }, [workspace])

  const loadSup = useCallback(async () => {
    const { data } = await supabase.from('suppliers').select('*').eq('workspace_id', workspace).order('name_ko')
    if (data) setSup(data.map(dbToSup))
  }, [workspace])

  const loadPos = useCallback(async () => {
    const { data } = await supabase.from('purchase_orders').select('*').eq('workspace_id', workspace).order('created_at')
    if (data) setPos(data.map(dbToPo))
  }, [workspace])

  const loadAll = async () => {
    setLoading(true)
    await Promise.all([loadEvs(), loadSup(), loadPos()])
    setLoading(false)
    // First run: seed if empty
    const [{ count: ec }, { count: sc }, { count: pc }] = await Promise.all([
      supabase.from('events').select('*',{count:'exact',head:true}).eq('workspace_id',workspace),
      supabase.from('suppliers').select('*',{count:'exact',head:true}).eq('workspace_id',workspace),
      supabase.from('purchase_orders').select('*',{count:'exact',head:true}).eq('workspace_id',workspace),
    ])
    if (ec === 0 && sc === 0 && pc === 0) await seedData()
  }

  const seedData = async () => {
    const { evToDb: e2d, supToDb: s2d, poToDb: p2d } = await import('./supabase')
    await supabase.from('events').insert(SEED_EV.map(e => evToDb(e, workspace)))
    await supabase.from('suppliers').insert(SEED_SUP.map(s => supToDb(s, workspace)))
    await supabase.from('purchase_orders').insert(SEED_PO.map(p => poToDb(p, workspace)))
    await loadAll()
  }

  // ── CRUD: Events
  const saveEvent = async (form, editId) => {
    setSyncing(true)
    const { evToDb: e2d } = await import('./supabase')
    const row = { ...evToDb({...form, id: editId||uid()}, workspace) }
    if (editId) await supabase.from('events').update(row).eq('id', editId)
    else        await supabase.from('events').insert(row)
    await loadEvs()
    setSyncing(false)
  }
  const deleteEvent = async id => {
    setSyncing(true)
    await supabase.from('events').delete().eq('id', id)
    await loadEvs()
    setSyncing(false)
  }

  // ── CRUD: Suppliers
  const saveSupplier = async (form, editId) => {
    setSyncing(true)
    const { supToDb: s2d } = await import('./supabase')
    const row = { ...supToDb({...form, id: editId||uid()}, workspace) }
    if (editId) await supabase.from('suppliers').update(row).eq('id', editId)
    else        await supabase.from('suppliers').insert(row)
    await loadSup()
    setSyncing(false)
  }
  const deleteSupplier = async id => {
    setSyncing(true)
    await supabase.from('suppliers').delete().eq('id', id)
    await loadSup()
    setSyncing(false)
  }

  // ── CRUD: POs
  const savePO = async (form, editId) => {
    setSyncing(true)
    const { poToDb: p2d } = await import('./supabase')
    const row = { ...poToDb({...form, id: editId||uid()}, workspace) }
    if (editId) await supabase.from('purchase_orders').update(row).eq('id', editId)
    else        await supabase.from('purchase_orders').insert(row)
    await loadPos()
    setSyncing(false)
  }
  const deletePO = async id => {
    setSyncing(true)
    await supabase.from('purchase_orders').delete().eq('id', id)
    await loadPos()
    setSyncing(false)
  }
  const movePO = async (id, stage) => {
    setSyncing(true)
    await supabase.from('purchase_orders').update({ stage }).eq('id', id)
    await loadPos()
    setSyncing(false)
  }

  const logout = () => { localStorage.removeItem('cobi_ws'); setWorkspace(''); setEvs([]); setSup([]); setPos([]) }

  const y = calDate.getFullYear(), m = calDate.getMonth()

  if (!workspace) return (
    <div data-theme={theme}>
      <style dangerouslySetInnerHTML={{__html: CSS}}/>
      <WorkspaceGate onEnter={ws => setWorkspace(ws)}/>
    </div>
  )

  if (loading) return (
    <div data-theme={theme}>
      <style dangerouslySetInnerHTML={{__html: CSS}}/>
      <div className="loading-overlay">
        <div className="loading-logo">COBI</div>
        <div className="spinner"/>
        <div className="loading-sub">데이터 동기화 중...</div>
      </div>
    </div>
  )

  return (
    <div className="wrap" data-theme={theme}>
      <style dangerouslySetInnerHTML={{__html: CSS}}/>
      <div className={`bk${sbOpen?' open':''}`} onClick={() => setSbOpen(false)}/>

      <nav className={`nav${sbOpen?' open':''}`}>
        <div className="nav-in">
          <SidebarContent view={view} setView={setView} cats={cats} setCats={setCats}
            evs={evs} pos={pos} suppliers={sup} setSbOpen={setSbOpen}
            workspace={workspace} onLogout={logout}/>
        </div>
      </nav>

      <main className="main">
        <header className="app-hdr">
          <div className="app-hdr-l">
            <div className="ic-btn hbg" style={{display:'flex'}} onClick={() => setSbOpen(o => !o)}>☰</div>
            <h1 className="page-title">
              {view==='cal'
                ? <>{y}년 <span>{MO[m]}</span></>
                : <><span>COBI</span> {view==='dash'?'대시보드':view==='sup'?'공급사 DB':'발주현황'}</>}
            </h1>
            {view==='cal' && (
              <div style={{display:'flex',gap:5}}>
                <button className="btn btn-sm" onClick={() => setCalDate(new Date(y,m-1,1))}>‹</button>
                <button className="btn btn-sm" onClick={() => setCalDate(new Date())}>오늘</button>
                <button className="btn btn-sm" onClick={() => setCalDate(new Date(y,m+1,1))}>›</button>
              </div>
            )}
          </div>
          <div className="app-hdr-r">
            {/* Sync status dot */}
            <div title={syncing?'동기화 중':online?'동기화됨':'오프라인'}
              className={`sync-dot${syncing?' syncing':!online?' offline':''}`}/>
            <div className="ic-btn" onClick={() => setTheme(t => t==='light'?'dark':'light')}>
              {theme==='light'?'🌙':'☀️'}
            </div>
          </div>
        </header>

        {view==='dash' && <div className="view"><Dashboard evs={evs} pos={pos} suppliers={sup} setView={setView}/></div>}
        {view==='cal'  && <CalView evs={evs} onSaveEvent={saveEvent} onDeleteEvent={deleteEvent} cats={cats} setCats={setCats} calDate={calDate} setCalDate={setCalDate} calTab={calTab} setCalTab={setCalTab}/>}
        {view==='sup'  && <SupView suppliers={sup} onSaveSupplier={saveSupplier} onDeleteSupplier={deleteSupplier}/>}
        {view==='po'   && <POView pos={pos} suppliers={sup} onSavePO={savePO} onDeletePO={deletePO} onMovePO={movePO}/>}

        <nav className="bnav">
          {[
            {id:'dash',icon:'📊',label:'대시보드'},
            {id:'cal', icon:'📅',label:'캘린더'},
            {id:'sup', icon:'🏭',label:'공급사'},
            {id:'po',  icon:'📦',label:'발주'},
            {id:'__menu',icon:'☰',label:'메뉴'},
          ].map(n => (
            <div key={n.id} className={`bi${view===n.id?' on':''}`}
              onClick={() => n.id==='__menu' ? setSbOpen(true) : setView(n.id)}>
              <span className="bi-ic">{n.icon}</span>
              <span className="bi-lb" style={view===n.id?{color:'var(--ac)'}:{}}>{n.label}</span>
            </div>
          ))}
        </nav>
      </main>
    </div>
  )
}
