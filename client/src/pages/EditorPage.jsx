import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAppStore from '../store/appStore';
import useSocket from '../hooks/useSocket';
import MonacoEditor from '../components/Editor/MonacoEditor';
import MarkdownPreview from '../components/Editor/MarkdownPreview';
import CommentThread from '../components/Comment/CommentThread';
import CommentForm from '../components/Comment/CommentForm';
import VersionHistory from '../components/Version/VersionHistory';

const EditorPage = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  
  const [showVersions, setShowVersions] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [selection, setSelection] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  
  const token = useAppStore((state) => state.token);
  const user = useAppStore((state) => state.user);
  const currentDocument = useAppStore((state) => state.currentDocument);
  const comments = useAppStore((state) => state.comments);
  const onlineUsers = useAppStore((state) => state.onlineUsers);
  const setCurrentDocument = useAppStore((state) => state.setCurrentDocument);
  const updateCurrentDocumentContent = useAppStore((state) => state.updateCurrentDocumentContent);
  const fetchComments = useAppStore((state) => state.fetchComments);
  const addComment = useAppStore((state) => state.addComment);
  const fetchVersions = useAppStore((state) => state.fetchVersions);
  const addVersion = useAppStore((state) => state.addVersion);
  const logout = useAppStore((state) => state.logout);

  const {
    joinDocument,
    leaveDocument,
    sendContentChange,
    sendCursorMove,
    emitComment,
    saveVersion,
    onContentUpdated,
    onCursorMoved,
    onCommentAdded,
    onVersionSaved,
    offContentUpdated,
    offCursorMoved,
    offCommentAdded,
    offVersionSaved
  } = useSocket();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchDoc = async () => {
      try {
        const response = await fetch(`http://localhost:7891/api/documents/${documentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const doc = await response.json();
          setCurrentDocument(doc);
        } else {
          navigate('/documents');
        }
      } catch (error) {
        navigate('/documents');
      }
    };

    fetchDoc();
    fetchComments(documentId);
    fetchVersions(documentId);

    joinDocument(documentId);

    return () => {
      leaveDocument(documentId);
    };
  }, [token, documentId]);

  useEffect(() => {
    const handleCommentAdded = (comment) => {
      addComment(comment);
    };

    onCommentAdded(handleCommentAdded);

    return () => {
      offCommentAdded(handleCommentAdded);
    };
  }, [addComment, onCommentAdded, offCommentAdded]);

  const handleContentChange = useCallback((delta, content) => {
    updateCurrentDocumentContent(content);
    sendContentChange(documentId, delta, content);
  }, [documentId]);

  const handleCursorChange = useCallback((position) => {
    sendCursorMove(documentId, position);
  }, [documentId]);

  const handleSelection = useCallback((sel) => {
    setSelection(sel);
  }, []);

  const handleSaveVersion = useCallback(() => {
    if (currentDocument) {
      saveVersion(documentId, currentDocument.content);
    }
  }, [documentId, currentDocument]);

  const handleAddComment = useCallback((content) => {
    if (!selection && !replyTo) return;
    
    if (replyTo) {
      const comment = comments.find(c => c.id === replyTo);
      if (comment) {
        emitComment(
          documentId, 
          content, 
          comment.start_line, 
          comment.end_line, 
          replyTo
        );
      }
    } else if (selection) {
      emitComment(
        documentId, 
        content, 
        selection.startLineNumber, 
        selection.endLineNumber
      );
      setSelection(null);
    }
    setReplyTo(null);
  }, [documentId, selection, replyTo, comments, emitComment]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getCommentsByLine = () => {
    const grouped = {};
    comments.forEach(comment => {
      if (!comment.parent_id) {
        const key = `${comment.start_line}-${comment.end_line}`;
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(comment);
      }
    });
    return grouped;
  };

  const getReplies = (commentId) => {
    return comments.filter(c => c.parent_id === commentId);
  };

  const groupedComments = getCommentsByLine();

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <header className="bg-white shadow-sm shrink-0">
        <div className="max-w-full mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/documents')}
              className="text-gray-600 hover:text-gray-800 p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-xl font-semibold text-gray-800">
              {currentDocument?.title || '加载中...'}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {onlineUsers.slice(0, 5).map((u) => (
                <div
                  key={u.socketId}
                  className="w-8 h-8 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center border-2 border-white"
                  title={u.username}
                >
                  {u.username.charAt(0).toUpperCase()}
                </div>
              ))}
              {onlineUsers.length > 5 && (
                <div className="w-8 h-8 rounded-full bg-gray-400 text-white text-sm flex items-center justify-center border-2 border-white">
                  +{onlineUsers.length - 5}
                </div>
              )}
            </div>

            <button
              onClick={handleSaveVersion}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              保存版本
            </button>

            <button
              onClick={() => setShowVersions(!showVersions)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                showVersions 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              版本历史
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                showComments 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              评论 ({comments.length})
            </button>

            <span className="text-gray-600 text-sm">{user?.username}</span>
            <button
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 text-sm"
            >
              退出
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex overflow-hidden">
          <div className="w-1/2 border-r border-gray-200 overflow-hidden">
            {currentDocument && (
              <MonacoEditor
                content={currentDocument.content}
                onChange={handleContentChange}
                onCursorChange={handleCursorChange}
                onSelection={handleSelection}
                onContentUpdated={onContentUpdated}
                offContentUpdated={offContentUpdated}
                onCursorMoved={onCursorMoved}
                offCursorMoved={offCursorMoved}
                currentUser={user}
                onlineUsers={onlineUsers}
                groupedComments={groupedComments}
              />
            )}
          </div>

          <div className="w-1/2 overflow-auto p-6">
            {currentDocument && (
              <MarkdownPreview content={currentDocument.content} />
            )}
          </div>
        </div>

        {showComments && (
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col shrink-0">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-800">评论</h3>
            </div>

            {selection && (
              <div className="p-4 border-b border-gray-100 bg-blue-50">
                <p className="text-sm text-blue-700 mb-2">
                  选中行: {selection.startLineNumber} - {selection.endLineNumber}
                </p>
                <CommentForm
                  onSubmit={handleAddComment}
                  placeholder="添加评论..."
                  cancelText="取消"
                  onCancel={() => setSelection(null)}
                />
              </div>
            )}

            {replyTo && (
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <p className="text-sm text-gray-600 mb-2">回复评论</p>
                <CommentForm
                  onSubmit={handleAddComment}
                  placeholder="输入回复..."
                  cancelText="取消回复"
                  onCancel={() => setReplyTo(null)}
                />
              </div>
            )}

            <div className="flex-1 overflow-auto p-4">
              {comments.filter(c => !c.parent_id).length === 0 ? (
                <p className="text-gray-500 text-center text-sm py-8">
                  暂无评论，选中编辑器中的文本可添加评论
                </p>
              ) : (
                <div className="space-y-4">
                  {comments
                    .filter(c => !c.parent_id)
                    .map(comment => (
                      <CommentThread
                        key={comment.id}
                        comment={comment}
                        replies={getReplies(comment.id)}
                        onReply={() => setReplyTo(comment.id)}
                      />
                    ))
                  }
                </div>
              )}
            </div>
          </div>
        )}

        {showVersions && (
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col shrink-0">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-medium text-gray-800">版本历史</h3>
              <button
                onClick={() => setShowVersions(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <VersionHistory 
                onVersionSaved={onVersionSaved}
                offVersionSaved={offVersionSaved}
                addVersion={addVersion}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorPage;
