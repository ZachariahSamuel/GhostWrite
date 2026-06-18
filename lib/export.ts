// Download a DOCX file via the export API
export async function exportDocx(content: string, title: string, meta: Record<string,any> = {}) {
  const res = await fetch('/api/export', {
    method:  'POST',
    headers: { 'Content-Type':'application/json' },
    body:    JSON.stringify({ content, title, format:'docx', meta }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).error || 'Export failed')
  }
  const blob     = await res.blob()
  const url      = URL.createObjectURL(blob)
  const safeName = title.replace(/[^a-z0-9]/gi,'_').slice(0,40).toLowerCase()
  const a        = document.createElement('a')
  a.href         = url
  a.download     = `${safeName}.docx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Generate PDF client-side using jsPDF (loaded via CDN)
export async function exportPdf(content: string, title: string, meta: Record<string,any> = {}) {
  // Fetch structured data from API
  const res = await fetch('/api/export', {
    method:  'POST',
    headers: { 'Content-Type':'application/json' },
    body:    JSON.stringify({ content, title, format:'pdf-data', meta }),
  })
  if (!res.ok) throw new Error('Export failed')
  const data = await res.json()

  // Load jsPDF from CDN if not already loaded
  if (!(window as any).jsPDF) {
    await new Promise<void>((resolve, reject) => {
      const s  = document.createElement('script')
      s.src    = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
      s.onload = () => resolve()
      s.onerror= () => reject(new Error('Failed to load jsPDF'))
      document.head.appendChild(s)
    })
  }

  const { jsPDF } = (window as any).jsPDF || (window as any).window.jsPDF
  const doc       = new jsPDF({ unit:'mm', format:'a4' })
  const pageW     = doc.internal.pageSize.getWidth()
  const pageH     = doc.internal.pageSize.getHeight()
  const margin    = 20
  const maxW      = pageW - margin * 2
  let   y         = margin

  const addPage = () => {
    doc.addPage()
    y = margin
  }

  const checkPage = (needed: number) => {
    if (y + needed > pageH - margin) addPage()
  }

  // Header line
  doc.setFontSize(8); doc.setTextColor(124,92,252)
  doc.text('GhostWrite', margin, 10)
  doc.setTextColor(150,150,150)
  doc.text(`  |  ${data.title.slice(0,60)}`, margin+22, 10)
  doc.setDrawColor(124,92,252); doc.setLineWidth(0.3)
  doc.line(margin, 12, pageW-margin, 12)

  // Title
  doc.setFontSize(20); doc.setTextColor(26,26,46); doc.setFont(undefined,'bold')
  checkPage(15)
  doc.text(data.title.slice(0,70), margin, y)
  y += 10

  // Meta line
  doc.setFontSize(9); doc.setTextColor(140,140,140); doc.setFont(undefined,'italic')
  const algoLabel = meta.algo==='hyp'?'Hyper ⚡':meta.algo==='pro'?'Pro':'Standard'
  doc.text(`GhostWrite ${algoLabel}  ·  ${data.date}`, margin, y)
  y += 6
  doc.setDrawColor(220,220,220); doc.line(margin, y, pageW-margin, y)
  y += 8

  // Body paragraphs
  doc.setFont(undefined,'normal'); doc.setTextColor(46,46,46); doc.setFontSize(11)
  for (const para of data.paragraphs) {
    const lines = doc.splitTextToSize(para, maxW) as string[]
    checkPage(lines.length * 6 + 4)
    doc.text(lines, margin, y)
    y += lines.length * 6 + 4
  }

  // Footer on each page
  const pageCount = (doc.internal as any).getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8); doc.setTextColor(150,150,150)
    doc.setDrawColor(124,92,252); doc.setLineWidth(0.3)
    doc.line(margin, pageH-12, pageW-margin, pageH-12)
    doc.text('GhostWrite  —  Invisible craft. Visible results.', margin, pageH-7)
    doc.text(`Page ${i} of ${pageCount}`, pageW-margin, pageH-7, { align:'right' })
  }

  const safeName = data.title.replace(/[^a-z0-9]/gi,'_').slice(0,40).toLowerCase()
  doc.save(`${safeName}.pdf`)
}
