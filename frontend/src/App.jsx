import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/landingPage";
import Header from "./components/header";
import { AuthProvider, useAuth } from "./context/AuthContext";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import NotesPage from "./pages/NotesPage";
import HomePage from "./pages/HomePage";
import About from "./pages/About";
import Contact from "./pages/Contact";


function ProtectedRoute({ children }) {
  const { loading, isAuthed } = useAuth();
  if (loading) return null;
  return isAuthed ? children : <Navigate to="/signin" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />

          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          {/* legacy redirect if someone hits /notes */}
          <Route path="/notes" element={<Navigate to="/home" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
