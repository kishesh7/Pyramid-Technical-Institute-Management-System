import "regenerator-runtime/runtime";
import fontkit from "@pdf-lib/fontkit";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  PDFDocument,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from "pdf-lib";
import QRCode from "qrcode";

type CertificatePdfData = {
  certificateNo: string;
  studentName: string;
  programName: string;
  completionDate: Date;
  issueDate: Date;
  passportPhotoUrl: string;
};

type FontSet = {
  regularLatin: PDFFont;
  regularDevanagari: PDFFont;
  boldLatin: PDFFont;
  boldDevanagari: PDFFont;
};

const pageWidth = 900;
const pageHeight = 600;
const navy = rgb(0.035, 0.16, 0.32);
const blue = rgb(0.08, 0.31, 0.55);
const gold = rgb(0.83, 0.58, 0.13);
const ink = rgb(0.08, 0.14, 0.23);
const muted = rgb(0.34, 0.39, 0.45);
const paper = rgb(1, 1, 0.985);

function getFontForCharacter(character: string, fonts: FontSet, bold: boolean) {
  const codePoint = character.codePointAt(0) ?? 0;
  const isDevanagari = codePoint >= 0x0900 && codePoint <= 0x097f;

  if (bold) {
    return isDevanagari ? fonts.boldDevanagari : fonts.boldLatin;
  }

  return isDevanagari ? fonts.regularDevanagari : fonts.regularLatin;
}

function getTextRuns(text: string, fonts: FontSet, bold: boolean) {
  const runs: { text: string; font: PDFFont }[] = [];

  for (const character of Array.from(text)) {
    const font = getFontForCharacter(character, fonts, bold);
    const lastRun = runs[runs.length - 1];

    if (lastRun?.font === font) {
      lastRun.text += character;
    } else {
      runs.push({ text: character, font });
    }
  }

  return runs;
}

function getTextWidth(text: string, size: number, fonts: FontSet, bold: boolean) {
  return getTextRuns(text, fonts, bold).reduce(
    (width, run) => width + run.font.widthOfTextAtSize(run.text, size),
    0
  );
}

function drawCenteredText(
  page: PDFPage,
  text: string,
  y: number,
  size: number,
  fonts: FontSet,
  color: ReturnType<typeof rgb>,
  options: { bold?: boolean; maxWidth?: number; centerX?: number } = {}
) {
  const bold = options.bold ?? false;
  const maxWidth = options.maxWidth ?? pageWidth - 80;
  const centerX = options.centerX ?? pageWidth / 2;
  const textWidth = getTextWidth(text, size, fonts, bold);
  const fittedSize =
    textWidth > maxWidth ? size * (maxWidth / textWidth) : size;
  let x = centerX - getTextWidth(text, fittedSize, fonts, bold) / 2;

  for (const run of getTextRuns(text, fonts, bold)) {
    const width = run.font.widthOfTextAtSize(run.text, fittedSize);
    page.drawText(run.text, {
      x,
      y,
      size: fittedSize,
      font: run.font,
      color,
    });
    x += width;
  }
}

