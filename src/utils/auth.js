// Session management utility
export const setSession = (user) => {
  localStorage.setItem("session", JSON.stringify(user));
};

export const getSession = () => {
  const session = localStorage.getItem("session");
  return session ? JSON.parse(session) : null;
};

export const clearSession = () => {
  localStorage.removeItem("session");
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
