import { useState } from 'react';
import { useScene } from '@/store/SceneContext';
import { stageStore } from '@/lib/stageRef';
import { jsPDF } from 'jspdf';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Download, Image, FileText, Check } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { toast } from 'sonner';

type ExportFormat = 'png' | 'pdf-report';
type PNGScale = 1 | 2 | 3 | 4;

export default function ExportDialog() {
  const { caseInfo, evidence, objects, walls, measurements } = useScene();
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('pdf-report');
  const [pngScale, setPngScale] = useState<PNGScale>(2);
  const [exporting, setExporting] = useState(false);

  const caseLabel = caseInfo.caseNumber || 'scene';

  const addWatermark = (dataURL: string, width: number, height: number): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);

        // Diagonal watermark pattern
        ctx.save();
        const fontSize = Math.max(24, Math.min(width, height) * 0.06);
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillStyle = 'rgba(150, 150, 150, 0.18)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const text = 'IICSF';
        const gap = fontSize * 5;
        ctx.translate(width / 2, height / 2);
        ctx.rotate(-Math.PI / 6);
        for (let y = -height; y < height * 2; y += gap) {
          for (let x = -width; x < width * 2; x += gap) {
            ctx.fillText(text, x - width / 2, y - height / 2);
          }
        }
        ctx.restore();

        // Bottom-right badge
        const badgeFontSize = Math.max(12, fontSize * 0.5);
        ctx.font = `bold ${badgeFontSize}px sans-serif`;
        ctx.fillStyle = 'rgba(100, 100, 100, 0.35)';
        ctx.textAlign = 'right';
        ctx.fillText('IICSF Certified', width - 15, height - 15);

        resolve(canvas.toDataURL('image/png'));
      };
      img.src = dataURL;
    });
  };

  const getStageDataURL = (pixelRatio: number): string | null => {
    const stage = stageStore.current;
    if (!stage) return null;
    return stage.toDataURL({ pixelRatio, mimeType: 'image/png' });
  };

  const handleExportPNG = () => {
    setExporting(true);
    setTimeout(async () => {
      try {
        const dataURL = getStageDataURL(pngScale);
        if (!dataURL) { toast.error('Canvas not ready'); return; }
        const stage = stageStore.current!;
        const w = stage.width() * pngScale;
        const h = stage.height() * pngScale;
        const watermarked = await addWatermark(dataURL, w, h);
        const link = document.createElement('a');
        link.download = `crime-scene-${caseLabel}.png`;
        link.href = watermarked;
        link.click();
        toast.success(`Exported PNG at ${pngScale}x resolution`);
        setOpen(false);
      } finally {
        setExporting(false);
      }
    }, 100);
  };

  const handleExportPDFReport = () => {
    setExporting(true);
    setTimeout(() => {
      try {
        const dataURL = getStageDataURL(3);
        if (!dataURL) { toast.error('Canvas not ready'); return; }
        const stage = stageStore.current!;
        const stageW = stage.width();
        const stageH = stage.height();

        const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const margin = 40;
        const contentW = pageW - margin * 2;
        let y = margin;

        // ── Header ──
        pdf.setFillColor(15, 23, 42);
        pdf.rect(0, 0, pageW, 80, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        pdf.text('CRIME SCENE REPORT', margin, 35);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(148, 163, 184);
        pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, 55);
        if (caseInfo.caseNumber) {
          pdf.setTextColor(250, 204, 21);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`CASE #${caseInfo.caseNumber}`, pageW - margin, 35, { align: 'right' });
        }
        y = 100;

        // ── Case Information ──
        pdf.setTextColor(15, 23, 42);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('CASE INFORMATION', margin, y);
        y += 5;
        pdf.setDrawColor(59, 130, 246);
        pdf.setLineWidth(2);
        pdf.line(margin, y, margin + 120, y);
        y += 15;

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(71, 85, 105);

        const infoFields = [
          ['Case Number', caseInfo.caseNumber || '—'],
          ['Investigator', caseInfo.investigator || '—'],
          ['Location', caseInfo.location || '—'],
          ['Date / Time', caseInfo.dateTime ? new Date(caseInfo.dateTime).toLocaleString() : '—'],
          ['Scene Type', caseInfo.sceneType.toUpperCase()],
          ['Incident Type', caseInfo.incident || '—'],
          ['Sketch By', caseInfo.sketchBy || '—'],
        ];

        const colW = contentW / 2;
        infoFields.forEach((field, i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const fx = margin + col * colW;
          const fy = y + row * 18;
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(100, 116, 139);
          pdf.text(`${field[0]}:`, fx, fy);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(15, 23, 42);
          pdf.text(field[1], fx + 80, fy);
        });
        y += Math.ceil(infoFields.length / 2) * 18 + 10;

        // ── Scene Statistics ──
        pdf.setFillColor(241, 245, 249);
        pdf.roundedRect(margin, y, contentW, 30, 4, 4, 'F');
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(71, 85, 105);
        const stats = [
          `Objects: ${objects.length}`,
          `Evidence: ${evidence.length}`,
          `Walls: ${walls.length}`,
          `Measurements: ${measurements.length}`,
        ];
        stats.forEach((s, i) => {
          pdf.text(s, margin + 15 + i * (contentW / stats.length), y + 18);
        });
        y += 45;

        // ── Scene Sketch ──
        pdf.setTextColor(15, 23, 42);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('SCENE SKETCH', margin, y);
        y += 5;
        pdf.setDrawColor(59, 130, 246);
        pdf.line(margin, y, margin + 90, y);
        y += 10;

        const imgMaxW = contentW;
        const imgMaxH = pageH - y - margin - 20;
        const aspect = stageW / stageH;
        let imgW = imgMaxW;
        let imgH = imgW / aspect;
        if (imgH > imgMaxH) {
          imgH = imgMaxH;
          imgW = imgH * aspect;
        }
        const imgX = margin + (contentW - imgW) / 2;

        pdf.setDrawColor(203, 213, 225);
        pdf.setLineWidth(0.5);
        pdf.rect(imgX - 1, y - 1, imgW + 2, imgH + 2);
        pdf.addImage(dataURL, 'PNG', imgX, y, imgW, imgH);
        y += imgH + 10;

        pdf.setFontSize(7);
        pdf.setTextColor(148, 163, 184);
        pdf.text(`Scale: Not to scale  |  Canvas: ${stageW}×${stageH}px`, margin, y);

        // ── Evidence Log (new page) ──
        if (evidence.length > 0) {
          pdf.addPage();
          y = margin;

          pdf.setFillColor(15, 23, 42);
          pdf.rect(0, 0, pageW, 50, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'bold');
          pdf.text('EVIDENCE LOG', margin, 32);
          if (caseInfo.caseNumber) {
            pdf.setFontSize(9);
            pdf.setTextColor(148, 163, 184);
            pdf.text(`Case #${caseInfo.caseNumber}`, pageW - margin, 32, { align: 'right' });
          }
          y = 70;

          // Table header
          const cols = [
            { label: 'ID', x: margin, w: 30 },
            { label: 'Description', x: margin + 30, w: 130 },
            { label: 'Category', x: margin + 160, w: 65 },
            { label: 'Priority', x: margin + 225, w: 50 },
            { label: 'Status', x: margin + 275, w: 65 },
            { label: 'Location', x: margin + 340, w: 70 },
            { label: 'Time', x: margin + 410, w: 60 },
            { label: 'Collected By', x: margin + 470, w: 62 },
          ];

          pdf.setFillColor(241, 245, 249);
          pdf.rect(margin, y, contentW, 18, 'F');
          pdf.setFontSize(7);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(71, 85, 105);
          cols.forEach(col => pdf.text(col.label.toUpperCase(), col.x + 3, y + 12));
          y += 18;

          evidence.forEach((ev, i) => {
            if (y > pageH - 60) {
              pdf.addPage();
              y = margin;
              pdf.setFillColor(241, 245, 249);
              pdf.rect(margin, y, contentW, 18, 'F');
              pdf.setFontSize(7);
              pdf.setFont('helvetica', 'bold');
              pdf.setTextColor(71, 85, 105);
              cols.forEach(col => pdf.text(col.label.toUpperCase(), col.x + 3, y + 12));
              y += 18;
            }

            if (i % 2 === 0) {
              pdf.setFillColor(248, 250, 252);
              pdf.rect(margin, y, contentW, 16, 'F');
            }

            pdf.setFontSize(7);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(30, 41, 59);

            const priorityColors: Record<string, [number, number, number]> = {
              critical: [220, 38, 38],
              high: [249, 115, 22],
              medium: [234, 179, 8],
              low: [34, 197, 94],
            };
            const statusLabels: Record<string, string> = {
              'identified': 'Identified',
              'photographed': 'Photographed',
              'collected': 'Collected',
              'processed': 'Processed',
              'sent-to-lab': 'Sent to Lab',
            };

            // Letter
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(234, 179, 8);
            pdf.text(ev.letter, cols[0].x + 3, y + 11);

            // Description
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(30, 41, 59);
            pdf.text(ev.description.substring(0, 30), cols[1].x + 3, y + 11);

            // Category
            pdf.setTextColor(100, 116, 139);
            pdf.text(ev.category, cols[2].x + 3, y + 11);

            // Priority with color
            const pc = priorityColors[ev.priority] || [100, 116, 139];
            pdf.setTextColor(pc[0], pc[1], pc[2]);
            pdf.setFont('helvetica', 'bold');
            pdf.text(ev.priority.toUpperCase(), cols[3].x + 3, y + 11);

            // Status
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(71, 85, 105);
            pdf.text(statusLabels[ev.status] || ev.status, cols[4].x + 3, y + 11);

            // Location
            pdf.setTextColor(100, 116, 139);
            pdf.text(ev.location || '—', cols[5].x + 3, y + 11);

            // Time
            pdf.text(ev.timeLogged || '—', cols[6].x + 3, y + 11);

            // Collected By
            pdf.text(ev.collectedBy || '—', cols[7].x + 3, y + 11);

            // Notes row
            if (ev.notes) {
              y += 16;
              if (y > pageH - 40) { pdf.addPage(); y = margin; }
              pdf.setFontSize(6.5);
              pdf.setTextColor(148, 163, 184);
              pdf.text(`  Notes: ${ev.notes.substring(0, 80)}`, cols[0].x + 3, y + 8);
            }

            y += 16;
          });
        }

        // ── Footer on all pages ──
        const totalPages = pdf.getNumberOfPages();
        for (let p = 1; p <= totalPages; p++) {
          pdf.setPage(p);
          pdf.setFontSize(7);
          pdf.setTextColor(148, 163, 184);
          pdf.setFont('helvetica', 'normal');
          pdf.line(margin, pageH - 30, pageW - margin, pageH - 30);
          pdf.text('CONFIDENTIAL — Crime Scene Sketcher Report', margin, pageH - 20);
          pdf.text(`Page ${p} of ${totalPages}`, pageW - margin, pageH - 20, { align: 'right' });
        }

        pdf.save(`crime-scene-report-${caseLabel}.pdf`);
        toast.success('PDF report exported successfully');
        setOpen(false);
      } finally {
        setExporting(false);
      }
    }, 100);
  };

  const handleExport = () => {
    if (format === 'png') handleExportPNG();
    else handleExportPDFReport();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <button className="h-7 px-2.5 flex items-center gap-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors text-xs font-medium border border-border">
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">Export scene</TooltipContent>
      </Tooltip>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Export Scene</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Format selection */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setFormat('png')}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                format === 'png'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/30'
              }`}
            >
              {format === 'png' && (
                <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-2.5 w-2.5 text-primary-foreground" />
                </div>
              )}
              <Image className="h-8 w-8 text-primary" />
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">PNG Image</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">High-res screenshot</p>
              </div>
            </button>
            <button
              onClick={() => setFormat('pdf-report')}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                format === 'pdf-report'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/30'
              }`}
            >
              {format === 'pdf-report' && (
                <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-2.5 w-2.5 text-primary-foreground" />
                </div>
              )}
              <FileText className="h-8 w-8 text-primary" />
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">PDF Report</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Full case report</p>
              </div>
            </button>
          </div>

          {/* PNG options */}
          {format === 'png' && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Resolution</label>
              <div className="grid grid-cols-4 gap-2">
                {([1, 2, 3, 4] as PNGScale[]).map(scale => (
                  <button
                    key={scale}
                    onClick={() => setPngScale(scale)}
                    className={`py-2 rounded-md text-xs font-mono transition-colors ${
                      pngScale === scale
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {scale}x
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">
                {pngScale}x = ~{Math.round((stageStore.current?.width() || 1200) * pngScale)} × {Math.round((stageStore.current?.height() || 800) * pngScale)}px
              </p>
            </div>
          )}

          {/* PDF report info */}
          {format === 'pdf-report' && (
            <div className="bg-secondary/50 rounded-lg p-3 space-y-1.5">
              <p className="text-xs font-medium text-foreground">Report includes:</p>
              <ul className="text-[11px] text-muted-foreground space-y-1">
                <li className="flex items-center gap-2"><Check className="h-3 w-3 text-primary" /> Case information header</li>
                <li className="flex items-center gap-2"><Check className="h-3 w-3 text-primary" /> Scene statistics summary</li>
                <li className="flex items-center gap-2"><Check className="h-3 w-3 text-primary" /> High-resolution scene sketch (3x)</li>
                <li className="flex items-center gap-2"><Check className="h-3 w-3 text-primary" /> Evidence log table{evidence.length > 0 ? ` (${evidence.length} items)` : ''}</li>
                <li className="flex items-center gap-2"><Check className="h-3 w-3 text-primary" /> Page numbers & confidentiality footer</li>
              </ul>
            </div>
          )}

          {/* Export button */}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {exporting ? (
              <>
                <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export {format === 'png' ? 'PNG' : 'PDF Report'}
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
