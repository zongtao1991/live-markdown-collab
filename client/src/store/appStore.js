import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import createApiClient from '../api/client';

const useAppStore = create(
  persist(
    (set, get) => {
      const apiClient = createApiClient(() => get().token);

      return {
        token: null,
        user: null,
        documents: [],
        currentDocument: null,
        comments: [],
        onlineUsers: [],
        versions: [],
        
        setToken: (token) => set({ token }),
        setUser: (user) => set({ user }),
        
        login: async (username, password) => {
          try {
            const response = await apiClient.post('/auth/login', { username, password });
            const { token, user } = response.data;
            set({ token, user });
            return { success: true };
          } catch (error) {
            return { 
              success: false, 
              error: error.response?.data?.error || 'Login failed' 
            };
          }
        },
        
        register: async (username, password) => {
          try {
            const response = await apiClient.post('/auth/register', { username, password });
            const { token, user } = response.data;
            set({ token, user });
            return { success: true };
          } catch (error) {
            return { 
              success: false, 
              error: error.response?.data?.error || 'Registration failed' 
            };
          }
        },
        
        logout: () => {
          set({
            token: null,
            user: null,
            documents: [],
            currentDocument: null,
            comments: [],
            onlineUsers: [],
            versions: []
          });
        },
        
        fetchDocuments: async () => {
          try {
            const response = await apiClient.get('/documents');
            set({ documents: response.data });
            return { success: true };
          } catch (error) {
            return { 
              success: false, 
              error: error.response?.data?.error || 'Failed to fetch documents' 
            };
          }
        },
        
        createDocument: async (title) => {
          try {
            const response = await apiClient.post('/documents', { title });
            const newDoc = response.data;
            set((state) => ({
              documents: [newDoc, ...state.documents]
            }));
            return { success: true, document: newDoc };
          } catch (error) {
            return { 
              success: false, 
              error: error.response?.data?.error || 'Failed to create document' 
            };
          }
        },
        
        setCurrentDocument: (document) => set({ currentDocument: document }),
        
        updateCurrentDocumentContent: (content) => {
          set((state) => ({
            currentDocument: state.currentDocument 
              ? { ...state.currentDocument, content } 
              : null
          }));
        },
        
        deleteDocument: async (documentId) => {
          try {
            await apiClient.delete(`/documents/${documentId}`);
            set((state) => ({
              documents: state.documents.filter((d) => d.id !== documentId),
              currentDocument: state.currentDocument?.id === documentId 
                ? null 
                : state.currentDocument
            }));
            return { success: true };
          } catch (error) {
            return { 
              success: false, 
              error: error.response?.data?.error || 'Failed to delete document' 
            };
          }
        },
        
        fetchComments: async (documentId) => {
          try {
            const response = await apiClient.get(`/comments/document/${documentId}`);
            set({ comments: response.data });
            return { success: true };
          } catch (error) {
            return { 
              success: false, 
              error: error.response?.data?.error || 'Failed to fetch comments' 
            };
          }
        },
        
        addComment: (comment) => {
          set((state) => ({
            comments: [...state.comments, comment]
          }));
        },
        
        setOnlineUsers: (users) => set({ onlineUsers: users }),
        
        addOnlineUser: (user) => {
          set((state) => {
            const exists = state.onlineUsers.find((u) => u.socketId === user.socketId);
            if (exists) return state;
            return { onlineUsers: [...state.onlineUsers, user] };
          });
        },
        
        removeOnlineUser: (socketId) => {
          set((state) => ({
            onlineUsers: state.onlineUsers.filter((u) => u.socketId !== socketId)
          }));
        },
        
        fetchVersions: async (documentId) => {
          try {
            const response = await apiClient.get(`/versions/document/${documentId}`);
            set({ versions: response.data });
            return { success: true };
          } catch (error) {
            return { 
              success: false, 
              error: error.response?.data?.error || 'Failed to fetch versions' 
            };
          }
        },
        
        addVersion: (version) => {
          set((state) => ({
            versions: [version, ...state.versions]
          }));
        }
      };
    },
    {
      name: 'app-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user
      })
    }
  )
);

export default useAppStore;
