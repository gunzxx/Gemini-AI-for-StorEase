const pdf = require("pdf-parse");

async function readPdf(file_url) {
  try {
    const buffer = await (await fetch(file_url)).arrayBuffer();
    const pdfData = await pdf(Buffer.from(buffer));
    return pdfData.text;
  } catch (error) {
    throw error;
  }
}

module.exports = { readPdf };
