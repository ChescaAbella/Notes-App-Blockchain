import { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/api";

const Ctx = createContext(null);
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function signin(identifierOrEmail, password) {
    const { data } = await api.post("/auth/signin", {
      identifier: identifierOrEmail,
      password,
    });
    localStorage.setItem("token", data.token);
    setUser(data.user);
  }

  async function signup({ firstName, lastName, email, password }) {
    const { data } = await api.post("/auth/signup", {
      firstName,
      lastName,
      email,
      password,
    });
    return data; // let caller decide what to do next
  }

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Ctx.Provider
      value={{ user, isAuthed: !!user, loading, signin, signup, logout }}
    >
      {children}
    </Ctx.Provider>
  );
}
