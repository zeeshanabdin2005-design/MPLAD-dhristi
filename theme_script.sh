#!/bin/bash
find src -name "*.tsx" -type f | xargs sed -i \
  -e 's/bg-\[#0f172a\]/bg-slate-50/g' \
  -e 's/bg-\[#0B1120\]/bg-white/g' \
  -e 's/bg-slate-900/bg-white/g' \
  -e 's/bg-slate-950/bg-slate-50/g' \
  -e 's/bg-slate-800\/30/bg-slate-100\/50/g' \
  -e 's/bg-slate-800\/40/bg-slate-100\/50/g' \
  -e 's/bg-slate-800\/50/bg-slate-100/g' \
  -e 's/bg-slate-800/bg-slate-100/g' \
  -e 's/text-white/text-slate-900/g' \
  -e 's/text-slate-200/text-slate-800/g' \
  -e 's/text-slate-300/text-slate-700/g' \
  -e 's/text-slate-400/text-slate-500/g' \
  -e 's/text-slate-500/text-slate-400/g' \
  -e 's/border-slate-800\/50/border-slate-200/g' \
  -e 's/border-slate-800/border-slate-200/g' \
  -e 's/border-slate-700/border-slate-300/g' \
  -e 's/hover:bg-slate-800\/50/hover:bg-slate-100/g' \
  -e 's/hover:bg-slate-800/hover:bg-slate-100/g' \
  -e 's/hover:bg-slate-700/hover:bg-slate-200/g' \
  -e 's/bg-slate-700/bg-slate-200/g' \
  -e 's/bg-red-950\/20/bg-red-50/g' \
  -e 's/bg-red-950\/10/bg-red-50\/50/g' \
  -e 's/bg-red-950\/40/bg-red-50/g' \
  -e 's/border-red-900\/50/border-red-200/g' \
  -e 's/border-red-900\/30/border-red-200/g' \
  -e 's/fill="#1e293b"/fill="#f1f5f9"/g'

