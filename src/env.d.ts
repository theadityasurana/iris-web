declare const __DEV__: boolean;

declare const process: { env: Record<string, string | undefined> };
declare function require(id: string): any;

declare module 'mammoth/mammoth.browser' {
  export function convertToHtml(input: { arrayBuffer: ArrayBuffer }): Promise<{ value: string }>;
}
declare module 'pdfjs-dist/build/pdf.worker.min.mjs?url' {
  const url: string;
  export default url;
}
