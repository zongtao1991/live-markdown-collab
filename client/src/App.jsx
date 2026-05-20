import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DocumentsPage from './pages/DocumentsPage';
import EditorPage from './pages/EditorPage';
import useAppStore from './store/appStore';

const PrivateRoute = ({ children }) => {
  const token = useAppStore((state) => state.token);
  return token ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/documents"
        element={
          <PrivateRoute>
            <DocumentsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/editor/:documentId"
        element={
          <PrivateRoute>
            <EditorPage />
          </PrivateRoute>
        }
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
