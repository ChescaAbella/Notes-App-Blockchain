import { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/api";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function signin(email, password) {
    const { data } = await api.post("/auth/signin", { email, password });
    localStorage.setItem("token", data.token);
    setUser(data.user);
  }
  async function signup(nameOrEmail, emailMaybe, password) {
    const payload = emailMaybe
      ? { email: emailMaybe, password }
      : { email: nameOrEmail, password };
    const { data } = await api.post("/auth/signup", payload);
    localStorage.setItem("token", data.token);
    setUser(data.user);
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
