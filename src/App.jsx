import React, { useState } from 'react';
import { Upload, User, Book, AlertCircle, Download } from 'lucide-react';
import JSZip from 'jszip';

const EpubCharacterAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [characters, setCharacters] = useState([]);
  const [error, setError] = useState('');

  const descriptorPatterns = {
    body: ['curvy', 'curvaceous', 'voluptuous', 'shapely', 'hourglass', 'petite', 'slender', 'slim', 'thin', 'skinny', 'gaunt', 'lean', 'athletic', 'muscular', 'toned', 'fit', 'buff', 'ripped', 'stocky', 'burly', 'heavyset', 'plump', 'chubby', 'overweight', 'obese', 'portly', 'stout', 'rotund', 'brawny', 'broad-shouldered', 'narrow-shouldered', 'willowy', 'lanky', 'gangly', 'scrawny', 'wiry', 'lithe', 'graceful', 'statuesque', 'imposing', 'compact', 'sturdy'],
    chest: ['big breasts', 'large breasts', 'small breasts', 'flat-chested', 'well-endowed', 'busty', 'ample bosom', 'full-figured', 'buxom', 'large bust', 'small bust', 'generous bust', 'modest bust', 'full chest', 'barrel-chested', 'broad chest', 'narrow chest', 'deep chest', 'flat chest', 'muscular chest', 'hairy chest'],
    height: ['tall', 'short', 'towering', 'diminutive', 'giant', 'tiny', 'average height', 'medium height', 'six feet', 'five feet', 'over six feet', 'under five feet', 'vertically challenged'],
    hair: ['blonde', 'brunette', 'redhead', 'ginger', 'auburn', 'black hair', 'dark hair', 'light hair', 'brown hair', 'gray hair', 'grey hair', 'white hair', 'silver hair', 'salt and pepper', 'graying', 'greying', 'bald', 'balding', 'long hair', 'short hair', 'shoulder-length', 'waist-length', 'cropped', 'buzz cut', 'crew cut', 'curly', 'straight', 'wavy', 'kinky', 'frizzy', 'silky', 'coarse', 'fine', 'thick', 'thin hair', 'ponytail', 'braid', 'braided', 'dreadlocks', 'afro', 'mohawk', 'bob cut'],
    eyes: ['blue eyes', 'green eyes', 'brown eyes', 'hazel eyes', 'gray eyes', 'grey eyes', 'amber eyes', 'dark eyes', 'light eyes', 'bright eyes', 'pale eyes', 'piercing eyes', 'almond-shaped', 'round eyes', 'close-set', 'wide-set', 'deep-set', 'hooded eyes', 'droopy eyes', 'upturned eyes', 'downturned eyes'],
    skin: ['pale', 'fair', 'light', 'dark', 'tan', 'tanned', 'olive', 'bronze', 'ebony', 'ivory', 'porcelain', 'creamy', 'ruddy', 'rosy', 'sallow', 'freckled', 'spotted', 'blemished', 'clear skin', 'smooth skin', 'rough skin', 'weathered', 'wrinkled', 'sun-kissed', 'alabaster'],
    face: ['beautiful', 'handsome', 'pretty', 'attractive', 'gorgeous', 'stunning', 'striking', 'plain', 'homely', 'ugly', 'round face', 'oval face', 'square face', 'heart-shaped', 'angular', 'chiseled', 'soft features', 'sharp features', 'high cheekbones', 'prominent cheekbones', 'hollow cheeks', 'chubby cheeks', 'dimples', 'dimpled', 'strong jaw', 'weak chin', 'square jaw', 'pointed chin', 'cleft chin', 'double chin', 'full lips', 'thin lips', 'pouty lips', 'wide mouth', 'small mouth', 'crooked smile', 'big nose', 'small nose', 'aquiline nose', 'button nose', 'hooked nose', 'Roman nose', 'snub nose', 'thick eyebrows', 'thin eyebrows', 'arched eyebrows', 'bushy eyebrows', 'unibrow'],
    facialHair: ['beard', 'bearded', 'goatee', 'mustache', 'moustache', 'clean-shaven', 'stubble', 'five o\'clock shadow', 'sideburns', 'mutton chops', 'full beard', 'scraggly beard', 'neatly trimmed'],
    bodyParts: ['long legs', 'short legs', 'thick thighs', 'thin legs', 'muscular legs', 'shapely legs', 'skinny legs', 'long arms', 'short arms', 'muscular arms', 'thin arms', 'hairy arms', 'big hands', 'small hands', 'delicate hands', 'rough hands', 'calloused', 'slender fingers', 'thick fingers', 'small feet', 'large feet', 'dainty feet', 'broad hips', 'narrow hips', 'wide hips', 'child-bearing hips', 'flat stomach', 'toned stomach', 'pot belly', 'six-pack', 'abs', 'love handles', 'round bottom', 'flat bottom', 'pert behind', 'wide rear', 'muscular buttocks', 'thick neck', 'long neck', 'swan neck', 'bull neck'],
    age: ['young', 'old', 'elderly', 'ancient', 'youthful', 'middle-aged', 'mature', 'aging', 'ageless', 'teenage', 'adolescent', 'twenties', 'thirties', 'forties', 'fifties', 'sixties', 'seventies'],
    marks: ['scar', 'scarred', 'birthmark', 'mole', 'tattoo', 'tattooed', 'piercing', 'pierced', 'missing tooth', 'gold tooth', 'crooked teeth', 'perfect teeth', 'gap-toothed'],
    overall: ['well-groomed', 'disheveled', 'unkempt', 'scruffy', 'neat', 'tidy', 'messy', 'elegant', 'refined', 'rugged', 'delicate', 'feminine', 'masculine', 'androgynous', 'boyish', 'girlish', 'matronly', 'distinguished']
  };

  const allDescriptors = Object.values(descriptorPatterns).flat();

  const parseEpub = async (file) => {
    const zip = new JSZip();
    const content = await zip.loadAsync(file);
    let textContent = '';
    
    const htmlFiles = Object.keys(content.files).filter(name => 
      (name.match(/\.(xhtml|html|htm)$/i)) && 
      !name.includes('nav') && !name.includes('toc') && !name.includes('cover')
    ).sort();
    
    for (const filename of htmlFiles) {
      const text = await content.files[filename].async('text');
      const doc = new DOMParser().parseFromString(text, 'text/html');
      doc.querySelectorAll('script, style').forEach(el => el.remove());
      textContent += (doc.body?.textContent || '') + '\n\n';
    }
    return textContent;
  };

  const isCommonWord = (word) => {
    const common = new Set(['The', 'And', 'But', 'Not', 'Chapter', 'Part', 'Book', 'Page', 'Sir', 'Lady', 'Lord', 'King', 'Queen', 'Doctor', 'Professor', 'Captain', 'Please', 'Thank']);
    return common.has(word);
  };

  const extractNames = (text) => {
    const namePattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g;
    const counts = {};
    const matches = text.match(namePattern) || [];
    matches.forEach(name => {
      if (name.length > 2 && !isCommonWord(name)) counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).filter(([_, c]) => c >= 3).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([n]) => n);
  };

  const findDescriptions = (text, name) => {
    const sentences = text.split(/[.!?]+\s+/);
    const descriptions = new Set();
    sentences.forEach((s, idx) => {
      if (new RegExp(`\\b${name}\\b`, 'i').test(s)) {
        if (allDescriptors.some(d => s.toLowerCase().includes(d.toLowerCase()))) {
          descriptions.add(s.trim());
        }
      }
    });
    return Array.from(descriptions).slice(0, 5);
  };

  const categorizeDescriptions = (descriptions) => {
    const res = {};
    descriptions.forEach(desc => {
      Object.entries(descriptorPatterns).forEach(([cat, list]) => {
        if (list.some(d => desc.toLowerCase().includes(d.toLowerCase()))) {
          if (!res[cat]) res[cat] = new Set();
          res[cat].add(desc);
        }
      });
    });
    return Object.fromEntries(Object.entries(res).map(([k, v]) => [k, Array.from(v)]));
  };

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile || !uploadedFile.name.endsWith('.epub')) {
      setError('Please upload a valid EPUB file');
      return;
    }
    setFile(uploadedFile);
    setError('');
    setAnalyzing(true);
    try {
      const text = await parseEpub(uploadedFile);
      const names = extractNames(text);
      const data = names.map(name => {
        const descriptions = findDescriptions(text, name);
        return { name, descriptions, categorized: categorizeDescriptions(descriptions), count: descriptions.length };
      }).filter(c => c.count > 0);
      setCharacters(data);
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-slate-50">
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl p-8">
        <div className="flex items-center gap-4 mb-8">
          <Book className="w-10 h-10 text-blue-600" />
          <h1 className="text-4xl font-extrabold text-slate-800">Character Physical Analyzer</h1>
        </div>

        <label className="block border-4 border-dashed border-blue-100 rounded-xl p-12 text-center cursor-pointer hover:bg-blue-50 transition-all">
          <Upload className="mx-auto w-12 h-12 text-blue-400 mb-4" />
          <span className="text-lg font-medium text-slate-600">{file ? file.name : "Select an EPUB book"}</span>
          <input type="file" className="hidden" accept=".epub" onChange={handleFileUpload} />
        </label>

        {analyzing && <div className="mt-8 text-center animate-pulse text-blue-600 font-bold">Reading book and extracting physical traits...</div>}
        {error && <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2"><AlertCircle /> {error}</div>}

        <div className="mt-10 space-y-6">
          {characters.map((char, i) => (
            <div key={i} className="border border-slate-200 rounded-xl p-6 bg-white hover:shadow-md transition-shadow">
              <h2 className="text-2xl font-bold text-blue-900 mb-2">{char.name}</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.keys(char.categorized).map(cat => (
                  <span key={cat} className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold uppercase rounded-full">{cat}</span>
                ))}
              </div>
              <ul className="space-y-3">
                {char.descriptions.map((d, j) => (
                  <li key={j} className="text-slate-700 italic border-l-4 border-blue-200 pl-4">"{d}"</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EpubCharacterAnalyzer;
