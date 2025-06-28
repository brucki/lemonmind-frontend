import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import NewProduct from './pages/NewProduct';
import EditProduct from './pages/EditProduct';
import ProductDetail from './pages/ProductDetail';
import Categories from './pages/Categories';
import EditCategory from './pages/EditCategory';

// Wrapper component that includes the Layout
const LayoutWrapper: React.FC = () => (
  <Layout>
    <Outlet />
  </Layout>
);

// Protected layout wrapper
const ProtectedLayout: React.FC = () => (
  <ProtectedRoute>
    <LayoutWrapper />
  </ProtectedRoute>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Protected routes */}
          <Route element={<ProtectedLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Product routes */}
            <Route path="products">
              <Route index element={<Products />} />
              <Route path="new" element={<NewProduct />} />
              <Route path=":id" element={<ProductDetail />} />
              <Route path=":id/edit" element={<EditProduct />} />
            </Route>
            
            {/* Category routes */}
            <Route path="categories">
              <Route index element={<Categories />} />
              <Route path=":id/edit" element={<EditCategory />} />
            </Route>
            
            {/* Catch all other routes */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
