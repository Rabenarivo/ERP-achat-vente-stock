import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "MGA",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const generateFacturePdf = (facture, entrepriseName = "Entreprise") => {
  if (!facture) {
    throw new Error("Facture introuvable pour l'export PDF.");
  }

  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const primary = [22, 74, 108];
  const accent = [18, 183, 206];
  const accent2 = [245, 158, 11];
  const text = [33, 37, 41];
  const light = [248, 250, 252];
  const soft = [235, 244, 248];

  doc.setFillColor(...primary);
  doc.rect(0, 0, pageWidth, 38, "F");
  doc.setFillColor(...accent);
  doc.circle(pageWidth - 18, 19, 10, "F");
  doc.setFillColor(...accent2);
  doc.circle(pageWidth - 32, 12, 4, "F");
  doc.circle(pageWidth - 40, 26, 3, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("FACTURE", 14, 16);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Export genere automatiquement le ${formatDateTime(new Date())}`, 14, 24);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(entrepriseName, pageWidth - 14, 14, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Document comptable professionnel", pageWidth - 14, 20, { align: "right" });

  doc.setTextColor(...text);

  const topY = 48;
  const boxWidth = (pageWidth - 42) / 2;

  const drawTag = (x, y, label, value) => {
    doc.setFillColor(...soft);
    doc.roundedRect(x, y, 26, 10, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...primary);
    doc.text(label, x + 13, y + 4, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...text);
    doc.text(value, x + 13, y + 8, { align: "center" });
  };

  const drawInfoBox = (x, y, title, lines) => {
    doc.setDrawColor(220, 226, 232);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, boxWidth, 38, 4, 4, "FD");
    doc.setFillColor(...soft);
    doc.roundedRect(x + 1.5, y + 1.5, boxWidth - 3, 8, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...primary);
    doc.text(title, x + 4, y + 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...text);
    lines.forEach((line, index) => {
      doc.text(line, x + 4, y + 14 + index * 5);
    });
  };

  drawInfoBox(14, topY, "Informations facture", [
    `Reference: ${facture.reference || "-"}`,
    `Statut: ${facture.statut || "-"}`,
    `Date facture: ${formatDateTime(facture.dateFacture)}`,
  ]);

  drawInfoBox(14 + boxWidth + 14, topY, "Client & livraison", [
    `Client: ${facture.client?.nom || "-"}`,
    `Livraison: ${facture.livraison?.reference || facture.livraison?.id || "-"}`,
    `Echeance: ${formatDate(facture.dateEcheance)}`,
  ]);

  drawTag(14, 87, "REF", String(facture.reference || "-").slice(0, 18));
  drawTag(43, 87, "TTC", String(formatCurrency(facture.montantTtc)));
  drawTag(99, 87, "STATUT", String(facture.statut || "-").slice(0, 18));

  autoTable(doc, {
    startY: 100,
    head: [["Designation", "Reference", "Quantite", "PU", "Total"]],
    body: [[
      `Livraison ${facture.livraison?.reference || facture.livraison?.id || "-"}`,
      facture.reference || "-",
      "1",
      formatCurrency(facture.montantHt),
      formatCurrency(facture.montantTtc),
    ]],
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 10,
      cellPadding: 3,
      textColor: text,
      lineColor: [220, 226, 232],
    },
    headStyles: {
      fillColor: primary,
      textColor: 255,
      halign: "center",
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 72 },
      1: { cellWidth: 38 },
      2: { halign: "center" },
      3: { halign: "right" },
      4: { halign: "right" },
    },
    margin: { left: 14, right: 14 },
  });

  const totalY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 10 : 122;
  doc.setFillColor(...light);
  doc.roundedRect(112, totalY, 84, 38, 5, 5, "F");
  doc.setDrawColor(220, 226, 232);
  doc.roundedRect(112, totalY, 84, 38, 5, 5, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...primary);
  doc.text("Synthese montant", 118, totalY + 9);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...text);
  doc.text(`HT: ${formatCurrency(facture.montantHt)}`, 118, totalY + 17);
  doc.text(`TVA: ${formatCurrency(facture.tva)}`, 118, totalY + 23);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primary);
  doc.text(`TTC: ${formatCurrency(facture.montantTtc)}`, 118, totalY + 31);

  doc.setFillColor(...accent);
  doc.roundedRect(147, totalY + 11, 35, 14, 4, 4, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text("FACTURE", 164.5, totalY + 17, { align: "center" });

  doc.setTextColor(90, 96, 105);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.text(`Client: ${facture.client?.nom || "-"}`, 14, totalY + 18);
  doc.text(`Livraison: ${facture.livraison?.reference || facture.livraison?.id || "-"}`, 14, totalY + 24);

  doc.setDrawColor(...accent);
  doc.setLineWidth(0.4);
  doc.line(14, pageHeight - 24, pageWidth - 14, pageHeight - 24);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(90, 96, 105);
  doc.text(
    "CRM ERP - Facture exportee automatiquement depuis le workflow livraison -> facture",
    pageWidth / 2,
    pageHeight - 16,
    { align: "center" }
  );

  const safeName = String(facture.reference || `facture-${facture.id || "export"}`)
    .replace(/[^a-z0-9\-_.]+/gi, "_")
    .toLowerCase();
  doc.save(`${safeName}.pdf`);
};
