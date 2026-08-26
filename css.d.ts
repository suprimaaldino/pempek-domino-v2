// Type declarations for CSS files
// This file ensures TypeScript recognizes CSS imports

declare module '*.css' {
  const content: string;
  export = content;
}

declare module '*.scss' {
  const content: string;
  export = content;
}

declare module '*.sass' {
  const content: string;
  export = content;
}
