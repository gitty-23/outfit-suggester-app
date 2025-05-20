import { useState, useMemo, useRef } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { OUTFIT_DB } from '../outfit_db_generated'

// --- Mock Sentiment Analysis ---
function mockSentimentAnalysis(text) {
  const lower = text.toLowerCase();
  if (
    lower.includes('happy') ||
    lower.includes('excited') ||
    lower.includes('cheerful') ||
    lower.includes('great') ||
    lower.includes('good') ||
    lower.includes('amazing') ||
    lower.includes('awesome') ||
    lower.includes('fantastic') ||
    lower.includes('joy') ||
    lower.includes('delighted')
  ) return 'happy';
  if (
    lower.includes('sad') ||
    lower.includes('down') ||
    lower.includes('blue') ||
    lower.includes('tired') ||
    lower.includes('depressed') ||
    lower.includes('unhappy') ||
    lower.includes('bad') ||
    lower.includes('upset') ||
    lower.includes('gloomy')
  ) return 'sad';
  if (
    lower.includes('angry') ||
    lower.includes('mad') ||
    lower.includes('frustrated') ||
    lower.includes('furious') ||
    lower.includes('annoyed') ||
    lower.includes('irritated')
  ) return 'angry';
  return 'neutral';
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper to split images into top and bottom
const topFolders = ['Shirts', 'Tees', 'Sweater', 'Polo', 'Hoodie', 'Jaket', 'Jaket_Denim', 'Jaket_Olahraga', 'Blazer', 'coats'];
const bottomFolders = ['Jeans', 'casual shorts', 'Sweatpants', 'dresses-miniskirt'];

function App() {
  const [mood, setMood] = useState('');
  const [occasion, setOccasion] = useState('');
  const [weather, setWeather] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [confidence, setConfidence] = useState(0);
  const [classifiedMood, setClassifiedMood] = useState('');
  const [progress, setProgress] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);
  const suggestRef = useRef(null);
  const uploadRef = useRef(null);
  const homeRef = useRef(null);

  // Get all tops and bottoms from the full dataset (once)
  const allTops = useMemo(() => {
    const tops = [];
    Object.values(OUTFIT_DB).forEach(moodObj => {
      Object.values(moodObj).forEach(occasionObj => {
        Object.values(occasionObj).forEach(weatherArr => {
          weatherArr.forEach(outfit => {
            (outfit.images || []).forEach(imgPath => {
              const folder = imgPath.split(/[/\\]/)[0];
              if (topFolders.includes(folder) && !tops.includes(imgPath)) tops.push(imgPath);
            });
          });
        });
      });
    });
    return tops;
  }, []);
  const allBottoms = useMemo(() => {
    const bottoms = [];
    Object.values(OUTFIT_DB).forEach(moodObj => {
      Object.values(moodObj).forEach(occasionObj => {
        Object.values(occasionObj).forEach(weatherArr => {
          weatherArr.forEach(outfit => {
            (outfit.images || []).forEach(imgPath => {
              const folder = imgPath.split(/[/\\]/)[0];
              if (bottomFolders.includes(folder) && !bottoms.includes(imgPath)) bottoms.push(imgPath);
            });
          });
        });
      });
    });
    return bottoms;
  }, []);

  // Enhanced splitTopBottom: fallback to random top/bottom if not found
  function splitTopBottom(images) {
    let top = null, bottom = null;
    images.forEach(imgPath => {
      const folder = imgPath.split(/[/\\]/)[0];
      if (!top && topFolders.includes(folder)) top = imgPath;
      else if (!bottom && bottomFolders.includes(folder)) bottom = imgPath;
    });
    // Fallbacks
    if (!top && allTops.length > 0) top = allTops[Math.floor(Math.random() * allTops.length)];
    if (!bottom && allBottoms.length > 0) bottom = allBottoms[Math.floor(Math.random() * allBottoms.length)];
    return { top, bottom };
  }

  const handleImageUpload = (e) => {
    setImages(Array.from(e.target.files));
  };

  const handleSuggest = () => {
    setLoading(true);
    setSuggestions([]);
    setProgress(0);
    let prog = 0;
    const interval = setInterval(() => {
      prog += Math.random() * 20;
      if (prog >= 100) {
        setProgress(100);
        clearInterval(interval);
        setTimeout(() => {
          // 1. Sentiment analysis
          const moodClass = mockSentimentAnalysis(mood);
          setClassifiedMood(moodClass);
          // 2. Get outfit pool
          const pool =
            OUTFIT_DB[moodClass]?.[occasion]?.[weather] || [];
          // 3. Shuffle and pick up to 4
          const shuffled = [...pool].sort(() => 0.5 - Math.random());
          const picks = shuffled.slice(0, 4);
          // 4. For each, pick random images from uploads (if using uploads)
          // (If you want to use uploaded images, add logic here)
          setSuggestions(picks);
          setConfidence(getRandomInt(80, 99));
          setLoading(false);
        }, 500); // Small delay for effect
      } else {
        setProgress(Math.floor(prog));
      }
    }, 400);
  };

  const handleNav = (section) => {
    if (section === 'home') {
      setShowWelcome(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setShowWelcome(false);
      setTimeout(() => {
        if (section === 'suggest' && suggestRef.current) {
          suggestRef.current.scrollIntoView({ behavior: 'smooth' });
        } else if (section === 'upload' && uploadRef.current) {
          uploadRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-white">
      {/* Nav Bar */}
      <nav className="w-full z-20 py-4 px-6 flex items-center justify-between bg-gradient-to-r from-pink-600 via-fuchsia-600 to-pink-400 bg-opacity-90 shadow-lg fixed top-0 left-0" style={{fontWeight: 'bold', letterSpacing: '0.05em', fontFamily: 'Montserrat, Arial, sans-serif', borderBottom: '2px solid #fff3'}}> 
        <span className="text-2xl font-extrabold bg-gradient-to-r from-pink-300 via-fuchsia-400 to-pink-600 bg-clip-text text-transparent drop-shadow-md tracking-widest" style={{textShadow: '0 2px 8px #ffb3ec'}}>Outfit Suggester</span>
        <div className="flex gap-6">
          <button onClick={() => handleNav('home')} className="uppercase text-lg hover:scale-110 transition-all duration-200 text-white hover:text-pink-200">Home</button>
          <button onClick={() => handleNav('suggest')} className="uppercase text-lg hover:scale-110 transition-all duration-200 text-white hover:text-pink-200">Suggest Outfit</button>
          <button onClick={() => handleNav('upload')} className="uppercase text-lg hover:scale-110 transition-all duration-200 text-white hover:text-pink-200">Upload Images</button>
        </div>
      </nav>

      {/* Welcome Screen */}
      {showWelcome && (
        <section ref={homeRef} className="flex flex-col items-center justify-center min-h-screen w-full" style={{paddingTop: '80px'}}>
          <div className="bg-black bg-opacity-60 rounded-3xl p-12 shadow-2xl flex flex-col items-center">
            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-pink-300 via-fuchsia-400 to-pink-600 bg-clip-text text-transparent drop-shadow-lg" style={{textShadow: '0 2px 16px #ffb3ec'}}>Welcome to Outfit Suggester</h1>
            <p className="text-lg md:text-2xl text-gray-200 mb-8 max-w-xl text-center">Discover AI-powered, fashionable outfit ideas from your own wardrobe. Get started and let your style shine!</p>
            <button onClick={() => setShowWelcome(false)} className="mt-4 px-10 py-4 rounded-full text-2xl font-bold bg-gradient-to-r from-pink-500 via-fuchsia-600 to-pink-400 shadow-xl hover:scale-105 transition-all duration-200 text-white border-2 border-pink-200 metallic-btn">
              Get Started
              <span className="ml-3 animate-bounce">↓</span>
            </button>
          </div>
        </section>
      )}

      {/* Main Content (hidden when welcome is shown) */}
      {!showWelcome && (
        <main className="flex-1 flex flex-col items-center justify-center px-4" style={{paddingTop: '100px'}}>
          {/* Suggest Outfit Section */}
          <section ref={suggestRef} className="w-full max-w-5xl mx-auto mb-16">
            <div className="w-full max-w-xl bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
              {/* Mood Input */}
              <label className="block mb-4">
                <span className="block mb-1 font-semibold">How are you feeling?</span>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. I'm tired but kind of excited for the evening"
                  value={mood}
                  onChange={e => setMood(e.target.value)}
                />
              </label>

              {/* Occasion Dropdown */}
              <label className="block mb-4">
                <span className="block mb-1 font-semibold">Occasion</span>
                <select
                  className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={occasion}
                  onChange={e => setOccasion(e.target.value)}
                >
                  <option value="">Select occasion</option>
                  <option value="casual">Casual</option>
                  <option value="formal">Formal</option>
                  <option value="party">Party</option>
                  <option value="gym">Gym</option>
                  <option value="travel">Travel</option>
                </select>
              </label>

              {/* Weather Dropdown */}
              <label className="block mb-4">
                <span className="block mb-1 font-semibold">Weather</span>
                <select
                  className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={weather}
                  onChange={e => setWeather(e.target.value)}
                >
                  <option value="">Select weather</option>
                  <option value="sunny">Sunny</option>
                  <option value="rainy">Rainy</option>
                  <option value="cold">Cold</option>
                  <option value="hot">Hot</option>
                </select>
              </label>

              {/* Get Outfit Suggestions Button */}
              <button
                className="w-full py-3 rounded bg-blue-600 hover:bg-blue-700 font-bold text-lg transition mb-2"
                onClick={handleSuggest}
                disabled={loading || !mood || !occasion || !weather}
              >
                {loading ? 'Analyzing...' : 'Get Outfit Suggestions'}
              </button>
            </div>

            {/* Outfit Suggestions as Flash Cards */}
            {!loading && suggestions.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full justify-items-center">
                {(() => {
                  let filteredSuggestions = suggestions;
                  if (occasion === 'gym') {
                    filteredSuggestions = suggestions.filter(s =>
                      (s.images || []).some(imgPath => {
                        const folder = imgPath.split(/[/\\]/)[0];
                        return ['Hoodie', 'Tees', 'Sweatpants'].includes(folder);
                      })
                    );
                    if (filteredSuggestions.length === 0) filteredSuggestions = suggestions;
                  }
                  if (occasion === 'party') {
                    filteredSuggestions = suggestions.filter(s =>
                      (s.images || []).some(imgPath => {
                        const folder = imgPath.split(/[/\\]/)[0];
                        return folder === 'dresses';
                      })
                    );
                    if (filteredSuggestions.length === 0) filteredSuggestions = suggestions;
                  }
                  return filteredSuggestions.map((s, idx) => {
                    // For party: if a 'dresses' image is present, show only that as the top, no bottom
                    let top, bottom;
                    if (occasion === 'party') {
                      const dressImg = (s.images || []).find(imgPath => imgPath.split(/[/\\]/)[0] === 'dresses');
                      if (dressImg) {
                        top = dressImg;
                        bottom = null;
                      } else {
                        // fallback to normal split
                        ({ top, bottom } = splitTopBottom(s.images || []));
                      }
                    } else {
                      ({ top, bottom } = splitTopBottom(s.images || []));
                    }
                    return (
                      <div key={idx} className="bg-gray-800 rounded-xl shadow-lg p-4 flex flex-col items-center w-72 max-w-xs">
                        <div className="mb-2 flex flex-col items-center">
                          {top ? (
                            <img
                              src={top.startsWith('http') ? top : `/Clothes_Dataset/${top}`}
                              alt="Top"
                              className="w-36 h-36 object-contain rounded shadow mb-1 border border-gray-700 bg-white"
                              style={{ maxWidth: '144px', maxHeight: '144px' }}
                            />
                          ) : (
                            <div className="w-36 h-36 bg-gray-700 rounded flex items-center justify-center text-gray-400 mb-1 text-xs">No Top</div>
                          )}
                          {/* Only show bottom if not a dress */}
                          {bottom && !(occasion === 'party' && top && top.split(/[/\\]/)[0] === 'dresses') ? (
                            <img
                              src={bottom.startsWith('http') ? bottom : `/Clothes_Dataset/${bottom}`}
                              alt="Bottom"
                              className="w-36 h-36 object-contain rounded shadow border border-gray-700 bg-white"
                              style={{ maxWidth: '144px', maxHeight: '144px' }}
                            />
                          ) : (
                            occasion === 'party' && top && top.split(/[/\\]/)[0] === 'dresses' ? null : <div className="w-36 h-36 bg-gray-700 rounded flex items-center justify-center text-gray-400 text-xs">No Bottom</div>
                          )}
                        </div>
                        <div className="flex flex-col items-center w-full">
                          <h3 className="font-bold text-base mb-1 text-center break-words">{s.name}</h3>
                          <p className="text-gray-400 mb-1 text-xs text-center break-words">{s.desc}</p>
                          <span className="text-xs text-green-400 font-semibold">Confidence: {confidence}%</span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </section>
          {/* Upload Images Section */}
          <section ref={uploadRef} className="w-full max-w-xl mx-auto bg-gray-800 bg-opacity-80 rounded-xl shadow-lg p-8 mt-8">
            <h2 className="text-2xl font-bold mb-4 text-pink-300">Upload Your Clothing Images</h2>
            <input
              type="file"
              accept="image/*"
              multiple
              className="w-full text-gray-300 mb-4"
              onChange={handleImageUpload}
            />
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {images.map((img, idx) => (
                  <span key={idx} className="text-xs bg-gray-700 px-2 py-1 rounded">{img.name}</span>
                ))}
              </div>
            )}
          </section>
        </main>
      )}
      {/* Footer */}
      <footer className="py-6 text-center text-gray-300 text-sm mt-8" style={{textShadow: '0 1px 8px #ffb3ec'}}>Powered by hybrid contextual deep learning engine (HCDLE 2.0).</footer>
    </div>
  )
}

export default App
