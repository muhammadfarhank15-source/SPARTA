import React, { useState } from 'react';
import { AlertTriangle, Lock, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  requiredTypedConfirmation?: string; // e.g. "RESET"
  requirePassword?: boolean;
  onConfirm: (enteredPassword?: string) => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  isDanger = false,
  requiredTypedConfirmation,
  requirePassword = false,
  onConfirm,
  onCancel,
}) => {
  const [typedValue, setTypedValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (requiredTypedConfirmation && typedValue.trim() !== requiredTypedConfirmation) {
      setErrorMsg(`Harap ketik kata "${requiredTypedConfirmation}" dengan tepat untuk melanjutkan.`);
      return;
    }
    if (requirePassword && !passwordValue) {
      setErrorMsg('Kata sandi admin wajib dimasukkan!');
      return;
    }

    setErrorMsg('');
    onConfirm(passwordValue);
    setTypedValue('');
    setPasswordValue('');
  };

  const handleCancel = () => {
    setErrorMsg('');
    setTypedValue('');
    setPasswordValue('');
    onCancel();
  };

  const isConfirmDisabled =
    (Boolean(requiredTypedConfirmation) && typedValue.trim() !== requiredTypedConfirmation) ||
    (requirePassword && !passwordValue);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden transform transition-all">
        {/* Header */}
        <div className={`p-5 flex items-start gap-4 ${isDanger ? 'bg-rose-50 border-b border-rose-100' : 'bg-slate-50 border-b border-slate-200'}`}>
          <div className={`p-2.5 rounded-xl ${isDanger ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className={`text-lg font-bold ${isDanger ? 'text-rose-900' : 'text-slate-900'}`}>
              {title}
            </h3>
            <p className="text-sm text-slate-600 mt-1 whitespace-pre-line leading-relaxed">
              {message}
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Inputs if needed */}
        <div className="p-5 space-y-4">
          {requiredTypedConfirmation && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Ketik <span className="font-mono text-rose-600 font-bold bg-rose-50 px-1 py-0.5 rounded border border-rose-200">{requiredTypedConfirmation}</span> untuk konfirmasi:
              </label>
              <input
                type="text"
                value={typedValue}
                onChange={(e) => {
                  setTypedValue(e.target.value);
                  setErrorMsg('');
                }}
                placeholder={`Ketik ${requiredTypedConfirmation}`}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500 font-mono text-sm tracking-wider"
                autoFocus
              />
            </div>
          )}

          {requirePassword && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                Kata Sandi Admin:
              </label>
              <input
                type="password"
                value={passwordValue}
                onChange={(e) => {
                  setPasswordValue(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Masukkan kata sandi admin Anda"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 text-sm"
              />
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-100 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isConfirmDisabled}
            onClick={handleConfirm}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm text-white shadow-sm transition-all ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 disabled:cursor-not-allowed'
                : 'bg-blue-900 hover:bg-blue-950 disabled:bg-blue-300 disabled:cursor-not-allowed'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