function drawImageContain(
  page: PDFPage,
  image: PDFImage,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const scale = Math.min(width / image.width, height / image.height);
  const fittedWidth = image.width * scale;
  const fittedHeight = image.height * scale;

  page.drawImage(image, {
    x: x + (width - fittedWidth) / 2,
    y: y + (height - fittedHeight) / 2,
    width: fittedWidth,
    height: fittedHeight,
  });
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function drawCertificateFrame(page: PDFPage) {
  page.drawRectangle({
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    color: paper,
  });

  page.drawRectangle({
    x: 13,
    y: 13,
    width: pageWidth - 26,
    height: pageHeight - 26,
    borderColor: gold,
    borderWidth: 2,
  });

  page.drawRectangle({
    x: 21,
    y: 21,
    width: pageWidth - 42,
    height: pageHeight - 42,
    borderColor: blue,
    borderWidth: 0.65,
  });

  page.drawLine({
    start: { x: 22, y: pageHeight - 23 },
    end: { x: 162, y: pageHeight - 23 },
    thickness: 4,
    color: navy,
  });
  page.drawLine({
    start: { x: pageWidth - 22, y: 23 },
    end: { x: pageWidth - 162, y: 23 },
    thickness: 4,
    color: navy,
  });

  for (let index = 0; index < 6; index += 1) {
    page.drawLine({
      start: { x: 22 + index * 12, y: pageHeight - 25 },
      end: { x: 120 + index * 12, y: pageHeight - 25 },
      thickness: 0.7,
      color: gold,
    });
    page.drawLine({
      start: { x: pageWidth - 22 - index * 12, y: 25 },
      end: { x: pageWidth - 120 - index * 12, y: 25 },
      thickness: 0.7,
      color: gold,
    });
  }
}

export async function generateCertificatePdf(
  certificate: CertificatePdfData,
  verificationUrl: string
) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  pdf.setTitle(`Certificate ${certificate.certificateNo}`);
  pdf.setAuthor("Pyramid Technical Institute Pvt. Ltd.");
  pdf.setSubject(`Certificate awarded to ${certificate.studentName}`);

  const fontDirectory = join(
    process.cwd(),
    "public",
    "certificates",
    "fonts"
  );
  const [regularLatinBytes, regularDevanagariBytes, boldLatinBytes, boldDevanagariBytes] =
    await Promise.all([
      readFile(join(fontDirectory, "noto-serif-latin-400.woff")),
      readFile(
        join(fontDirectory, "noto-serif-devanagari-400.woff")
      ),
      readFile(join(fontDirectory, "noto-serif-latin-700.woff")),
      readFile(
        join(fontDirectory, "noto-serif-devanagari-700.woff")
      ),
    ]);

  const [regularLatin, regularDevanagari, boldLatin, boldDevanagari] =
    await Promise.all([
      pdf.embedFont(regularLatinBytes, { subset: true }),
      pdf.embedFont(regularDevanagariBytes, { subset: true }),
      pdf.embedFont(boldLatinBytes, { subset: true }),
      pdf.embedFont(boldDevanagariBytes, { subset: true }),
    ]);
  const fonts: FontSet = {
    regularLatin,
    regularDevanagari,
    boldLatin,
    boldDevanagari,
  };
  const page = pdf.addPage([pageWidth, pageHeight]);
  drawCertificateFrame(page);

  const logo = await pdf.embedPng(
    await readFile(join(process.cwd(), "public", "certificates", "institute-logo.png"))
  );
  const sealLogo = await pdf.embedPng(
    await readFile(join(process.cwd(), "public", "certificates", "seal-logo.png"))
  );
  const signature = await pdf.embedPng(
    await readFile(
      join(process.cwd(), "public", "certificates", "director-signature.png")
    )
  );
  const qrCode = await pdf.embedPng(
    await QRCode.toBuffer(verificationUrl, {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 256,
    })
  );

  const photoMatch =
    /^data:image\/(jpeg|png);base64,([A-Za-z0-9+/]+={0,2})$/.exec(
      certificate.passportPhotoUrl
    );
  if (!photoMatch) {
    throw new Error("A valid passport photo is required to generate this certificate.");
  }

  const photoBytes = Buffer.from(photoMatch[2], "base64");
  const photo =
    photoMatch[1] === "png"
      ? await pdf.embedPng(photoBytes)
      : await pdf.embedJpg(photoBytes);

  drawImageContain(page, logo, 38, 425, 120, 120);
  page.drawText("Regd. No.: 107615/069/070", {
    x: 180,
    y: 558,
    size: 10,
    font: regularLatin,
    color: navy,
  });
  page.drawText("Affiliation No.: 17/072/073", {
    x: 673,
    y: 558,
    size: 10,
    font: regularLatin,
    color: navy,
  });
  page.drawText("PAN No.: 601078691", {
    x: 673,
    y: 543,
    size: 10,
    font: regularLatin,
    color: navy,
  });
  drawCenteredText(
    page,
    "(Affiliated to Council for Technical Education and Vocational Training)",
    527,
    11,
    fonts,
    navy,
    { maxWidth: 570 }
  );
  drawCenteredText(
    page,
    "PYRAMID TECHNICAL INSTITUTE PVT. LTD.",
    498,
    22,
    fonts,
    navy,
    { bold: true, maxWidth: 575 }
  );
  drawCenteredText(
    page,
    "Head Office: Itahari-01, Sunsari",
    477,
    13,
    fonts,
    navy,
    { bold: true, maxWidth: 490 }
  );
  drawCenteredText(
    page,
    "(An institute of Skill Development)",
    460,
    12,
    fonts,
    navy,
    { maxWidth: 490 }
  );

  page.drawRectangle({
    x: 772,
    y: 390,
    width: 82,
    height: 104,
    color: paper,
    borderColor: gold,
    borderWidth: 2,
  });
  drawImageContain(page, photo, 777, 395, 72, 94);

  page.drawLine({
    start: { x: 126, y: 376 },
    end: { x: 220, y: 376 },
    thickness: 1.4,
    color: gold,
  });
  page.drawLine({
    start: { x: 680, y: 376 },
    end: { x: 774, y: 376 },
    thickness: 1.4,
    color: gold,
  });
  page.drawRectangle({
    x: 205,
    y: 350,
    width: 490,
    height: 49,
    color: navy,
    borderColor: gold,
    borderWidth: 2.5,
  });
  drawCenteredText(
    page,
    "Certificate of Participation",
    363,
    27,
    fonts,
    paper,
    { bold: true, maxWidth: 455 }
  );

  drawCenteredText(
    page,
    "This certificate is awarded to",
    317,
    21,
    fonts,
    navy,
    { bold: true }
  );
  drawCenteredText(page, certificate.studentName, 285, 24, fonts, ink, {
    bold: true,
    maxWidth: 650,
  });

  drawCenteredText(page, "for the successful completion of", 251, 15, fonts, ink);
  drawCenteredText(page, certificate.programName, 226, 17, fonts, navy, {
    bold: true,
    maxWidth: 700,
  });
  drawCenteredText(
    page,
    "training at Pyramid Technical Institute Pvt. Ltd.",
    199,
    14,
    fonts,
    ink,
    { maxWidth: 720 }
  );
  drawCenteredText(
    page,
    `Completion Date: ${formatDate(certificate.completionDate)}`,
    175,
    14,
    fonts,
    ink,
    { bold: true }
  );
  drawCenteredText(
    page,
    `Certificate No.: ${certificate.certificateNo}`,
    153,
    12,
    fonts,
    muted,
    { maxWidth: 600 }
  );

  drawImageContain(page, signature, 139, 94, 112, 46);
  page.drawLine({
    start: { x: 125, y: 88 },
    end: { x: 266, y: 88 },
    thickness: 0.8,
    color: navy,
  });
  drawCenteredText(page, "Director", 69, 13, fonts, navy, {
    bold: true,
    maxWidth: 170,
    centerX: 195,
  });

  page.drawEllipse({
    x: 450,
    y: 107,
    xScale: 33,
    yScale: 33,
    borderColor: blue,
    borderWidth: 1.7,
  });
  page.drawEllipse({
    x: 450,
    y: 107,
    xScale: 28,
    yScale: 28,
    borderColor: blue,
    borderWidth: 0.8,
  });
  drawImageContain(page, sealLogo, 430, 87, 40, 40);
  drawCenteredText(page, "OFFICIAL SEAL", 76, 5.5, fonts, blue, {
    bold: true,
    maxWidth: 62,
  });
  drawCenteredText(
    page,
    `Date of Issue: ${formatDate(certificate.issueDate)}`,
    53,
    11,
    fonts,
    ink,
    { bold: true, maxWidth: 260 }
  );

  page.drawImage(qrCode, { x: 782, y: 77, width: 68, height: 68 });
  drawCenteredText(page, "Scan to Verify", 63, 8, fonts, navy, {
    bold: true,
    maxWidth: 100,
    centerX: 816,
  });

  page.drawRectangle({ x: 277, y: 23, width: 346, height: 21, color: navy });
  drawCenteredText(
    page,
    "Phone: 025-588526  |  pyramidtech2069@gmail.com",
    29,
    8.5,
    fonts,
    paper,
    { maxWidth: 320 }
  );

  return Buffer.from(await pdf.save());
}
