// 재귀적으로 마크다운 블록을 문자열로 변환하는 함수
export type MarkdownBlock = {
  parent: string;
  children?: MarkdownBlock[];
};

export const blocksToMarkdown = (blocks: MarkdownBlock[], indentLevel: number = 0): string[] => {
  const result: string[] = [];
  const indent = '  '.repeat(indentLevel); // 2칸 들여쓰기

  for (const block of blocks) {
    // parent 추가 (들여쓰기 적용)
    const indentedParent = indentLevel > 0 && block.parent.startsWith('-') ? indent + block.parent : block.parent;
    result.push(indentedParent);

    // children이 있으면 재귀적으로 처리 (들여쓰기 레벨 증가)
    if (block.children && block.children.length > 0) {
      const childMarkdown = blocksToMarkdown(block.children, indentLevel + 1);
      result.push(...childMarkdown);
    }
  }

  return result;
};
