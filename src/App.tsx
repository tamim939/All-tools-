import { useState, useEffect, useRef, type FormEvent } from 'react';
import { 
  Download, 
  Link as LinkIcon, 
  History, 
  Moon, 
  Sun, 
  Copy, 
  Check, 
  AlertCircle, 
  Search, 
  Youtube, 
  Instagram, 
  Facebook, 
  Video,
  ExternalLink,
  Trash2,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'react-hot-toast';
import axios from 'axios';
import { cn } from './lib/utils';

interface MediaSource {
  url: string;
  quality: string;
  extension: string;
  size?: string;
}

interface VideoData {
  title: string;
  thumbnail: string;
  duration?: string;
  source: string;
  medias: MediaSource[];
}

interface HistoryItem {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
  source: string;
  timestamp: number;
}

export default function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('download_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  const saveToHistory = (data: VideoData, originalUrl: string) => {
    const newItem: HistoryItem = {
      id: Math.random().toString(36).substring(7),
      title: data.title,
      thumbnail: data.thumbnail,
      url: originalUrl,
      source: data.source,
      timestamp: Date.now(),
    };

    const updatedHistory = [newItem, ...history.filter(item => item.url !== originalUrl)].slice(0, 10);
    setHistory(updatedHistory);
    localStorage.setItem('download_history', JSON.stringify(updatedHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('download_history');
    toast.success('History cleared');
  };

  const handleFetch = async (e?: FormEvent, targetUrl?: string) => {
    if (e) e.preventDefault();
    const finalUrl = targetUrl || url;
    if (!finalUrl.trim()) return;

    if (targetUrl) {
      setUrl(targetUrl);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    setLoading(true);
    setVideoData(null);

    try {
      const response = await axios.post('/api/fetch-video', { url: finalUrl });
      if (response.data.success) {
        setVideoData(response.data.data);
        saveToHistory(response.data.data, finalUrl);
        toast.success('Video data fetched!');
      } else {
        toast.error(response.data.error || 'Failed to fetch video');
      }
    } catch (error: any) {
      console.error('Fetch Error:', error);
      const serverError = error.response?.data?.error || error.response?.data?.message || error.message;
      toast.error(serverError || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, message: string = 'Copied to clipboard!') => {
    navigator.clipboard.writeText(text);
    toast.success(message, {
      icon: <Check className="w-4 h-4 text-green-500" />,
      style: {
        borderRadius: '10px',
        background: darkMode ? '#1f2937' : '#fff',
        color: darkMode ? '#fff' : '#1f2937',
      },
    });
  };

  const getPlatformIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case 'youtube': return <Youtube className="w-5 h-5 text-red-600" />;
      case 'tiktok': return <Video className="w-5 h-5 text-black dark:text-white" />;
      case 'instagram': return <Instagram className="w-5 h-5 text-pink-600" />;
      case 'facebook': return <Facebook className="w-5 h-5 text-blue-600" />;
      default: return <Video className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 font-sans text-gray-900 dark:text-gray-100">
      <Toaster position="top-center" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Download className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-1">
              <span className="text-gray-900 dark:text-white">All Tools</span>
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Download Free</span>
            </h1>
          </div>
          
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700 group"
            aria-label="Toggle theme"
          >
            {darkMode ? (
              <>
                <Sun className="w-4 h-4 text-yellow-500" />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Dark</span>
              </>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight"
          >
            All Tools <span className="text-indigo-600">Download Free</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
          >
            Save your favorite videos from TikTok, YouTube, Instagram, and Facebook in high quality.
          </motion.p>
        </div>

        {/* Search Bar */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative mb-12"
        >
          <form onSubmit={handleFetch} className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <LinkIcon className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste video link here (YouTube, TikTok, Instagram, FB)..."
              className="block w-full pl-12 pr-32 py-4 sm:py-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-base sm:text-lg"
            />
            <button
              type="submit"
              disabled={loading || !url}
              className="absolute right-2 top-2 bottom-2 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span className="hidden sm:inline">Fetch</span>
                </>
              )}
            </button>
          </form>
          
          <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1.5"><Youtube className="w-4 h-4" /> YouTube</div>
            <div className="flex items-center gap-1.5"><Video className="w-4 h-4" /> TikTok</div>
            <div className="flex items-center gap-1.5"><Instagram className="w-4 h-4" /> Instagram</div>
            <div className="flex items-center gap-1.5"><Facebook className="w-4 h-4" /> Facebook</div>
          </div>
        </motion.div>

        {/* Result Section */}
        <AnimatePresence mode="wait">
          {videoData && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden mb-12"
            >
              <div className="flex flex-col">
                {/* Video Player Section */}
                <div className="relative bg-black flex items-center justify-center overflow-hidden aspect-video sm:aspect-auto sm:min-h-[400px]">
                  {videoData.medias && videoData.medias.length > 0 ? (
                    <video 
                      key={videoData.medias[0].url}
                      src={videoData.medias.find(m => m.quality.toLowerCase().includes('no watermark'))?.url || videoData.medias[0].url} 
                      poster={videoData.thumbnail}
                      controls
                      className="w-full h-full max-h-[600px] object-contain"
                      playsInline
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="relative w-full h-full aspect-video flex items-center justify-center">
                      <img 
                        src={videoData.thumbnail} 
                        alt={videoData.title}
                        className="w-full h-full object-cover opacity-40 blur-sm"
                        referrerPolicy="no-referrer"
                      />
                      <Video className="w-20 h-20 text-white/20 absolute" />
                    </div>
                  )}
                </div>

                {/* Title & Download Buttons Section */}
                <div className="p-6 sm:p-8 bg-white dark:bg-gray-900">
                  {/* Title Section (Moved below video) */}
                  <div className="mb-8 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getPlatformIcon(videoData.source)}
                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">{videoData.source} Video</span>
                      </div>
                      <h3 className="text-xl font-bold leading-tight text-gray-900 dark:text-white">
                        {videoData.title}
                      </h3>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(videoData.title, 'Title copied!')}
                      className="p-3 bg-gray-50 dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-2xl border border-gray-100 dark:border-gray-700 transition-all group shadow-sm"
                      title="Copy Title"
                    >
                      <Copy className="w-5 h-5 text-gray-400 group-hover:text-indigo-600" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Video Button (Prefer No Watermark) */}
                    {(() => {
                      const videoMedia = videoData.medias.find(m => m.quality.toLowerCase().includes('no watermark')) || 
                                         videoData.medias.find(m => m.extension === 'mp4') || 
                                         videoData.medias[0];
                      return (
                        <a
                          href={videoMedia?.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-3 py-5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-500/30 transition-all active:scale-95"
                        >
                          <Download className="w-6 h-6" />
                          Download Video
                        </a>
                      );
                    })()}

                    {/* Audio Button */}
                    {(() => {
                      const audioMedia = videoData.medias.find(m => m.quality.toLowerCase().includes('audio') || m.extension === 'm4a' || m.extension === 'mp3') || 
                                         videoData.medias[videoData.medias.length - 1];
                      return (
                        <a
                          href={audioMedia?.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-3 py-5 px-6 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-2xl font-bold text-lg transition-all active:scale-95 border border-gray-200 dark:border-gray-700"
                        >
                          <Video className="w-6 h-6 opacity-50" />
                          Download Audio
                        </a>
                      );
                    })()}
                  </div>
                  
                  <p className="text-center mt-6 text-xs text-gray-400 font-medium uppercase tracking-widest">
                    High Quality • No Watermark • Fast Download
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History Section */}
        {history.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                <h3 className="text-xl font-bold">Recent Downloads</h3>
              </div>
              <button 
                onClick={clearHistory}
                className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Clear
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {history.map((item) => (
                <div 
                  key={item.id}
                  className="flex gap-4 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl hover:shadow-md transition-shadow group"
                >
                  <div className="w-24 h-16 flex-shrink-0 rounded-lg overflow-hidden relative">
                    <img 
                      src={item.thumbnail} 
                      alt={item.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                  </div>
                  <div className="flex flex-col justify-between py-0.5 overflow-hidden">
                    <h4 className="text-sm font-bold line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {item.title}
                    </h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        {getPlatformIcon(item.source)}
                        <span className="capitalize">{item.source}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleFetch(undefined, item.url)}
                          className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-md transition-colors"
                          title="Download Now"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => copyToClipboard(item.title, 'Title copied!')}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                          title="Copy Title"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => copyToClipboard(item.url, 'Link copied!')}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                          title="Copy Link"
                        >
                          <LinkIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Features / FAQ Section */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100 dark:border-indigo-900/20">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
              <Check className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-lg font-bold mb-2">High Quality</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Download videos in the best available resolution, including HD and 4K when supported.</p>
          </div>
          <div className="p-6 bg-violet-50 dark:bg-violet-900/10 rounded-3xl border border-violet-100 dark:border-violet-900/20">
            <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-violet-500/20">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-lg font-bold mb-2">No Watermark</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Download TikTok videos without any annoying watermarks for a clean viewing experience.</p>
          </div>
          <div className="p-6 bg-fuchsia-50 dark:bg-fuchsia-900/10 rounded-3xl border border-fuchsia-100 dark:border-fuchsia-900/20">
            <div className="w-12 h-12 bg-fuchsia-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-fuchsia-500/20">
              <Share2 className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-lg font-bold mb-2">Multi-Platform</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">One tool for all your needs. Supports YouTube, Instagram Reels, Facebook, and TikTok.</p>
          </div>
        </div>
      </main>

      <footer className="mt-24 border-t border-gray-200 dark:border-gray-800 py-12 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Download className="w-5 h-5 text-indigo-600" />
            <span className="text-lg font-bold tracking-tight">
              <span className="text-gray-900 dark:text-white">All Tools</span>{' '}
              <span className="text-indigo-600">Download Free</span>
            </span>
          </div>
          
          <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl inline-block border border-gray-100 dark:border-gray-800">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Developed by</p>
            <a 
              href="https://www.facebook.com/share/1DHdbobx7M/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-bold transition-colors"
            >
              <Facebook className="w-5 h-5" />
              Tamim Hasan
            </a>
          </div>

          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 max-w-md mx-auto">
            All Tools Download Free is a free online tool to download videos from social media platforms. We do not host any content on our servers.
          </p>
          <div className="flex justify-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-400">
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Contact</a>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400">
            © {new Date().getFullYear()} All Tools Download Free. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
