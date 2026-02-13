// Session management utility
export const setSession = (user) => {
  localStorage.setItem("session", JSON.stringify(user));
};

export const getSession = () => {
  const session = localStorage.getItem("session");
  const storedUser = localStorage.getItem("user");
  const token = localStorage.getItem("token");
  const parsedSession = session ? JSON.parse(session) : null;
  const parsedUser = storedUser ? JSON.parse(storedUser) : null;

  const merged = parsedSession || parsedUser;
  if (!merged) {
    return null;
  }

  if (token && !merged.token) {
    merged.token = token;
  }

  return merged;
};

export const clearSession = () => {
  localStorage.removeItem("session");
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const isLoggedIn = () => {
  return getSession() !== null;
};

export const isAdmin = () => {
  const session = getSession();
  return session && session.role === "ADMIN";
};

export const getUserRole = () => {
  const session = getSession();
  return session ? session.role : null;
};
