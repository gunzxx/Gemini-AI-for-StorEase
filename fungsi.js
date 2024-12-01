const fs = require("fs");
const pdf = require("pdf-parse");

async function readPdf(file) {
  try {
    const bufferData = fs.readFileSync(file);
    const pdfData = await pdf(bufferData);
    return pdfData.text;
  } catch (error) {
    throw error;
  }
}

module.exports = { readPdf };
