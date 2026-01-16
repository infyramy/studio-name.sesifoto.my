import DOMPurify from 'dompurify';

export function useSanitize() {
  const sanitize = (dirty: string): string => {
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: [
        'b',
        'i',
        'em',
        'strong',
        'a',
        'p',
        'br',
        'ul',
        'ol',
        'li',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'div',
        'span',
        'del', // Strikethrough
        'hr', // Horizontal rule (used in markdown)
        'code', // Inline code
        'pre', // Code blocks
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    });
  };

  return { sanitize };
}
