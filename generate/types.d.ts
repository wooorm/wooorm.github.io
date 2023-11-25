export interface ExtraFields {
  /**
   * The title of the page.
   */
  label?: string | undefined
}

// Add custom data supported when `rehype-meta` is added.
declare module 'vfile' {
  interface DataMapMeta extends ExtraFields {}

  interface DataMap {
    meta: DataMapMeta
  }
}

export {}
