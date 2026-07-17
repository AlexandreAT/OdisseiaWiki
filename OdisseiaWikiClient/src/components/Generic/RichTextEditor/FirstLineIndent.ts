import { Extension } from '@tiptap/core';

export const FIRST_LINE_INDENT_VALUE = '1.5em';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    firstLineIndent: {
      toggleFirstLineIndent: () => ReturnType;
    };
  }
}

export const FirstLineIndent = Extension.create({
  name: 'firstLineIndent',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph'],
        attributes: {
          firstLineIndent: {
            default: null,
            keepOnSplit: true,
            parseHTML: (element) => element.style.textIndent || null,
            renderHTML: (attributes) => (
              attributes.firstLineIndent
                ? { style: `text-indent: ${attributes.firstLineIndent}` }
                : {}
            ),
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      toggleFirstLineIndent: () => ({ editor, commands }) => {
        if (!editor.isActive('paragraph')) return false;

        const isIndented = editor.isActive('paragraph', {
          firstLineIndent: FIRST_LINE_INDENT_VALUE,
        });

        return commands.updateAttributes('paragraph', {
          firstLineIndent: isIndented ? null : FIRST_LINE_INDENT_VALUE,
        });
      },
    };
  },
});
