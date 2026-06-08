import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    detectDocumentIntent,
    parseDocumentPlan,
    renderDocument,
    sanitizeFileName,
} from "../documents/document-service.js";

describe("detectDocumentIntent", () => {
    it("detects explicit document formats", () => {
        assert.deepEqual(detectDocumentIntent("Ikmal buatkan laporan PDF"), {
            requested: true,
            kind: "pdf",
            multipleFormats: false,
        });
        assert.deepEqual(detectDocumentIntent("buat proposal Word"), {
            requested: true,
            kind: "docx",
            multipleFormats: false,
        });
        assert.deepEqual(detectDocumentIntent("generate rekap Excel"), {
            requested: true,
            kind: "xlsx",
            multipleFormats: false,
        });
    });

    it("rejects multiple formats", () => {
        assert.deepEqual(detectDocumentIntent("buat laporan PDF dan Word"), {
            requested: true,
            multipleFormats: true,
        });
    });

    it("infers a format when none is explicit", () => {
        assert.equal(detectDocumentIntent("buatkan rekap data penjualan").kind, "xlsx");
        assert.equal(detectDocumentIntent("buatkan proposal kegiatan").kind, "docx");
        assert.equal(detectDocumentIntent("buatkan brosur siap cetak").kind, "pdf");
    });
});

describe("document plans", () => {
    it("parses valid JSON and enforces the expected kind", () => {
        const plan = parseDocumentPlan(
            '{"kind":"docx","title":"Proposal","sections":[{"paragraphs":["Isi"]}]}',
            "docx",
        );
        assert.equal(plan.kind, "docx");
        assert.throws(
            () => parseDocumentPlan('{"kind":"pdf","title":"X","sections":[{"paragraphs":["X"]}]}', "xlsx"),
            /DOCUMENT_PLAN_FORMAT_MISMATCH/,
        );
    });

    it("sanitizes generated file names", () => {
        assert.equal(sanitizeFileName("../../Laporan Penjualan?.PDF", "pdf"), "Laporan-Penjualan.pdf");
    });
});

describe("document renderers", () => {
    it("renders pdf, docx, and xlsx buffers", async () => {
        const pdf = await renderDocument({
            kind: "pdf",
            title: "Laporan",
            sections: [{
                heading: "Ringkasan",
                paragraphs: ["Isi laporan"],
                bullets: ["Poin penting"],
                table: { headers: ["Nama", "Nilai"], rows: [["A", 10]] },
            }],
            footerText: "Dibuat oleh bot",
        });
        assert.ok(pdf.buffer.length > 100);
        assert.equal(pdf.buffer.subarray(0, 4).toString(), "%PDF");
        assert.equal(pdf.mimeType, "application/pdf");

        const docx = await renderDocument({
            kind: "docx",
            title: "Proposal",
            sections: [{ heading: "Tujuan", paragraphs: ["Isi"], bullets: [], }],
        });
        assert.ok(docx.buffer.length > 100);
        assert.equal(docx.mimeType, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

        const xlsx = await renderDocument({
            kind: "xlsx",
            workbook: { title: "Rekap" },
            sheets: [{ name: "Data", headers: ["Nama", "Nilai"], rows: [["A", 10]] }],
        });
        assert.ok(xlsx.buffer.length > 100);
        assert.equal(xlsx.mimeType, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    });
});
