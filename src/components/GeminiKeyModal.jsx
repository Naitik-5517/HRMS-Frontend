import React, { useState, useEffect } from "react";
import { 
  KeyRound, 
  Eye, 
  EyeOff, 
  Trash2, 
  Loader2, 
  CheckCircle, 
  ExternalLink,
  Info,
  X
} from "lucide-react";
import toast from "react-hot-toast";
import { 
  saveGeminiApiKey, 
  fetchGeminiApiKey , 
  deleteGeminiApiKey 
} from "../services/agentService";

const GeminiKeyModal = ({ isOpen, onClose, currentUser }) => {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const userId = currentUser?.user_id || currentUser?.id;

  // Fetch existing key status when modal opens
  useEffect(() => {
    if (!isOpen || !userId) return;

    const loadKey = async () => {
      setFetching(true);
      try {
        const res = await fetchGeminiApiKey(userId);
        if (res.success && res.hasKey && res.gemini_api_key) {
          setHasKey(true);
          setApiKey(res.gemini_api_key);
          sessionStorage.setItem("gemini_api_key", res.gemini_api_key);
        } else {
          setHasKey(false);
          setApiKey("");
        }
      } catch (error) {
        console.error("Failed to load Gemini key:", error);
      } finally {
        setFetching(false);
      }
    };

    loadKey();
  }, [isOpen, userId]);

  const handleSave = async () => {
    const trimmedKey = apiKey.trim();
    if (!trimmedKey) {
      toast.error("Please enter your Gemini API key");
      return;
    }
    if (!trimmedKey.startsWith("AI") && trimmedKey.length < 20) {
      toast.error("The key doesn't look valid. Gemini API keys usually start with 'AI...'");
      return;
    }
    if (!userId) {
      toast.error("User not authenticated");
      return;
    }

    setLoading(true);
    try {
      await saveGeminiApiKey(userId, trimmedKey);
      setHasKey(true);
      sessionStorage.setItem("gemini_api_key", trimmedKey);
      window.dispatchEvent(new CustomEvent("gemini-key-updated"));
      toast.success("Gemini API key saved successfully!");
      onClose();
    } catch {
      toast.error("Failed to save API key. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!userId) return;
    setDeleting(true);
    try {
      await deleteGeminiApiKey(userId);
      setHasKey(false);
      setApiKey("");
      sessionStorage.removeItem("gemini_api_key");
      window.dispatchEvent(new CustomEvent("gemini-key-updated"));
      toast.success("Gemini API key removed");
    } catch {
      toast.error("Failed to remove API key");
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  const maskedKey = apiKey
    ? `${apiKey.slice(0, 6)}${"•".repeat(Math.min(20, apiKey.length - 6))}${apiKey.slice(-4)}`
    : "";

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-linear-to-r from-purple-600 to-indigo-600 p-6 text-white relative">

          <button 
            onClick={onClose}
            className="absolute right-4 top-4 p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <KeyRound size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Gemini API Key</h3>
              <p className="text-purple-100 text-xs">Your key is stored securely per account</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {fetching ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-2">
              <Loader2 className="animate-spin text-purple-600" size={32} />
              <p className="text-slate-500 text-sm">Loading your key configuration...</p>
            </div>
          ) : (
            <>
              {hasKey && (
                <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="text-emerald-600" size={18} />
                    <div className="flex flex-col">
                      <span className="text-emerald-800 font-bold text-xs uppercase tracking-wide">Key Active</span>
                      <span className="text-emerald-600 text-[11px] font-mono">{maskedKey}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-full">ACTIVE</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">
                  {hasKey ? "Update API Key" : "Enter your Gemini API Key"}
                </label>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    placeholder="AIza..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full py-2.5 px-3 pr-10 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                    onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Get your free API key from{" "}
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-purple-600 font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    Google AI Studio <ExternalLink size={12} />
                  </a>
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-3">
                <div className="mt-0.5">
                  <Info size={16} className="text-blue-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Why do I need this?</p>
                  <p className="text-[11px] text-blue-600 leading-relaxed">
                    AI Evaluation uses Google Gemini to quality-check your work files. 
                    Using your own key gives you dedicated quota and better performance.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                {hasKey ? (
                  <button
                    onClick={handleDelete}
                    disabled={deleting || loading}
                    className="flex items-center gap-2 text-rose-600 hover:text-rose-700 text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    Remove Key
                  </button>
                ) : (
                  <div />
                )}
                
                <div className="flex gap-2">
                  <button 
                    onClick={onClose}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave} 
                    disabled={loading || deleting || !apiKey.trim()}
                    className="flex items-center gap-2 px-6 py-2 bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"

                  >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                    Save Key
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeminiKeyModal;

