import { useState, useEffect } from 'react';
import useAppStore from '../../store/appStore';

const VersionHistory = ({ onVersionSaved, offVersionSaved, addVersion }) => {
  const versions = useAppStore((state) => state.versions);
  const [selectedVersion, setSelectedVersion] = useState(null);

  useEffect(() => {
    const handleVersionSaved = (version) => {
      addVersion(version);
    };

    onVersionSaved(handleVersionSaved);

    return () => {
      offVersionSaved(handleVersionSaved);
    };
  }, []);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPreview = (content) => {
    if (!content) return '空内容';
    const lines = content.split('\n');
    if (lines.length <= 3) {
      return content;
    }
    return lines.slice(0, 3).join('\n') + '\n...';
  };

  return (
    <div className="divide-y divide-gray-100">
      {versions.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-gray-500 text-sm">
            暂无版本历史，点击"保存版本"按钮创建第一个版本
          </p>
        </div>
      ) : (
        versions.map((version, index) => (
          <div 
            key={version.id}
            className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
              selectedVersion?.id === version.id ? 'bg-blue-50' : ''
            }`}
            onClick={() => setSelectedVersion(
              selectedVersion?.id === version.id ? null : version
            )}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-gray-800">
                  版本 {versions.length - index}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {formatDate(version.created_at)}
              </span>
            </div>
            
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
              <span>创建者: {version.created_by_name}</span>
            </div>
            
            {selectedVersion?.id === version.id && (
              <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                <pre className="text-xs text-gray-600 whitespace-pre-wrap break-words">
                  {getPreview(version.content)}
                </pre>
              </div>
            )}
            
            <div className="mt-2 text-xs text-gray-400">
              {selectedVersion?.id === version.id ? (
                <span>点击收起</span>
              ) : (
                <span>点击查看内容</span>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default VersionHistory;
