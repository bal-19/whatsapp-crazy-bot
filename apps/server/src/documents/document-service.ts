import { z } from "zod";
import {
    Document,
    HeadingLevel,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
} from "docx";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import type { DocumentKind } from "../ai/reply-types.js";

export const DOCUMENT_MIME_TYPES: Record<DocumentKind, string> = {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

const tableSchema = z.object({
    headers: z.array(z.string()).min(1),
    rows: z.array(z.array(z.union([z.string(), z.number(), z.boolean(), z.null()]))),
});

const sectionSchema = z.object({
    heading: z.string().optional(),
    paragraphs: z.array(z.string()).default([]),
    bullets: z.array(z.string()).default([]),
    table: tableSchema.optional(),
});

const pdfPlanSchema = z.object({
    kind: z.literal("pdf"),
    title: z.string().min(1),
    fileName: z.string().optional(),
    sections: z.array(sectionSchema).min(1),
    footerText: z.string().optional(),
});

const docxPlanSchema = z.object({
    kind: z.literal("docx"),
    title: z.string().min(1),
    fileName: z.string().optional(),
    sections: z.array(sectionSchema).min(1),
});

const xlsxPlanSchema = z.object({
    kind: z.literal("xlsx"),
    fileName: z.string().optional(),
    workbook: z.object({ title: z.string().min(1) }),
    sheets: z.array(z.object({
        name: z.string().min(1),
        headers: z.array(z.string()).default([]),
        rows: z.array(z.array(z.union([z.string(), z.number(), z.boolean(), z.null()]))),
    })).min(1),
});

export const documentPlanSchema = z.discriminatedUnion("kind", [
    pdfPlanSchema,
    docxPlanSchema,
    xlsxPlanSchema,
]);

export type DocumentPlan = z.infer<typeof documentPlanSchema>;

export interface DocumentIntent {
    requested: boolean;
    kind?: DocumentKind;
    multipleFormats: boolean;
}

export interface RenderedDocument {
    buffer: Buffer;
    fileName: string;
    mimeType: string;
    kind: DocumentKind;
}

export function detectDocumentIntent(message: string): DocumentIntent {
    const lower = message.toLowerCase();
    const explicit = new Set<DocumentKind>();
    if (/\b(pdf)\b/.test(lower)) explicit.add("pdf");
    if (/\b(docx|word)\b/.test(lower)) explicit.add("docx");
    if (/\b(xlsx|excel|spreadsheet)\b/.test(lower)) explicit.add("xlsx");

    const action = /\b(buat|buatkan|bikin|generate|export|jadikan|ubah|convert|susun)\b/.test(lower);
    const documentNoun = /\b(file|dokumen|document|laporan|proposal|surat|notulen|invoice|rekap|tabel|brosur)\b/.test(lower);
    const requested = explicit.size > 0 ? action || documentNoun : action && documentNoun;

    if (!requested) return { requested: false, multipleFormats: false };
    if (explicit.size > 1) return { requested: true, multipleFormats: true };
    if (explicit.size === 1) {
        return { requested: true, kind: [...explicit][0], multipleFormats: false };
    }

    return {
        requested: true,
        kind: inferDocumentKind(lower),
        multipleFormats: false,
    };
}

function inferDocumentKind(lower: string): DocumentKind {
    if (/\b(tabel|data|angka|rekap|keuangan|budget|daftar|inventaris)\b/.test(lower)) return "xlsx";
    if (/\b(brosur|siap print|cetak|visual|poster|ringkasan)\b/.test(lower)) return "pdf";
    return "docx";
}

export function buildDocumentPlannerPrompt(input: {
    systemPrompt: string;
    message: string;
    kind: DocumentKind;
}): string {
    return [
        input.systemPrompt,
        "Tugas: buat rancangan tepat satu file dokumen berdasarkan instruksi user.",
        `Format wajib: ${input.kind}. Jangan menghasilkan format lain.`,
        "Balas HANYA JSON valid tanpa markdown fence.",
        getSchemaInstruction(input.kind),
        "Konten harus lengkap, menggunakan bahasa user, dan siap dirender.",
        `Instruksi user: ${input.message}`,
    ].join("\n\n");
}

function getSchemaInstruction(kind: DocumentKind): string {
    if (kind === "pdf") {
        return 'Schema: {"kind":"pdf","title":"...","fileName":"...","sections":[{"heading":"opsional","paragraphs":["..."],"bullets":["..."],"table":{"headers":["..."],"rows":[["..."]]}}],"footerText":"opsional"}';
    }
    if (kind === "docx") {
        return 'Schema: {"kind":"docx","title":"...","fileName":"...","sections":[{"heading":"opsional","paragraphs":["..."],"bullets":["..."],"table":{"headers":["..."],"rows":[["..."]]}}]}';
    }
    return 'Schema: {"kind":"xlsx","fileName":"...","workbook":{"title":"..."},"sheets":[{"name":"...","headers":["..."],"rows":[["..."]]}]}';
}

export function parseDocumentPlan(raw: string, expectedKind: DocumentKind): DocumentPlan {
    const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    const parsed = documentPlanSchema.parse(JSON.parse(cleaned));
    if (parsed.kind !== expectedKind) {
        throw new Error("DOCUMENT_PLAN_FORMAT_MISMATCH");
    }
    return parsed;
}

export async function renderDocument(plan: DocumentPlan): Promise<RenderedDocument> {
    const fileName = sanitizeFileName(plan.fileName, plan.kind);
    if (plan.kind === "docx") {
        return { buffer: await renderDocx(plan), fileName, kind: plan.kind, mimeType: DOCUMENT_MIME_TYPES.docx };
    }
    if (plan.kind === "xlsx") {
        return { buffer: await renderXlsx(plan), fileName, kind: plan.kind, mimeType: DOCUMENT_MIME_TYPES.xlsx };
    }
    return { buffer: await renderPdf(plan), fileName, kind: plan.kind, mimeType: DOCUMENT_MIME_TYPES.pdf };
}

export function sanitizeFileName(value: string | undefined, kind: DocumentKind): string {
    const base = (value ?? "generated-document")
        .replace(/\.[^.]+$/, "")
        .normalize("NFKD")
        .replace(/[^\w.-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^[-_.]+|[-_.]+$/g, "")
        .slice(0, 80);
    return `${base || "generated-document"}.${kind}`;
}

async function renderDocx(plan: z.infer<typeof docxPlanSchema>): Promise<Buffer> {
    const children: Array<Paragraph | Table> = [
        new Paragraph({ text: plan.title, heading: HeadingLevel.TITLE }),
    ];
    for (const section of plan.sections) {
        if (section.heading) children.push(new Paragraph({ text: section.heading, heading: HeadingLevel.HEADING_1 }));
        children.push(...section.paragraphs.map((text) => new Paragraph({ children: [new TextRun(text)] })));
        children.push(...section.bullets.map((text) => new Paragraph({ text, bullet: { level: 0 } })));
        if (section.table) {
            children.push(new Table({
                rows: [
                    new TableRow({ children: section.table.headers.map((value) => new TableCell({ children: [new Paragraph({ text: value })] })) }),
                    ...section.table.rows.map((row) => new TableRow({ children: row.map((value) => new TableCell({ children: [new Paragraph({ text: String(value ?? "") })] })) })),
                ],
            }));
        }
    }
    return Packer.toBuffer(new Document({ sections: [{ children }] }));
}

async function renderXlsx(plan: z.infer<typeof xlsxPlanSchema>): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.title = plan.workbook.title;
    for (const sheetPlan of plan.sheets) {
        const sheet = workbook.addWorksheet(sheetPlan.name.slice(0, 31));
        if (sheetPlan.headers.length > 0) {
            sheet.addRow(sheetPlan.headers);
            sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
            sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E78" } };
        }
        sheetPlan.rows.forEach((row) => sheet.addRow(row));
        sheet.columns.forEach((column) => {
            const values = Array.isArray(column.values) ? column.values : [];
            column.width = Math.min(40, Math.max(12, ...values.slice(1).map((value) => String(value ?? "").length + 2)));
        });
        sheet.views = [{ state: "frozen", ySplit: sheetPlan.headers.length > 0 ? 1 : 0 }];
    }
    return Buffer.from(await workbook.xlsx.writeBuffer());
}

async function renderPdf(plan: z.infer<typeof pdfPlanSchema>): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        const doc = new PDFDocument({
            size: "A4",
            margins: { top: 54, right: 46, bottom: 60, left: 46 },
            bufferPages: true,
            info: { Title: plan.title },
        });
        doc.on("data", (chunk: Buffer) => chunks.push(chunk));
        doc.on("error", reject);
        doc.on("end", () => resolve(Buffer.concat(chunks)));

        doc.fillColor("#173f5f").font("Helvetica-Bold").fontSize(22).text(plan.title);
        doc.moveDown(0.4).strokeColor("#ed8b32").lineWidth(2)
            .moveTo(doc.page.margins.left, doc.y)
            .lineTo(doc.page.width - doc.page.margins.right, doc.y)
            .stroke()
            .moveDown(1);

        for (const section of plan.sections) {
            if (section.heading) {
                ensurePdfSpace(doc, 40);
                doc.fillColor("#173f5f").font("Helvetica-Bold").fontSize(15)
                    .text(section.heading)
                    .moveDown(0.4);
            }
            for (const paragraph of section.paragraphs) {
                doc.fillColor("#172033").font("Helvetica").fontSize(10.5)
                    .text(paragraph, { align: "justify", lineGap: 3 })
                    .moveDown(0.65);
            }
            for (const bullet of section.bullets) {
                doc.fillColor("#172033").font("Helvetica").fontSize(10.5)
                    .text(bullet, { bulletRadius: 2, indent: 14, lineGap: 3 })
                    .moveDown(0.25);
            }
            if (section.table) renderPdfTable(doc, section.table);
            doc.moveDown(0.5);
        }

        if (plan.footerText) addPdfFooter(doc, plan.footerText);
        doc.end();
    });
}

