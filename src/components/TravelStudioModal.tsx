import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Video,
  Image as ImageIcon,
  Sparkles,
  Upload,
  Play,
  RotateCcw,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Film,
  Wand2,
  Maximize2,
  ArrowRight,
  RefreshCw,
  Sliders,
  Palette,
} from 'lucide-react';
import {
  generateVeoVideo,
  pollVeoVideoStatus,
  downloadVeoVideo,
  createAiImage,
  editAiImage,
} from '../services/aiMediaService';

interface TravelStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'video' | 'create-image' | 'edit-image';
}

const PRESET_SCENES = [
  {
    title: 'Mysore Palace Royal Gate',
    prompt: 'Cinematic slow motion tracking shot of illuminated Mysore Palace at dusk with sparkling golden lights',
    previewUrl: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: '10-Lane Bengaluru Expressway',
    prompt: 'Smooth highway drive on access-controlled expressway through Karnataka countryside under golden hour sun',
    previewUrl: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: 'Coorg Western Ghats Mist',
    prompt: 'Aerial drone flight over lush green coffee hills and winding mountain roads with rolling morning mist',
    previewUrl: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: 'Kempegowda Airport Terminal',
    prompt: 'Clean modern airport departures terminal with luxury cab arrival under gentle rain reflections',
    previewUrl: 'https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&w=600&q=80',
  },
];

