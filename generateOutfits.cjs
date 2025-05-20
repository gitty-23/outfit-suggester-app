const fs = require('fs');
const path = require('path');

// CONFIGURABLE: Path to your dataset
const DATASET_PATH = 'C:/Users/Shivani/outfit-suggester-app/public/Clothes_Dataset';

// Define moods, occasions, and weathers
const moods = ['happy', 'sad', 'angry', 'neutral'];
const occasions = ['casual', 'formal', 'party', 'gym', 'travel'];
const weathers = ['sunny', 'rainy', 'cold', 'hot'];

// Color and style keywords
const brightColors = ['white', 'yellow', 'pink', 'light', 'pearl', 'blue', 'green', 'orange', 'red'];
const darkColors = ['black', 'navy', 'brown', 'grey', 'gray', 'dark', 'maroon'];
const baggyKeywords = ['oversized', 'long', 'parka', 'jacket', 'coat', 'sweater', 'hoodie'];
const slimKeywords = ['fit', 'mini', 'slim', 'short', 'dress', 'gown'];

// Folder to occasion/season mapping
const folderMap = {
  'Sweater': { occasion: 'casual', weather: ['cold', 'rainy'], moods: ['sad', 'angry', 'neutral'] },
  'dresses-miniskirt': { occasion: 'party', weather: ['sunny', 'hot'], moods: ['happy', 'neutral'] },
  'Polo': { occasion: 'formal', weather: ['sunny', 'hot'], moods: ['happy', 'neutral'] },
  'coats': { occasion: 'formal', weather: ['cold', 'rainy'], moods: ['sad', 'angry', 'neutral'] },
  'Shirts': { occasion: 'formal', weather: ['sunny', 'rainy', 'cold'], moods: ['happy', 'neutral', 'sad'] },
  'Tees': { occasion: 'casual', weather: ['sunny', 'hot'], moods: ['happy', 'neutral'] },
  'Jeans': { occasion: 'casual', weather: ['cold', 'sunny'], moods: ['happy', 'neutral', 'sad'] },
  'Jaket_Olahraga': { occasion: 'casual', weather: ['cold', 'rainy'], moods: ['sad', 'angry', 'neutral'] },
  'Jaket_Denim': { occasion: 'casual', weather: ['cold', 'rainy'], moods: ['sad', 'angry', 'neutral'] },
  'Jaket': { occasion: 'casual', weather: ['cold', 'rainy'], moods: ['sad', 'angry', 'neutral'] },
  'Hoodie': { occasion: 'casual', weather: ['cold', 'rainy'], moods: ['sad', 'angry', 'neutral'] },
  'Gaun': { occasion: 'party', weather: ['sunny', 'hot'], moods: ['happy', 'neutral'] },
  'casual shorts': { occasion: 'casual', weather: ['sunny', 'hot'], moods: ['happy', 'neutral'] },
  'Sweatpants': { occasion: 'casual', weather: ['cold', 'rainy'], moods: ['sad', 'angry', 'neutral'] },
  'Blazer': { occasion: 'formal', weather: ['cold', 'rainy'], moods: ['happy', 'neutral', 'sad', 'angry'] },
};

// Helper to check if a string contains any keyword
function containsAny(str, arr) {
  return arr.some((kw) => str.includes(kw));
}

// Scan dataset
function scanDataset() {
  const outfits = {};
  moods.forEach((mood) => {
    outfits[mood] = {};
    occasions.forEach((occasion) => {
      outfits[mood][occasion] = {};
      weathers.forEach((weather) => {
        outfits[mood][occasion][weather] = [];
      });
    });
  });

  const folders = fs.readdirSync(DATASET_PATH, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  // Collect all items with their attributes
  let allItems = [];
  folders.forEach((folder) => {
    const folderPath = path.join(DATASET_PATH, folder);
    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
    files.forEach((file) => {
      const lower = file.toLowerCase();
      const color = containsAny(lower, brightColors) ? 'bright' : containsAny(lower, darkColors) ? 'dark' : 'neutral';
      const style = containsAny(lower, baggyKeywords) ? 'baggy' : containsAny(lower, slimKeywords) ? 'slim' : 'normal';
      allItems.push({
        name: file,
        folder,
        color,
        style,
        path: path.join(folder, file),
      });
    });
  });

  // For each combination, pick 5-7 random outfits
  moods.forEach((mood) => {
    occasions.forEach((occasion) => {
      weathers.forEach((weather) => {
        // Filter items that match the logic
        let filtered = allItems.filter(item => {
          // Folder mapping
          const map = folderMap[item.folder] || {};
          // Mood
          if (map.moods && !map.moods.includes(mood)) return false;
          // Occasion
          if (map.occasion && map.occasion !== occasion) return false;
          // Weather
          if (map.weather && !map.weather.includes(weather)) return false;
          // Mood-color logic
          if (mood === 'happy' && item.color === 'dark') return false;
          if ((mood === 'sad' || mood === 'angry') && item.color === 'bright') return false;
          // Style logic
          if ((mood === 'sad' || mood === 'angry') && item.style === 'slim') return false;
          if (mood === 'happy' && item.style === 'baggy') return false;
          return true;
        });
        // Shuffle and group into outfits (2-3 items per outfit)
        let outfitsArr = [];
        for (let i = 0; i < 7; i++) {
          let count = Math.floor(Math.random() * 2) + 2; // 2 or 3
          let chosen = filtered.sort(() => 0.5 - Math.random()).slice(0, count);
          if (chosen.length > 0) {
            outfitsArr.push({
              name: `Outfit ${i + 1}`,
              desc: `Auto-generated for ${mood}, ${occasion}, ${weather}`,
              items: count,
              images: chosen.map(c => c.path),
            });
          }
        }
        // Only keep 5-7 outfits
        outfits[mood][occasion][weather] = outfitsArr.slice(0, 7);
        // Fallback: if no outfits, pick 1-2 random from allItems
        if (outfitsArr.length === 0) {
          console.log(`No outfits for: mood=${mood}, occasion=${occasion}, weather=${weather}. Using fallback.`);
          for (let i = 0; i < 2; i++) {
            let count = Math.min(Math.floor(Math.random() * 2) + 2, allItems.length); // 2 or 3
            let chosen = allItems.sort(() => 0.5 - Math.random()).slice(0, count);
            let unique = [...new Set(chosen.map(c => c.path))];
            if (unique.length > 0) {
              outfits[mood][occasion][weather].push({
                name: `Fallback Outfit ${i + 1}`,
                desc: `Fallback: Auto-generated for ${mood}, ${occasion}, ${weather}`,
                items: unique.length,
                images: unique,
              });
            }
          }
        }
      });
    });
  });
  return outfits;
}

// MAIN
const result = scanDataset();
fs.writeFileSync('outfit_db_generated.js', 'export const OUTFIT_DB = ' + JSON.stringify(result, null, 2) + ';\n');
console.log('Generated outfit_db_generated.js! Paste the OUTFIT_DB into your React app.'); 