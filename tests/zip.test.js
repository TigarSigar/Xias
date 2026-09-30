const test = require('node:test');
const assert = require('node:assert/strict');
const zipHelper = require('../content/zip_helper.js');

test('XIASZipHelper Unit Test Suite', async (t) => {
  await t.test('Uncompressed extensions identification', () => {
    assert.equal(zipHelper.shouldKeepOriginal('report.docx'), true);
    assert.equal(zipHelper.shouldKeepOriginal('REPORT.DOCX'), true);
    assert.equal(zipHelper.shouldKeepOriginal('readme.txt'), true);
    assert.equal(zipHelper.shouldKeepOriginal('old_version.doc'), true);
    assert.equal(zipHelper.shouldKeepOriginal('bundle.zip'), true);

    // Other files must be zipped
    assert.equal(zipHelper.shouldKeepOriginal('script.py'), false);
    assert.equal(zipHelper.shouldKeepOriginal('Main.java'), false);
    assert.equal(zipHelper.shouldKeepOriginal('doc.pdf'), false);
    assert.equal(zipHelper.shouldKeepOriginal('table.xlsx'), false);
  });

  await t.test('Single .docx / .txt / .zip file is returned as-is without zipping', async () => {
    const docxFile = new File(['dummy docx content'], 'report.docx', { type: 'application/vnd.openxmlformats' });
    const result = await zipHelper.processFilesForSubmission([docxFile], 'Лабораторная 1');

    assert.equal(result.isZipped, false);
    assert.equal(result.fileToUpload.name, 'report.docx');
    assert.deepEqual(result.originalFiles, ['report.docx']);
  });

  await t.test('Non-docx files (.py, .pdf, .java, etc.) are automatically zipped into .zip archive', async () => {
    const pyFile = new File(['print("hello")'], 'solution.py', { type: 'text/x-python' });
    const result = await zipHelper.processFilesForSubmission([pyFile], 'Лабораторная 1');

    assert.equal(result.isZipped, true);
    assert.ok(result.fileToUpload.name.endsWith('.zip'), 'Must have .zip extension');
    assert.equal(result.fileToUpload.type, 'application/zip');
    assert.deepEqual(result.originalFiles, ['solution.py']);

    // Check ZIP header signature PK\x03\x04
    const buffer = await result.fileToUpload.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    assert.equal(bytes[0], 0x50); // 'P'
    assert.equal(bytes[1], 0x4B); // 'K'
    assert.equal(bytes[2], 0x03);
    assert.equal(bytes[3], 0x04);
  });

  await t.test('Multiple files are bundled into a single .zip archive', async () => {
    const file1 = new File(['int main() {}'], 'main.cpp', { type: 'text/plain' });
    const file2 = new File(['report text'], 'report.docx', { type: 'text/plain' });
    const result = await zipHelper.processFilesForSubmission([file1, file2], 'Курсовая работа');

    assert.equal(result.isZipped, true);
    assert.ok(result.fileToUpload.name.endsWith('.zip'));
    assert.equal(result.originalFiles.length, 2);
  });
});
