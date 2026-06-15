declare module "pdf-parse/lib/pdf-parse.js" {
  interface PdfParseResult {
    text: string;
    numpages: number;
  }
  export default function pdf(data: Buffer): Promise<PdfParseResult>;
}
