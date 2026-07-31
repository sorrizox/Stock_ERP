"use client";

import { FormEvent, useState } from "react";
import StockApp from "./stock-app";

export default function AccessGate() {
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState("");

  function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (!String(data.get("user") ?? "").trim() || !String(data.get("password") ?? "")) {
      setError("Informe o usuário e a senha corporativos.");
      return;
    }
    setAuthenticated(true);
  }

  if (authenticated) {
    return <StockApp initialUser={{ displayName: "Luiz Otávio", email: "admin@stockerp.local", fullName: "Luiz Otávio" }} />;
  }

  return (
    <main className="access-page">
      <header className="access-header"><StockLogo /><span>Plataforma de gestão de estoque</span></header>
      <section className="access-context">
        <p className="access-kicker">STOCK ERP · AMBIENTE CORPORATIVO</p>
        <h1>Gestão operacional com rastreabilidade de ponta a ponta.</h1>
        <p>Controle produtos, compras, inventários, separação e expedição com responsáveis, horários e histórico registrados.</p>
        <dl className="access-facts">
          <div><dt>Operação</dt><dd>Estoque e logística integrados</dd></div>
          <div><dt>Governança</dt><dd>Perfis, permissões e auditoria</dd></div>
          <div><dt>Integração</dt><dd>Conector para banco existente</dd></div>
        </dl>
      </section>
      <section className="access-panel">
        <form className="access-form" onSubmit={signIn}>
          <div className="access-form-heading"><span>Acesso restrito</span><h2>Entrar no sistema</h2><p>Use as credenciais fornecidas pelo administrador.</p></div>
          <label><span>Usuário ou e-mail</span><input name="user" autoComplete="username" placeholder="nome@empresa.com.br" /></label>
          <label><span>Senha</span><input name="password" type="password" autoComplete="current-password" placeholder="••••••••" /></label>
          {error && <p className="access-error" role="alert">{error}</p>}
          <button className="button button-primary button-block">Acessar Stock ERP</button>
          <p className="access-security">Compatível com Active Directory e SSO corporativo.</p>
        </form>
      </section>
      <footer className="access-footer">Stock ERP · Mogi Guaçu, SP · 2026</footer>
    </main>
  );
}

function StockLogo() {
  return <div className="stock-logo"><svg viewBox="0 0 44 44" aria-hidden="true"><path d="M7 13.5 22 6l15 7.5v17L22 38 7 30.5Z" /><path d="m7 13.5 15 7.6 15-7.6M22 21.1V38M14 10l15 7.6" /></svg><div><strong>STOCK</strong><span>ERP</span></div></div>;
}
