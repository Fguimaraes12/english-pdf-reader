// Copia o worker do pdf.js para /public, de onde ele é servido ao navegador.
import { copyFileSync, mkdirSync } from "node:fs";

mkdirSync("public", { recursive: true });
copyFileSync(
  "node_modules/pdfjs-dist/build/pdf.worker.min.js",
  "public/pdf.worker.min.js",
);
