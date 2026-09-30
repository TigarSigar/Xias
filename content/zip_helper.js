// XIAS Client-Side ZIP Packager & File Filter
// Compresses any non-(docx/doc/txt/zip) files into a standard ZIP archive before submission

(function(root) {
  // CRC-32 Lookup Table
  const crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[i] = c;
  }

  function calculateCRC32(uint8Array) {
    let crc = -1;
    for (let i = 0; i < uint8Array.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ uint8Array[i]) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
  }

  // Packs an array of { name: string, data: Uint8Array } into a ZIP Blob / Uint8Array
  function createZipArchive(files) {
    const encoder = new TextEncoder();
    const fileEntries = [];
    let currentOffset = 0;
    const bodyParts = [];

    const now = new Date();
    const dosTime = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xFFFF;
    const dosDate = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xFFFF;

    for (const file of files) {
      const nameBytes = encoder.encode(file.name);
      const dataBytes = file.data instanceof Uint8Array ? file.data : new Uint8Array(file.data);
      const crc = calculateCRC32(dataBytes);
      const size = dataBytes.length;

      // Local File Header (30 bytes + name)
      const lh = new Uint8Array(30 + nameBytes.length);
      const view = new DataView(lh.buffer);

      view.setUint32(0, 0x04034b50, true); // Local header signature
      view.setUint16(4, 20, true);          // Version needed
      view.setUint16(6, 0x0800, true);      // UTF-8 filename flag
      view.setUint16(8, 0, true);           // Compression: Store (0)
      view.setUint16(10, dosTime, true);
      view.setUint16(12, dosDate, true);
      view.setUint32(14, crc, true);
      view.setUint32(18, size, true);       // Compressed size
      view.setUint32(22, size, true);       // Uncompressed size
      view.setUint16(26, nameBytes.length, true);
      view.setUint16(28, 0, true);          // Extra field length
      lh.set(nameBytes, 30);

      fileEntries.push({ nameBytes, crc, size, offset: currentOffset, dosTime, dosDate });
      bodyParts.push(lh);
      bodyParts.push(dataBytes);

      currentOffset += lh.length + dataBytes.length;
    }

    const cdOffset = currentOffset;
    let cdSize = 0;
    const cdParts = [];

    // Central Directory Headers
    for (const entry of fileEntries) {
      const cdh = new Uint8Array(46 + entry.nameBytes.length);
      const view = new DataView(cdh.buffer);

      view.setUint32(0, 0x02014b50, true);  // Central directory signature
      view.setUint16(4, 20, true);          // Version made by
      view.setUint16(6, 20, true);          // Version needed
      view.setUint16(8, 0x0800, true);      // UTF-8 flag
      view.setUint16(10, 0, true);          // Compression method
      view.setUint16(12, entry.dosTime, true);
      view.setUint16(14, entry.dosDate, true);
      view.setUint32(16, entry.crc, true);
      view.setUint32(20, entry.size, true);
      view.setUint32(24, entry.size, true);
      view.setUint16(28, entry.nameBytes.length, true);
      view.setUint16(30, 0, true);          // Extra field length
      view.setUint16(32, 0, true);          // Comment length
      view.setUint16(34, 0, true);          // Disk start
      view.setUint16(36, 0, true);          // Internal attributes
      view.setUint32(38, 0, true);          // External attributes
      view.setUint32(42, entry.offset, true);
      cdh.set(entry.nameBytes, 46);

      cdParts.push(cdh);
      cdSize += cdh.length;
    }

    // End of Central Directory Record (22 bytes)
    const eocd = new Uint8Array(22);
    const eocdView = new DataView(eocd.buffer);
    eocdView.setUint32(0, 0x06054b50, true);
    eocdView.setUint16(4, 0, true);         // Disk number
    eocdView.setUint16(6, 0, true);         // Start disk
    eocdView.setUint16(8, fileEntries.length, true);  // Total entries on disk
    eocdView.setUint16(10, fileEntries.length, true); // Total entries
    eocdView.setUint32(12, cdSize, true);   // Central directory size
    eocdView.setUint32(16, cdOffset, true); // Central directory offset
    eocdView.setUint16(20, 0, true);        // Comment length

    const allParts = [...bodyParts, ...cdParts, eocd];
    return new Blob(allParts, { type: 'application/zip' });
  }

  // Extensions that MUST NOT be zipped (docx, doc, txt, zip)
  const UNCOMPRESSED_EXTS = ['.docx', '.doc', '.txt', '.zip'];

  function shouldKeepOriginal(filename) {
    if (!filename || typeof filename !== 'string') return false;
    const lower = filename.toLowerCase();
    return UNCOMPRESSED_EXTS.some(ext => lower.endsWith(ext));
  }

  /**
   * Processes a FileList or array of File objects:
   * - If a single file is .docx, .doc, .txt, .zip: returns the file as is.
   * - If files contain any other extension OR multiple files are uploaded:
   *   bundles and zips them into a single .zip File object!
   * @param {File[]|FileList} fileList
   * @param {string} taskTitle
   * @returns {Promise<{ fileToUpload: File, isZipped: boolean, originalFiles: string[] }>}
   */
  async function processFilesForSubmission(fileList, taskTitle = 'solution') {
    const files = Array.from(fileList);
    if (files.length === 0) {
      throw new Error('Файлы не выбраны');
    }

    // Одиночный файл с разрешенным расширением (.docx, .doc, .txt, .zip) сдаем без изменений
    if (files.length === 1 && shouldKeepOriginal(files[0].name)) {
      return {
        fileToUpload: files[0],
        isZipped: false,
        originalFiles: [files[0].name]
      };
    }

    // Во всех остальных случаях архивируем в ZIP
    const zipEntries = [];
    for (const f of files) {
      const buffer = await f.arrayBuffer();
      zipEntries.push({
        name: f.name,
        data: new Uint8Array(buffer)
      });
    }

    const zipBlob = createZipArchive(zipEntries);
    const cleanTitle = (taskTitle || 'solution')
      .replace(/[^\wа-яА-ЯёЁ0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 30);
    const zipName = `${cleanTitle}_solution.zip`;
    const zipFile = new File([zipBlob], zipName, { type: 'application/zip' });

    return {
      fileToUpload: zipFile,
      isZipped: true,
      originalFiles: files.map(f => f.name)
    };
  }

  const XIASZipHelper = {
    createZipArchive,
    shouldKeepOriginal,
    processFilesForSubmission
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = XIASZipHelper;
  }
  if (typeof window !== 'undefined') {
    window.XIASZipHelper = XIASZipHelper;
  }
})(typeof window !== 'undefined' ? window : globalThis);
