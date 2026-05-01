const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

async function testPdf(filePath) {
    console.log(`--- Testando PDF: ${filePath} ---`);
    try {
        const buffer = fs.readFileSync(filePath);
        console.log(`Tamanho do buffer: ${buffer.length} bytes`);
        console.log(`Começa com %PDF: ${buffer.subarray(0, 4).toString() === '%PDF'}`);

        const data = await pdf(buffer);
        const text = data.text
            ?.replace(/\r/g, '\n')
            ?.replace(/[ \t]+/g, ' ')
            ?.replace(/\n{3,}/g, '\n\n')
            ?.trim();

        console.log(`Tamanho do texto extraído: ${text?.length || 0} caracteres`);
        if (text) {
            console.log('--- Início do texto (primeiros 500 chars) ---');
            console.log(text.slice(0, 500));
            console.log('---------------------------------------------');
        } else {
            console.warn('Nenhum texto extraído!');
        }
    } catch (err) {
        console.error('Erro ao processar PDF:', err.message);
    }
}

const target = process.argv[2] || 'Timbrado - Plano D.pdf';
testPdf(target);
