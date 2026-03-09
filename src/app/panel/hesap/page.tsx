"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function HesapAyarlariPage() {
  const [currentEmail, setCurrentEmail] = useState("");
  const [email, setEmail] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState("");
  const [emailError, setEmailError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [passSaving, setPassSaving] = useState(false);
  const [passSuccess, setPassSuccess] = useState("");
  const [passError, setPassError] = useState("");

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        if (data?.user?.email) {
          setCurrentEmail(data.user.email);
          setEmail(data.user.email);
        }
      });
  }, []);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailError("");
    setEmailSuccess("");
    if (email === currentEmail) {
      setEmailError("Yeni e-posta mevcut e-postayla aynı.");
      return;
    }
    setEmailSaving(true);
    try {
      const res = await fetch("/api/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setEmailError(data.error || "Kaydedilemedi."); return; }
      setCurrentEmail(email);
      setEmailSuccess("E-posta adresi güncellendi.");
      setTimeout(() => setEmailSuccess(""), 4000);
    } catch {
      setEmailError("Bağlantı hatası.");
    } finally {
      setEmailSaving(false);
    }
  }

  async function handlePassSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPassError("");
    setPassSuccess("");
    if (newPassword !== newPassword2) {
      setPassError("Yeni şifreler eşleşmiyor.");
      return;
    }
    if (newPassword.length < 6) {
      setPassError("Yeni şifre en az 6 karakter olmalı.");
      return;
    }
    setPassSaving(true);
    try {
      const res = await fetch("/api/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setPassError(data.error || "Kaydedilemedi."); return; }
      setPassSuccess("Şifre başarıyla güncellendi.");
      setCurrentPassword("");
      setNewPassword("");
      setNewPassword2("");
      setTimeout(() => setPassSuccess(""), 4000);
    } catch {
      setPassError("Bağlantı hatası.");
    } finally {
      setPassSaving(false);
    }
  }

  return (
    <div>
      <Link href="/panel" className="text-stone-500 text-sm hover:underline mb-4 inline-block">← Panele dön</Link>
      <h1 className="text-xl font-bold text-stone-800 mb-6">Hesap ayarları</h1>

      <div className="space-y-6 max-w-lg">
        {/* E-posta */}
        <form onSubmit={handleEmailSubmit} className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-stone-700">E-posta adresi</h2>
          {emailError && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{emailError}</p>}
          {emailSuccess && <p className="text-green-700 text-sm bg-green-50 px-3 py-2 rounded-lg">{emailSuccess}</p>}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Yeni e-posta</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2"
              required
            />
          </div>
          <button
            type="submit"
            disabled={emailSaving}
            className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 disabled:opacity-50 font-medium text-sm"
          >
            {emailSaving ? "Kaydediliyor…" : "E-postayı güncelle"}
          </button>
        </form>

        {/* Şifre */}
        <form onSubmit={handlePassSubmit} className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-stone-700">Şifre değiştir</h2>
          {passError && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{passError}</p>}
          {passSuccess && <p className="text-green-700 text-sm bg-green-50 px-3 py-2 rounded-lg">{passSuccess}</p>}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Mevcut şifre</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Yeni şifre</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Yeni şifre (tekrar)</label>
            <input
              type="password"
              value={newPassword2}
              onChange={(e) => setNewPassword2(e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2"
              required
            />
          </div>
          <button
            type="submit"
            disabled={passSaving}
            className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 disabled:opacity-50 font-medium text-sm"
          >
            {passSaving ? "Kaydediliyor…" : "Şifreyi güncelle"}
          </button>
        </form>
      </div>
    </div>
  );
}
