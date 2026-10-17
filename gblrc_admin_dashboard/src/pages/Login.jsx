import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { loginAdmin, selectAuth } from "../store";
import { ROUTES } from "../constants/routes";

export const Login = () => {
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated } = useSelector(selectAuth);
  const [form, setForm] = useState({ email: "", password: "" });

  if (isAuthenticated) return <Navigate to={ROUTES.DASHBOARD} replace />;

  const submit = (event) => {
    event.preventDefault();
    dispatch(loginAdmin(form));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-border bg-background-secondary p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-warning">GBLRC Admin</p>
        <h1 className="mt-2 text-2xl font-extrabold text-text-primary">Sign in</h1>
        <p className="mt-1 mb-6 text-sm text-text-muted">Manage categories, navigation, and catalog.</p>
        {error && <div className="mb-4 rounded-xl bg-red-50 text-danger text-sm p-3">{error}</div>}
        <label className="block text-xs font-semibold mb-1">Email</label>
        <input
          type="email"
          required
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          className="mb-4 w-full rounded-xl border border-border px-3 py-2.5 text-sm"
        />
        <label className="block text-xs font-semibold mb-1">Password</label>
        <input
          type="password"
          required
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          className="mb-6 w-full rounded-xl border border-border px-3 py-2.5 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-warning py-3 text-sm font-semibold text-white"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
};

export default Login;
