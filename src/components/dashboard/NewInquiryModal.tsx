import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  AlertCircle,
  Loader2,
  Upload,
  Image as ImageIcon,
  FileText,
  Trash2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useInquiry } from '../../context/InquiryContext';
import { useToast } from '../../context/ToastContext';

interface NewInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewInquiryModal: React.FC<NewInquiryModalProps> = ({ isOpen, onClose }) => {
  const { createNewInquiry } = useInquiry();
  const { showToast } = useToast();

  // Workflow mode: 'screenshot' (default) vs 'text'
  const [sourceType, setSourceType] = useState<'screenshot' | 'text'>('screenshot');

  // Form states
  const [clientName, setClientName] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [rawMessage, setRawMessage] = useState<string>('');
  const [channel, setChannel] = useState<string>('Fiverr');

  // Screenshot upload states
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/png');

  // Submit status
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Reset error on open
  useEffect(() => {
    if (isOpen) {
      setError(null);
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const processImageFile = (file: File) => {
    setError(null);

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload a PNG, JPG, JPEG, or WebP screenshot.');
      return;
    }

    // Validate file size (Max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit. Please upload a compressed screenshot.');
      return;
    }

    setSelectedFile(file);
    setImageMimeType(file.type);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreviewUrl(result);
      setImageBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreviewUrl(null);
    setImageBase64(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!clientName.trim()) {
      setError('Client name is required.');
      return;
    }

    if (sourceType === 'screenshot' && !imageBase64) {
      setError('Please upload a Fiverr conversation screenshot before proceeding.');
      return;
    }

    if (sourceType === 'text' && !rawMessage.trim()) {
      setError('Inquiry text message is required.');
      return;
    }

    setSubmitting(true);

    try {
      const created = await createNewInquiry({
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim() || undefined,
        subject: subject.trim() || (sourceType === 'screenshot' ? 'Fiverr Client Project Inquiry' : 'New Client Proposal Request'),
        rawMessage: sourceType === 'text' ? rawMessage.trim() : '[Fiverr Screenshot Uploaded - Pending AI Extraction]',
        sourceChannel: channel,
        sourceType,
        screenshotData: imageBase64 || undefined,
        screenshotMimeType: imageMimeType,
      });

      if (created) {
        showToast('Inquiry created! Ready for AI analysis.', 'success');
        onClose();
        setSubject('');
        setRawMessage('');
        handleRemoveImage();
      } else {
        setError('Failed to create inquiry. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Error creating inquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-xs shadow-violet-600/30">
              <Sparkles className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Log New Client Inquiry</h3>
              <p className="text-[11px] text-slate-500">
                Upload a Fiverr screenshot or paste a client message for AI extraction
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workflow Mode Tabs */}
        <div className="px-6 pt-3 pb-2 border-b border-slate-100 bg-slate-50 flex items-center space-x-3 text-xs">
          <button
            type="button"
            onClick={() => {
              setSourceType('screenshot');
              setChannel('Fiverr');
            }}
            className={`flex-1 py-2 px-3 rounded-xl font-semibold flex items-center justify-center space-x-2 border transition cursor-pointer ${
              sourceType === 'screenshot'
                ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Upload Fiverr Screenshot</span>
            <span className={`text-[9px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded font-bold ml-1 ${
              sourceType === 'screenshot' ? 'bg-white/20 text-white' : 'bg-violet-100 text-violet-700'
            }`}>
              AI Vision
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSourceType('text')}
            className={`flex-1 py-2 px-3 rounded-xl font-semibold flex items-center justify-center space-x-2 border transition cursor-pointer ${
              sourceType === 'text'
                ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Paste Raw Text</span>
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs bg-white">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Screenshot Upload Field (Primary) */}
          {sourceType === 'screenshot' && (
            <div className="space-y-2">
              <label className="text-slate-800 font-bold flex items-center justify-between">
                <span>Fiverr Conversation Screenshot *</span>
                <span className="text-[10px] text-slate-400">PNG, JPG, JPEG, WebP (Max 5MB)</span>
              </label>

              {!imagePreviewUrl ? (
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-violet-200 hover:border-violet-400 bg-violet-50/50 hover:bg-violet-50 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition space-y-2"
                >
                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-violet-900">
                      Click to upload or drag & drop Fiverr screenshot
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Gemini Vision will automatically extract the chat history & client scope
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center space-x-3 relative">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 relative">
                    <img
                      src={imagePreviewUrl}
                      alt="Fiverr Screenshot Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">{selectedFile?.name || 'Fiverr Screenshot'}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {selectedFile ? (selectedFile.size / 1024).toFixed(1) + ' KB' : 'Image loaded'} • Ready for Gemini Analysis
                    </p>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="text-[11px] text-rose-600 hover:text-rose-700 font-medium flex items-center space-x-1 pt-0.5 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove / Replace Screenshot</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Client Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-600 font-semibold">Client Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-500 mt-1"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-600 font-semibold">Email Address (Optional)</label>
              <input
                type="email"
                placeholder="john@example.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-500 mt-1"
              />
            </div>
          </div>

          {/* Subject & Channel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-slate-800 font-bold">Project Subject / Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Brand Identity + Website or Mobile App"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-500 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-800 font-bold">Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-500 font-medium"
              >
                <option value="Fiverr">Fiverr</option>
                <option value="Upwork">Upwork</option>
                <option value="Email">Email</option>
                <option value="Direct">Direct</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Original Client Message (For Raw Text Mode) */}
          {sourceType === 'text' && (
            <div className="space-y-1.5">
              <label className="text-slate-800 font-bold">Original Client Message *</label>
              <textarea
                required
                rows={4}
                placeholder="Paste raw client message, job post description, or requirement snippet here..."
                value={rawMessage}
                onChange={(e) => setRawMessage(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-violet-500 resize-none text-xs leading-relaxed"
              />
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || (sourceType === 'screenshot' && !imageBase64)}
              className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-xs shadow-violet-600/30 transition flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Inquiry...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Create Inquiry & Analyze</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