function renderPdfTable(
    doc: PDFKit.PDFDocument,
    table: z.infer<typeof tableSchema>,
): void {
    const columnCount = table.headers.length;
    const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const columnWidth = usableWidth / columnCount;
    const rowHeight = 24;
    const drawRow = (values: Array<string | number | boolean | null>, header: boolean) => {
        ensurePdfSpace(doc, rowHeight + 4);
        const y = doc.y;
        values.slice(0, columnCount).forEach((value, index) => {
            const x = doc.page.margins.left + index * columnWidth;
            doc.rect(x, y, columnWidth, rowHeight)
                .fillAndStroke(header ? "#eaf0f5" : "#ffffff", "#ccd5df");
            doc.fillColor("#172033")
                .font(header ? "Helvetica-Bold" : "Helvetica")
                .fontSize(8.5)
                .text(String(value ?? ""), x + 5, y + 7, {
                    width: columnWidth - 10,
                    height: rowHeight - 10,
                    ellipsis: true,
                });
        });
        doc.y = y + rowHeight;
    };
    drawRow(table.headers, true);
    table.rows.forEach((row) => drawRow(row, false));
    doc.moveDown(0.5);
}

function ensurePdfSpace(doc: PDFKit.PDFDocument, requiredHeight: number): void {
    const bottom = doc.page.height - doc.page.margins.bottom;
    if (doc.y + requiredHeight > bottom) doc.addPage();
}

function addPdfFooter(doc: PDFKit.PDFDocument, footerText: string): void {
    const pages = doc.bufferedPageRange();
    for (let index = 0; index < pages.count; index++) {
        doc.switchToPage(index);
        doc.fillColor("#667085").font("Helvetica").fontSize(8)
            .text(
                `${footerText} | ${index + 1}/${pages.count}`,
                doc.page.margins.left,
                doc.page.height - 36,
                {
                    width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
                    align: "center",
                },
            );
    }
}
