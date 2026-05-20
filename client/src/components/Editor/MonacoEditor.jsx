import { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

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

const MonacoEditor = ({
  content,
  onChange,
  onCursorChange,
  onSelection,
  onContentUpdated,
  offContentUpdated,
  onCursorMoved,
  offCursorMoved,
  currentUser,
  onlineUsers,
  groupedComments
}) => {
  const editorRef = useRef(null);
  const decorationsRef = useRef({});
  const commentDecorationsRef = useRef(null);
  const lastContentRef = useRef(content);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    editor.onDidChangeModelContent((event) => {
      const currentContent = editor.getValue();
      lastContentRef.current = currentContent;
      onChange(event.changes, currentContent);
    });

    editor.onDidChangeCursorPosition((event) => {
      onCursorChange(event.position);
    });

    editor.onDidChangeCursorSelection((event) => {
      const selection = event.selection;
      if (selection && !selection.isEmpty()) {
        onSelection({
          startLineNumber: selection.startLineNumber,
          endLineNumber: selection.endLineNumber,
          startColumn: selection.startColumn,
          endColumn: selection.endColumn
        });
      }
    });
  };

  useEffect(() => {
    if (!editorRef.current) return;

    const handleRemoteContentUpdate = (data) => {
      if (data.userId === currentUser?.id) return;

      const editor = editorRef.current;
      const model = editor.getModel();
      if (!model) return;

      const { delta, content } = data;
      
      const currentText = editor.getValue();
      if (delta && Array.isArray(delta)) {
        try {
          const edits = delta.map((change) => ({
            range: {
              startLineNumber: change.range.startLineNumber,
              startColumn: change.range.startColumn,
              endLineNumber: change.range.endLineNumber,
              endColumn: change.range.endColumn
            },
            text: change.text,
            forceMoveMarkers: true
          }));
          
          model.pushEditOperations([], edits, () => null);
        } catch (err) {
          editor.setValue(content);
        }
      } else {
        editor.setValue(content);
      }
      
      lastContentRef.current = editor.getValue();
    };

    onContentUpdated(handleRemoteContentUpdate);

    return () => {
      offContentUpdated(handleRemoteContentUpdate);
    };
  }, [currentUser, onContentUpdated, offContentUpdated]);

  useEffect(() => {
    if (!editorRef.current) return;

    const handleRemoteCursorMove = (data) => {
      if (data.userId === currentUser?.id) return;

      const editor = editorRef.current;
      const model = editor.getModel();
      if (!model) return;

      const { position, socketId, username } = data;
      const color = getUserColor(socketId);

      const cursorDecoration = {
        range: new monaco.Range(
          position.lineNumber,
          position.column,
          position.lineNumber,
          position.column
        ),
        options: {
          isWholeLine: false,
          className: `remote-cursor-${socketId}`,
          beforeContentClassName: `remote-cursor-before-${socketId}`,
          showIfCollapsed: true,
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
        }
      };

      const labelDecoration = {
        range: new monaco.Range(
          position.lineNumber,
          position.column,
          position.lineNumber,
          position.column
        ),
        options: {
          isWholeLine: false,
          marginClassName: `remote-cursor-label-${socketId}`,
          showIfCollapsed: true
        }
      };

      if (!decorationsRef.current[socketId]) {
        decorationsRef.current[socketId] = editor.createDecorationsCollection();
      }

      decorationsRef.current[socketId].set([cursorDecoration, labelDecoration]);

      const styleId = `remote-cursor-style-${socketId}`;
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          .remote-cursor-before-${socketId}::before {
            content: '';
            display: inline-block;
            width: 2px;
            height: 1.4em;
            background-color: ${color};
            vertical-align: text-bottom;
            margin-left: -1px;
          }
          .margin-view-overlays .remote-cursor-label-${socketId}::before {
            content: '${username}';
            display: inline-block;
            background-color: ${color};
            color: white;
            font-size: 10px;
            padding: 1px 4px;
            border-radius: 0 0 3px 3px;
            white-space: nowrap;
            margin-left: 28px;
          }
        `;
        document.head.appendChild(style);
      }
    };

    onCursorMoved(handleRemoteCursorMove);

    return () => {
      offCursorMoved(handleRemoteCursorMove);
    };
  }, [currentUser, onCursorMoved, offCursorMoved]);

  useEffect(() => {
    if (!editorRef.current) return;
    
    if (lastContentRef.current !== content) {
      lastContentRef.current = content;
      editorRef.current.setValue(content || '');
    }
  }, [content]);

  useEffect(() => {
    if (!editorRef.current) return;

    const editor = editorRef.current;
    const commentDecorations = [];

    Object.entries(groupedComments).forEach(([key, comments]) => {
      if (comments.length === 0) return;

      const [startLine, endLine] = key.split('-').map(Number);
      
      commentDecorations.push({
        range: new monaco.Range(
          startLine,
          1,
          endLine,
          editor.getModel()?.getLineMaxColumn(endLine) || 1
        ),
        options: {
          isWholeLine: true,
          linesDecorationsClassName: 'comment-gutter-marker',
          className: 'comment-highlight',
          glyphMarginHoverMessage: {
            value: comments.map(c => `**${c.author_name}:** ${c.content}`).join('\n\n---\n\n')
          }
        }
      });
    });

    if (!commentDecorationsRef.current) {
      commentDecorationsRef.current = editor.createDecorationsCollection(commentDecorations);
    } else {
      commentDecorationsRef.current.set(commentDecorations);
    }

    return () => {
      if (commentDecorationsRef.current) {
        commentDecorationsRef.current.clear();
        commentDecorationsRef.current = null;
      }
    };
  }, [groupedComments]);

  return (
    <div className="h-full w-full">
      <style>{`
        .comment-highlight {
          background-color: rgba(59, 130, 246, 0.08);
          border-left: 3px solid #3b82f6;
        }
        .comment-gutter-marker {
          background-color: rgba(59, 130, 246, 0.2);
        }
        .comment-gutter-marker::before {
          content: '💬';
          font-size: 12px;
          margin-left: 4px;
        }
      `}</style>
      <Editor
        height="100%"
        defaultLanguage="markdown"
        value={content}
        theme="vs"
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          fontSize: 14,
          fontFamily: 'Consolas, "Courier New", monospace',
          wordWrap: 'on',
          wrappingIndent: 'same',
          renderLineHighlight: 'all',
          copyWithSyntaxHighlighting: false,
          formatOnPaste: true,
          tabSize: 2,
          insertSpaces: true,
          glyphMargin: true
        }}
      />
    </div>
  );
};

export default MonacoEditor;
