export function reportFilename(kind, date = new Date()) {
  const day = date.toISOString().slice(0, 10);
  return kind === 'solicitor'
    ? `給香港律師看的遺產意願資料-${day}.pdf`
    : `我的心願地圖-${day}.pdf`;
}

export async function downloadReportPdf(root, filename) {
  if (!globalThis.html2pdf) {
    root.dataset.printTarget = 'true';
    try {
      globalThis.print();
    } finally {
      delete root.dataset.printTarget;
    }
    return { fallback: true };
  }

  const options = {
    margin: [10, 10, 12, 10],
    filename,
    image: { type: 'jpeg', quality: 0.96 },
    html2canvas: { scale: 2, useCORS: false, backgroundColor: '#ffffff' },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['css', 'legacy'] }
  };
  await globalThis.html2pdf().set(options).from(root).save();
  return { fallback: false };
}
