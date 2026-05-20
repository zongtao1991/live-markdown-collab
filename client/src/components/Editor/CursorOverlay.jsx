const CURSOR_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
];

const getUserColor = (socketId) => {
  let hash = 0;
  for (let i = 0; i < socketId.length; i++) {
    hash = socketId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
};

const CursorOverlay = ({ remoteCursors, editorRef }) => {
  if (!editorRef || !remoteCursors || remoteCursors.length === 0) {
    return null;
  }

  const getCursorPosition = (position) => {
    const editor = editorRef.current;
    if (!editor) return null;

    const model = editor.getModel();
    if (!model) return null;

    const range = {
      startLineNumber: position.lineNumber,
      startColumn: position.column,
      endLineNumber: position.lineNumber,
      endColumn: position.column
    };

    const visibleRange = editor.getVisibleRanges()[0];
    if (!visibleRange) return null;

    const layoutInfo = editor.getLayoutInfo();
    const scrollTop = editor.getScrollTop();
    const scrollLeft = editor.getScrollLeft();

    const lineHeight = editor.getOption('lineHeight') || 19;
    const fontInfo = editor.getOption('fontInfo');
    const charWidth = fontInfo?.spaceWidth || 8.4;

    const top = (position.lineNumber - visibleRange.startLineNumber) * lineHeight - scrollTop;
    const left = (position.column - 1) * charWidth - scrollLeft;

    return {
      top: Math.max(top, layoutInfo.contentTop),
      left: Math.max(left, layoutInfo.contentLeft),
      lineHeight
    };
  };

  return (
    <>
      {remoteCursors.map((cursor) => {
        const position = getCursorPosition(cursor.position);
        if (!position) return null;

        const color = getUserColor(cursor.socketId);

        return (
          <div
            key={cursor.socketId}
            style={{
              position: 'absolute',
              top: position.top,
              left: position.left,
              pointerEvents: 'none',
              zIndex: 10
            }}
          >
            <div
              style={{
                width: 2,
                height: position.lineHeight,
                backgroundColor: color
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: position.lineHeight,
                left: 0,
                backgroundColor: color,
                color: 'white',
                fontSize: 10,
                padding: '2px 4px',
                borderRadius: '0 0 3px 3px',
                whiteSpace: 'nowrap'
              }}
            >
              {cursor.username}
            </div>
          </div>
        );
      })}
    </>
  );
};

export default CursorOverlay;
