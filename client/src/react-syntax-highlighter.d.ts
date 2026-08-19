declare module "react-syntax-highlighter/dist/esm/prism-light" {
  import type { ComponentType } from "react";
  type Highlighter = ComponentType<Record<string, unknown>> & {
    registerLanguage: (name: string, language: unknown) => void;
  };
  const SyntaxHighlighter: Highlighter;
  export default SyntaxHighlighter;
}

declare module "react-syntax-highlighter/dist/esm/languages/prism/css" {
  const language: unknown;
  export default language;
}
declare module "react-syntax-highlighter/dist/esm/languages/prism/javascript" {
  const language: unknown;
  export default language;
}
declare module "react-syntax-highlighter/dist/esm/languages/prism/markup" {
  const language: unknown;
  export default language;
}
declare module "react-syntax-highlighter/dist/esm/languages/prism/python" {
  const language: unknown;
  export default language;
}
declare module "react-syntax-highlighter/dist/esm/languages/prism/typescript" {
  const language: unknown;
  export default language;
}
declare module "react-syntax-highlighter/dist/esm/styles/prism" {
  export const vscDarkPlus: Record<string, unknown>;
}
