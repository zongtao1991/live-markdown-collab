import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/appStore';

const DocumentsPage = () => {
  const [newDocTitle, setNewDocTitle] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  
  const documents = useAppStore((state) => state.documents);
  const user = useAppStore((state) => state.user);
  const token = useAppStore((state) => state.token);
  const fetchDocuments = useAppStore((state) => state.fetchDocuments);
  const createDocument = useAppStore((state) => state.createDocument);
  const deleteDocument = useAppStore((state) => state.deleteDocument);
  const logout = useAppStore((state) => state.logout);
  
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchDocuments();
  }, [token]);

  const handleCreateDocument = async () => {
    if (!newDocTitle.trim()) {
      setError('请输入文档标题');
      return;
    }

    setLoading(true);
    setError('');
    const result = await createDocument(newDocTitle.trim());
    setLoading(false);

    if (result.success) {
      setNewDocTitle('');
      setShowCreateModal(false);
      navigate(`/editor/${result.document.id}`);
    } else {
      setError(result.error);
    }
  };

  const handleDeleteDocument = async (docId, e) => {
    e.stopPropagation();
    if (!window.confirm('确定要删除这个文档吗？此操作不可撤销。')) {
      return;
    }

    setDeletingId(docId);
    await deleteDocument(docId);
    setDeletingId(null);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            实时协作 Markdown 编辑器
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">欢迎, {user?.username}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              退出登录
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">我的文档</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新建文档
          </button>
        </div>

        {documents.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 mb-4">还没有文档，点击上方按钮创建第一个文档</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-5 cursor-pointer group"
                onClick={() => navigate(`/editor/${doc.id}`)}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-medium text-gray-900 truncate pr-2">
                    {doc.title}
                  </h3>
                  <button
                    onClick={(e) => handleDeleteDocument(doc.id, e)}
                    disabled={deletingId === doc.id}
                    className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-all"
                  >
                    {deletingId === doc.id ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                  {doc.content || '无内容'}
                </p>
                <p className="text-xs text-gray-400">
                  更新于: {formatDate(doc.updated_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">创建新文档</h3>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded mb-4 text-sm">
                {error}
              </div>
            )}

            <input
              type="text"
              value={newDocTitle}
              onChange={(e) => setNewDocTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateDocument()}
              placeholder="输入文档标题"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              autoFocus
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewDocTitle('');
                  setError('');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateDocument}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {loading ? '创建中...' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
