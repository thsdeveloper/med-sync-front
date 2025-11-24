'use client';

import { useCallback, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

interface UseReportExportOptions {
    filename?: string;
}

async function renderPdfFromElement(element: HTMLElement) {
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    const pageHeight = pdf.internal.pageSize.getHeight();

    let heightLeft = pdfHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
    }

    return pdf;
}

export function useReportExport(options?: UseReportExportOptions) {
    const [isExporting, setIsExporting] = useState(false);

    const exportToPDF = useCallback(
        async (element: HTMLElement | null | undefined) => {
            if (!element) {
                toast.error('Não foi possível localizar o conteúdo do relatório.');
                return;
            }

            setIsExporting(true);
            try {
                const pdf = await renderPdfFromElement(element);
                pdf.save(`${options?.filename ?? 'relatorio-medsync'}.pdf`);
                toast.success('PDF gerado com sucesso.');
            } catch (error) {
                console.error(error);
                toast.error('Erro ao gerar o PDF do relatório.');
            } finally {
                setIsExporting(false);
            }
        },
        [options?.filename],
    );

    const generatePdfBase64 = useCallback(async (element: HTMLElement | null | undefined) => {
        if (!element) {
            toast.error('Não foi possível localizar o conteúdo do relatório.');
            return null;
        }

        try {
            const pdf = await renderPdfFromElement(element);
            const dataUri = pdf.output('datauristring');
            const [, base64] = dataUri.split(',');
            return base64 ?? null;
        } catch (error) {
            console.error(error);
            toast.error('Erro ao preparar o PDF para envio.');
            return null;
        }
    }, []);

    return {
        exportToPDF,
        generatePdfBase64,
        isExporting,
    };
}



