/**
 * Template literal function for colorizing terminal output with ANSI escape
 * codes.
 *
 * Processes color codes, styles, aliases, and reset commands in a clean
 * pipeline.
 *
 * @example
 * ```typescript
 * import c from '@gesslar/colours'
 *
 * console.log(c`{F045}Running:{/} {red}${testName}{/}`)
 * console.log(c`{<BU}Bold underlined{B>} just underlined{/}`)
 * ```
 */
declare function c(strings: TemplateStringsArray, ...values: any[]): string;

/**
 * Alias management system for creating semantic color names
 */
declare namespace c {
  export namespace alias {
    /**
     * Storage for alias mappings
     */
    const aliases: Map<string, string>;

    /**
     * Set an alias mapping
     *
     * @param alias - The alias name (e.g., "red")
     * @param replacement - The replacement code (e.g., "{F196}")
     */
    function set(alias: string, replacement: string): void;

    /**
     * Delete an alias mapping
     *
     * @param alias - The alias name to remove
     */
    function del(alias: string): void;
  }
}

export default c;