export const TravelStudioModal: React.FC<TravelStudioModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'video',
}) => {
  const [activeTab, setActiveTab] = useState<'video' | 'create-image' | 'edit-image'>(initialTab);

  // Video Generation State (Veo veo-3.1-fast-generate-preview)
  const [videoPrompt, setVideoPrompt] = useState(
    'Cinematic 4K camera glides past an illuminated royal palace with moving clouds and golden ambient reflections'
  );
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [videoSourceImage, setVideoSourceImage] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<'IDLE' | 'GENERATING' | 'READY' | 'ERROR'>('IDLE');
  const [videoProgressMsg, setVideoProgressMsg] = useState('');
  const [videoProgressPercent, setVideoProgressPercent] = useState(0);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Create Image State (gemini-3.1-flash-image-preview)
  const [imagePrompt, setImagePrompt] = useState(
    'Toyota Innova Crysta luxury cab parked at the foothills of Chamundi Hill with golden sunrise lighting'
  );
  const [imageAspectRatio, setImageAspectRatio] = useState<'16:9' | '1:1' | '9:16'>('16:9');
  const [imageStatus, setImageStatus] = useState<'IDLE' | 'GENERATING' | 'READY' | 'ERROR'>('IDLE');
  const [createdImageUrl, setCreatedImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  // Edit Image State (gemini-3.1-flash-image-preview)
  const [editPrompt, setEditPrompt] = useState(
    'Add golden hour morning sunbeams, lush green plantation trees in the background, and clean road reflections'
  );
  const [editSourceImage, setEditSourceImage] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<'IDLE' | 'GENERATING' | 'READY' | 'ERROR'>('IDLE');
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  // -------------------------------------------------------------
  // Video Generation Handlers
  // -------------------------------------------------------------
  const handleUploadPhotoForVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setVideoSourceImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim()) return;
    setVideoStatus('GENERATING');
    setVideoError(null);
    setGeneratedVideoUrl(null);
    setVideoProgressPercent(10);
    setVideoProgressMsg('Initializing Veo 3.1 neural model...');

    const reassuringMsgs = [
      'Analyzing scene geometry and camera trajectory...',
      'Synthesizing temporal video frames with Veo Fast...',
      'Refining lighting, depth of field, and textures...',
      'Encoding 720p MP4 master render...',
    ];

    let msgIndex = 0;
    const msgInterval = setInterval(() => {
      if (msgIndex < reassuringMsgs.length) {
        setVideoProgressMsg(reassuringMsgs[msgIndex]);
        setVideoProgressPercent((prev) => Math.min(prev + 20, 85));
        msgIndex++;
      }
    }, 2500);

    try {
      const res = await generateVeoVideo(
        videoPrompt,
        videoAspectRatio,
        videoSourceImage || undefined
      );

      if (!res.success || !res.operationName) {
        throw new Error(res.error || 'Failed to start Veo video generation');
      }

      const opName = res.operationName;

      // Poll until done (up to 30 attempts, 3s interval)
      let done = false;
      let attempts = 0;
      while (!done && attempts < 30) {
        await new Promise((r) => setTimeout(r, 3000));
        attempts++;
        const pollRes = await pollVeoVideoStatus(opName);
        if (pollRes.done) {
          done = true;
          break;
        }
      }

      clearInterval(msgInterval);
      setVideoProgressPercent(95);
      setVideoProgressMsg('Downloading final video stream...');

      const downloadRes = await downloadVeoVideo(opName, videoAspectRatio);
      if (!downloadRes.success || !downloadRes.videoUrl) {
        throw new Error(downloadRes.error || 'Failed to retrieve generated video');
      }

      setGeneratedVideoUrl(downloadRes.videoUrl);
      setVideoStatus('READY');
      setVideoProgressPercent(100);
      setVideoProgressMsg('Video generation complete!');
    } catch (err: any) {
      clearInterval(msgInterval);
      console.error('Video generation error:', err);
      setVideoError(err.message || 'Video generation failed. Please try again.');
      setVideoStatus('ERROR');
    }
  };

  // -------------------------------------------------------------
  // Image Creation Handlers
  // -------------------------------------------------------------
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;
    setImageStatus('GENERATING');
    setImageError(null);
    setCreatedImageUrl(null);

    try {
      const res = await createAiImage(imagePrompt, imageAspectRatio);
      if (!res.success || !res.imageUrl) {
        throw new Error(res.error || 'Could not generate image');
      }
      setCreatedImageUrl(res.imageUrl);
      setImageStatus('READY');
    } catch (err: any) {
      console.error('Image creation error:', err);
      setImageError(err.message || 'Image creation failed');
      setImageStatus('ERROR');
    }
  };

  // Send created image directly to Veo video generator
  const handlePipeImageToVideo = (imgUrl: string) => {
    setVideoSourceImage(imgUrl);
    setActiveTab('video');
    setVideoPrompt(`Cinematic fluid camera movement showcasing ${imagePrompt}`);
  };

  // -------------------------------------------------------------
  // Image Editing Handlers
  // -------------------------------------------------------------
  const handleUploadPhotoForEdit = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setEditSourceImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleEditImage = async () => {
    if (!editSourceImage) {
      setEditError('Please upload an image to edit.');
      return;
    }
    if (!editPrompt.trim()) return;

    setEditStatus('GENERATING');
    setEditError(null);
    setEditedImageUrl(null);

    try {
      const res = await editAiImage(editPrompt, editSourceImage);
      if (!res.success || !res.imageUrl) {
        throw new Error(res.error || 'Image editing failed');
      }
      setEditedImageUrl(res.imageUrl);
      setEditStatus('READY');
    } catch (err: any) {
      console.error('Image edit error:', err);
      setEditError(err.message || 'Image editing failed');
      setEditStatus('ERROR');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl my-6 overflow-hidden text-slate-900 flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="bg-[#0a4d3c] px-6 py-4 flex items-center justify-between text-white shrink-0 border-b border-emerald-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0ef10e]/20 border border-[#0ef10e]/40 flex items-center justify-center text-[#0ef10e]">
              <Sparkles className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-white">
                  TRAVEL JUST Creative Studio
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#0ef10e] text-[#0a4d3c]">
                  Veo & Gemini AI
                </span>
              </div>
              <p className="text-xs text-emerald-200">
                Image-to-Video with Veo • AI Destination Art & Photo Editing
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Studio Sub-Navigation Tabs */}
        <div className="flex items-center gap-1 p-2 bg-slate-100 border-b border-slate-200 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'video'
                ? 'bg-white text-emerald-950 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Film className="w-4 h-4 text-[#0a4d3c]" />
            <span>Veo Image-to-Video</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold uppercase">
              Veo 3.1
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('create-image')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'create-image'
                ? 'bg-white text-emerald-950 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-[#F54900]" />
            <span>Create Travel Imagery</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-extrabold uppercase">
              Gemini 3.1 Flash
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('edit-image')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'edit-image'
                ? 'bg-white text-emerald-950 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Wand2 className="w-4 h-4 text-purple-700" />
            <span>Edit Photos with Prompts</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: VEO IMAGE-TO-VIDEO GENERATOR */}
          {activeTab === 'video' && (
            <div className="space-y-6">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#0a4d3c] text-white flex items-center justify-center shrink-0">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-emerald-950">
                    Veo Generative Video Engine (veo-3.1-fast-generate-preview)
                  </h4>
                  <p className="text-xs text-emerald-800 leading-relaxed mt-0.5">
                    Upload any photo of a vacation spot, cab, or road view to bring it to life with cinematic motion, camera pans, and realistic movement in <strong>16:9</strong> (landscape) or <strong>9:16</strong> (portrait).
                  </p>
                </div>
              </div>

              {/* Upload Starting Photo (Optional) */}
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                  1. Starting Photo (Optional: Upload or Pick Preset)
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition-colors border border-slate-300 cursor-pointer shadow-2xs"
                  >
                    <Upload className="w-4 h-4 text-[#0a4d3c]" />
                    <span>{videoSourceImage ? 'Change Photo' : 'Upload Travel Photo'}</span>
                  </button>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUploadPhotoForVideo}
                    className="hidden"
                  />

                  {videoSourceImage && (
                    <div className="flex items-center gap-2 bg-emerald-100/70 px-3 py-1.5 rounded-xl border border-emerald-300">
                      <img
                        src={videoSourceImage}
                        alt="Starting photo"
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                      <span className="text-xs font-bold text-emerald-900">Photo attached</span>
                      <button
                        type="button"
                        onClick={() => setVideoSourceImage(null)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {!videoSourceImage && (
                    <span className="text-xs text-slate-500">
                      Or generate directly from motion prompt
                    </span>
                  )}
                </div>

                {/* Preset inspirations */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {PRESET_SCENES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setVideoPrompt(preset.prompt);
                        setVideoSourceImage(preset.previewUrl);
                      }}
                      className="group relative rounded-xl overflow-hidden border border-slate-200 hover:border-emerald-600 text-left transition-all cursor-pointer shadow-2xs hover:shadow-xs aspect-video"
                    >
                      <img
                        src={preset.previewUrl}
                        alt={preset.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent p-2 flex flex-col justify-end">
                        <span className="text-[11px] font-black text-white leading-tight">
                          {preset.title}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio Picker: strictly 16:9 or 9:16 per requirement */}
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                  2. Video Aspect Ratio
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <button
                    type="button"
                    onClick={() => setVideoAspectRatio('16:9')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                      videoAspectRatio === '16:9'
                        ? 'border-[#0a4d3c] bg-emerald-50 text-emerald-950 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="w-6 h-4 border-2 border-current rounded-xs" />
                    <span>16:9 (Landscape / Widescreen)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVideoAspectRatio('9:16')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                      videoAspectRatio === '9:16'
                        ? 'border-[#0a4d3c] bg-emerald-50 text-emerald-950 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="w-4 h-6 border-2 border-current rounded-xs" />
                    <span>9:16 (Portrait / Reels & Mobile)</span>
                  </button>
                </div>
              </div>

              {/* Prompt Input */}
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                  3. Veo Motion Prompt
                </label>
                <textarea
                  rows={3}
                  value={videoPrompt}
                  onChange={(e) => setVideoPrompt(e.target.value)}
                  placeholder="Describe camera movement, lighting, vehicle action, or scene animation..."
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 text-sm font-medium outline-none resize-none"
                />
              </div>

              {/* Action Button */}
              <div>
                <button
                  type="button"
                  onClick={handleGenerateVideo}
                  disabled={videoStatus === 'GENERATING' || !videoPrompt.trim()}
                  className="w-full py-3.5 px-6 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-[#0a4d3c] to-[#07382c] hover:brightness-110 active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {videoStatus === 'GENERATING' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Generating Video with Veo 3.1...</span>
                    </>
                  ) : (
                    <>
                      <Film className="w-5 h-5 text-[#0ef10e]" />
                      <span>Generate Veo Video ({videoAspectRatio})</span>
                    </>
                  )}
                </button>
              </div>

              {/* Progress State */}
              {videoStatus === 'GENERATING' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-800 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-[#0a4d3c] animate-spin" />
                      {videoProgressMsg}
                    </span>
                    <span className="text-[#0a4d3c] font-black">{videoProgressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#0a4d3c] h-full transition-all duration-500 rounded-full"
                      style={{ width: `${videoProgressPercent}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 text-center">
                    Video generation with Veo takes 10 to 45 seconds for cinematic frame consistency.
                  </p>
                </div>
              )}

              {/* Error Alert */}
              {videoStatus === 'ERROR' && videoError && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <strong className="block font-bold mb-0.5">Generation notice:</strong>
                    <span>{videoError}</span>
                  </div>
                </div>
              )}

              {/* Video Player Output */}
              {generatedVideoUrl && (
                <div className="space-y-3 bg-slate-900 rounded-3xl p-4 sm:p-5 text-white">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Generated with Veo 3.1 Fast
                    </span>
                    <a
                      href={generatedVideoUrl}
                      download={`travel-just-veo-${Date.now()}.mp4`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Download MP4
                    </a>
                  </div>

                  <div className="relative rounded-2xl overflow-hidden bg-black flex items-center justify-center max-h-[460px]">
                    <video
                      src={generatedVideoUrl}
                      controls
                      autoPlay
                      loop
                      playsInline
                      className={`max-h-[460px] object-contain rounded-2xl ${
                        videoAspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-video'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CREATE TRAVEL IMAGERY (gemini-3.1-flash-image-preview) */}
          {activeTab === 'create-image' && (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#F54900] text-white flex items-center justify-center shrink-0">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-amber-950">
                    Gemini 3.1 Flash Image Preview (Text-to-Image)
                  </h4>
                  <p className="text-xs text-amber-800 leading-relaxed mt-0.5">
                    Generate travel posters, scenic postcards, and chauffeur vehicle scenes directly from natural language prompts.
                  </p>
                </div>
              </div>

              {/* Prompt Suggestions */}
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                  Suggested Prompts
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Toyota Innova Crysta parked in front of Chamundi Hill with golden morning sunrise',
                    'Royal illuminated Mysore Palace courtyard at twilight with luxury sedan cab',
                    'Wayanad Kerala misty tea garden hairpin curves with clear blue sky',
                    'Bengaluru-Mysuru 10-Lane Expressway high-speed transit with green farmlands',
                  ].map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setImagePrompt(sug)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors border border-slate-200 text-left cursor-pointer"
                    >
                      {sug.length > 55 ? `${sug.substring(0, 55)}...` : sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt Area */}
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                  Prompt Description
                </label>
                <textarea
                  rows={3}
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="Describe the travel visual you want to create..."
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 text-sm font-medium outline-none resize-none"
                />
              </div>

              {/* Aspect Ratio */}
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-3 gap-2 max-w-sm">
                  {(['16:9', '1:1', '9:16'] as const).map((ar) => (
                    <button
                      key={ar}
                      type="button"
                      onClick={() => setImageAspectRatio(ar)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        imageAspectRatio === ar
                          ? 'border-[#F54900] bg-amber-50 text-[#F54900]'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      {ar}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                type="button"
                onClick={handleGenerateImage}
                disabled={imageStatus === 'GENERATING' || !imagePrompt.trim()}
                className="w-full py-3.5 px-6 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-[#F54900] to-amber-700 hover:brightness-110 active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {imageStatus === 'GENERATING' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Synthesizing Image with Gemini 3.1 Flash Image Preview...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Create Image ({imageAspectRatio})</span>
                  </>
                )}
              </button>

              {/* Error */}
              {imageStatus === 'ERROR' && imageError && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {imageError}
                </div>
              )}

              {/* Image Result */}
              {createdImageUrl && (
                <div className="space-y-3 bg-slate-900 rounded-3xl p-4 sm:p-5 text-white">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Generated with Gemini 3.1 Flash Image Preview
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePipeImageToVideo(createdImageUrl)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0a4d3c] hover:bg-[#07382c] text-xs font-bold text-[#0ef10e] transition-colors cursor-pointer"
                      >
                        <Film className="w-3.5 h-3.5" />
                        <span>Animate with Veo</span>
                      </button>

                      <a
                        href={createdImageUrl}
                        download={`travel-just-image-${Date.now()}.png`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                    </div>
                  </div>

                  <div className="rounded-2xl overflow-hidden bg-black flex items-center justify-center max-h-[460px]">
                    <img
                      src={createdImageUrl}
                      alt={imagePrompt}
                      className="max-h-[460px] w-full object-contain rounded-2xl"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EDIT IMAGES WITH PROMPTS (gemini-3.1-flash-image-preview) */}
          {activeTab === 'edit-image' && (
            <div className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-700 text-white flex items-center justify-center shrink-0">
                  <Wand2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-purple-950">
                    Gemini 3.1 Flash Image Preview (Image-to-Image Editing)
                  </h4>
                  <p className="text-xs text-purple-800 leading-relaxed mt-0.5">
                    Upload an existing photo and specify changes in natural language (e.g., &quot;add morning mist&quot;, &quot;place a clean white sedan in foreground&quot;, &quot;change sky to sunset colors&quot;).
                  </p>
                </div>
              </div>

              {/* Upload image */}
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                  1. Source Photo
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => editInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition-colors border border-slate-300 cursor-pointer shadow-2xs"
                  >
                    <Upload className="w-4 h-4 text-purple-700" />
                    <span>{editSourceImage ? 'Change Image' : 'Select Photo to Edit'}</span>
                  </button>
                  <input
                    ref={editInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUploadPhotoForEdit}
                    className="hidden"
                  />

                  {/* Or pick preset */}
                  <span className="text-xs text-slate-500">or pick a sample:</span>
                  <button
                    type="button"
                    onClick={() => setEditSourceImage('https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=600&q=80')}
                    className="text-xs font-bold text-purple-700 hover:underline"
                  >
                    Palace Archway
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditSourceImage('https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=600&q=80')}
                    className="text-xs font-bold text-purple-700 hover:underline"
                  >
                    Expressway Road
                  </button>
                </div>

                {editSourceImage && (
                  <div className="pt-2">
                    <img
                      src={editSourceImage}
                      alt="Source for editing"
                      className="w-48 h-32 rounded-xl object-cover border border-slate-300 shadow-xs"
                    />
                  </div>
                )}
              </div>

              {/* Edit Instruction Prompt */}
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                  2. Edit Instruction
                </label>
                <textarea
                  rows={3}
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="Describe exactly what changes you want applied..."
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 text-sm font-medium outline-none resize-none"
                />
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleEditImage}
                disabled={editStatus === 'GENERATING' || !editSourceImage || !editPrompt.trim()}
                className="w-full py-3.5 px-6 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-purple-700 to-indigo-800 hover:brightness-110 active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {editStatus === 'GENERATING' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Applying Edits with Gemini 3.1 Flash Image Preview...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    <span>Apply Edits to Image</span>
                  </>
                )}
              </button>

              {/* Error */}
              {editStatus === 'ERROR' && editError && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {editError}
                </div>
              )}

              {/* Edited Image Result */}
              {editedImageUrl && (
                <div className="space-y-3 bg-slate-900 rounded-3xl p-4 sm:p-5 text-white">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Edited Successfully
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePipeImageToVideo(editedImageUrl)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0a4d3c] hover:bg-[#07382c] text-xs font-bold text-[#0ef10e] transition-colors cursor-pointer"
                      >
                        <Film className="w-3.5 h-3.5" />
                        <span>Animate with Veo</span>
                      </button>

                      <a
                        href={editedImageUrl}
                        download={`travel-just-edited-${Date.now()}.png`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase">Original</span>
                      <img
                        src={editSourceImage!}
                        alt="Original"
                        className="w-full h-48 object-cover rounded-xl border border-slate-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-purple-400 uppercase">Edited</span>
                      <img
                        src={editedImageUrl}
                        alt="Edited"
                        className="w-full h-48 object-cover rounded-xl border border-purple-500 shadow-md"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Powered by Veo Video & Gemini 3.1 Flash Image Preview</span>
          <button
            type="button"
            onClick={onClose}
            className="font-bold text-slate-700 hover:text-slate-900"
          >
            Close Studio
          </button>
        </div>
      </div>
    </div>
  );
};
