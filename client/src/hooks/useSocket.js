import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import useAppStore from '../store/appStore';

const useSocket = () => {
  const socketRef = useRef(null);
  const token = useAppStore((state) => state.token);
  const setOnlineUsers = useAppStore((state) => state.setOnlineUsers);
  const addOnlineUser = useAppStore((state) => state.addOnlineUser);
  const removeOnlineUser = useAppStore((state) => state.removeOnlineUser);

  const listenersRef = useRef({
    'content:updated': new Set(),
    'cursor:moved': new Set(),
    'comment:added': new Set(),
    'version:saved': new Set(),
    'joined:document': new Set()
  });

  const isRegisteredRef = useRef(false);

  const registerListenersOnSocket = useCallback((socket) => {
    if (!socket || !listenersRef.current) return;

    Object.entries(listenersRef.current).forEach(([eventName, callbacks]) => {
      callbacks.forEach((callback) => {
        socket.on(eventName, callback);
      });
    });
  }, []);

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    socketRef.current = io('http://localhost:7891', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      isRegisteredRef.current = true;
    });

    socket.on('joined:document', (data) => {
      setOnlineUsers(data.users);
      if (listenersRef.current['joined:document']) {
        listenersRef.current['joined:document'].forEach((callback) => {
          callback(data);
        });
      }
    });

    socket.on('user:joined', (data) => {
      addOnlineUser({ ...data.user, socketId: data.socketId });
    });

    socket.on('user:left', (data) => {
      removeOnlineUser(data.socketId);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      isRegisteredRef.current = false;
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    registerListenersOnSocket(socket);

    return () => {
      isRegisteredRef.current = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [token, registerListenersOnSocket]);

  const joinDocument = useCallback((documentId) => {
    if (socketRef.current) {
      socketRef.current.emit('join:document', documentId);
    }
  }, []);

  const leaveDocument = useCallback((documentId) => {
    if (socketRef.current) {
      socketRef.current.emit('leave:document', documentId);
    }
  }, []);

  const sendContentChange = useCallback((documentId, delta, content) => {
    if (socketRef.current) {
      socketRef.current.emit('content:change', { documentId, delta, content });
    }
  }, []);

  const sendCursorMove = useCallback((documentId, position) => {
    if (socketRef.current) {
      socketRef.current.emit('cursor:move', { documentId, position });
    }
  }, []);

  const emitComment = useCallback((documentId, content, start_line, end_line, parent_id = null) => {
    if (socketRef.current) {
      socketRef.current.emit('comment:add', {
        documentId,
        content,
        start_line,
        end_line,
        parent_id
      });
    }
  }, []);

  const saveVersion = useCallback((documentId, content) => {
    if (socketRef.current) {
      socketRef.current.emit('version:save', { documentId, content });
    }
  }, []);

  const onContentUpdated = useCallback((callback) => {
    if (!callback) return;
    
    listenersRef.current['content:updated'].add(callback);
    
    if (socketRef.current && isRegisteredRef.current) {
      socketRef.current.on('content:updated', callback);
    }
  }, []);

  const onCursorMoved = useCallback((callback) => {
    if (!callback) return;
    
    listenersRef.current['cursor:moved'].add(callback);
    
    if (socketRef.current && isRegisteredRef.current) {
      socketRef.current.on('cursor:moved', callback);
    }
  }, []);

  const onCommentAdded = useCallback((callback) => {
    if (!callback) return;
    
    listenersRef.current['comment:added'].add(callback);
    
    if (socketRef.current && isRegisteredRef.current) {
      socketRef.current.on('comment:added', callback);
    }
  }, []);

  const onVersionSaved = useCallback((callback) => {
    if (!callback) return;
    
    listenersRef.current['version:saved'].add(callback);
    
    if (socketRef.current && isRegisteredRef.current) {
      socketRef.current.on('version:saved', callback);
    }
  }, []);

  const offContentUpdated = useCallback((callback) => {
    if (!callback) return;
    
    listenersRef.current['content:updated'].delete(callback);
    
    if (socketRef.current) {
      socketRef.current.off('content:updated', callback);
    }
  }, []);

  const offCursorMoved = useCallback((callback) => {
    if (!callback) return;
    
    listenersRef.current['cursor:moved'].delete(callback);
    
    if (socketRef.current) {
      socketRef.current.off('cursor:moved', callback);
    }
  }, []);

  const offCommentAdded = useCallback((callback) => {
    if (!callback) return;
    
    listenersRef.current['comment:added'].delete(callback);
    
    if (socketRef.current) {
      socketRef.current.off('comment:added', callback);
    }
  }, []);

  const offVersionSaved = useCallback((callback) => {
    if (!callback) return;
    
    listenersRef.current['version:saved'].delete(callback);
    
    if (socketRef.current) {
      socketRef.current.off('version:saved', callback);
    }
  }, []);

  const onJoinedDocument = useCallback((callback) => {
    if (!callback) return;
    
    listenersRef.current['joined:document'].add(callback);
    
    if (socketRef.current && isRegisteredRef.current) {
      socketRef.current.on('joined:document', callback);
    }
  }, []);

  const offJoinedDocument = useCallback((callback) => {
    if (!callback) return;
    
    listenersRef.current['joined:document'].delete(callback);
    
    if (socketRef.current) {
      socketRef.current.off('joined:document', callback);
    }
  }, []);

  return {
    socket: socketRef.current,
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
    onJoinedDocument,
    offContentUpdated,
    offCursorMoved,
    offCommentAdded,
    offVersionSaved,
    offJoinedDocument
  };
};

export default useSocket;
