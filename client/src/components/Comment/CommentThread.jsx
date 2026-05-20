const CommentThread = ({ comment, replies, onReply }) => {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
            {comment.author_name?.charAt(0).toUpperCase() || '?'}
          </div>
          <span className="text-sm font-medium text-gray-800">
            {comment.author_name}
          </span>
        </div>
        <span className="text-xs text-gray-400">
          {formatDate(comment.created_at)}
        </span>
      </div>
      
      <div className="text-xs text-gray-500 mb-2">
        行 {comment.start_line} - {comment.end_line}
      </div>
      
      <p className="text-sm text-gray-700 mb-3">
        {comment.content}
      </p>
      
      <button
        onClick={onReply}
        className="text-xs text-blue-600 hover:text-blue-800"
      >
        回复
      </button>

      {replies.length > 0 && (
        <div className="mt-3 ml-4 border-l-2 border-gray-200 pl-3 space-y-3">
          {replies.map((reply) => (
            <div key={reply.id} className="bg-white rounded p-2">
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-1">
                  <div className="w-5 h-5 rounded-full bg-gray-400 text-white text-xs flex items-center justify-center">
                    {reply.author_name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <span className="text-xs font-medium text-gray-800">
                    {reply.author_name}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {formatDate(reply.created_at)}
                </span>
              </div>
              <p className="text-xs text-gray-700">
                {reply.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentThread;
