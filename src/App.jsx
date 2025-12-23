import React, { useState } from 'react';
import { Upload, User, Book, AlertCircle, Download } from 'lucide-react';
import JSZip from 'jszip';

const EpubCharacterAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [characters, setCharacters] = useState([]);
  const [error, setError] = useState('');

  const descriptorPatterns = {
    body: [
      'fat', 'obese', 'overweight', 'chubby', 'plump', 'heavyset', 'stout', 'rotund', 'large', 'thick',
      'thin', 'skinny', 'scrawny', 'slender', 'slim', 'lean', 'bony', 'gaunt', 'petite', 'lanky',
      'curvy', 'voluptuous', 'shapely', 'hourglass', 'waif-like', 'athletic', 'toned', 'muscular'
    ],
    chest: [
      'A cup', 'B cup', 'C cup', 'D cup', 'DD cup', 'E cup', 'F cup', 'G cup', 'H cup',
      'big breasts', 'large breasts', 'huge breasts', 'heaving bosom', 'ample chest',
      'small breasts', 'flat-chested', 'busty', 'well-endowed', 'cleavage', 'perky breasts'
    ],
    clothing: [
      'shirt', 'pants', 'trousers', 'jeans', 'dress', 'skirt', 'blouse', 'jacket', 'coat', 'sweater',
      'suit', 'gown', 'uniform', 'lingerie', 'underwear', 'bra', 'panties', 'stockings', 'socks',
      'boots', 'shoes', 'heels', 'sneakers', 'hat', 'cap', 'gloves', 'scarf', 'tie', 'belt'
    ],
    indianClothing: [
      'sari', 'saree', 'kurta', 'kurti', 'salwar', 'kameez', 'lehenga', 'choli', 'dupatta',
      'dhoti', 'lungi', 'sherwani', 'anarkali', 'ghagra', 'pajama', 'turban', 'pagri'
    ],
    face: ['beautiful', 'handsome', 'pretty', 'attractive', 'ugly', 'round face', 'chiseled', 'sharp features'],
    hair: ['blonde', 'brunette', 'black hair', 'red hair', 'long hair', 'short hair', 'curly', 'straight'],
    skin: ['pale', 'fair', 'dark', 'tan', 'olive', 'brown', 'ebony', 'ivory', 'porcelain']
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
    const common = new Set(['The', 'And', 'But', 'Not', 'Chapter', 'Part', 'Book', 'Page', 'Sir', 'Lady', 'Lord', 'King', 'Queen', 'Doctor', 'Professor', 'Captain']);
    return common.has(word);
  };

  const extractNames = (text) => {
    const namePattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g;
    const counts = {};
    const matches = text.match(namePattern) || [];
    matches.forEach(name => {
      if (name.length > 2 && !isCommonWord(name)) counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).filter(([_, c]) => c >= 3).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([n]) => n);
  };

  const findDescriptions = (text, name) => {
    const sentences = text.split(/[.!?]+\s+/);
    const descriptions = new Set();
    sentences.forEach((s) => {
      if (new RegExp(`\\b${name}\\b`, 'i').test(s)) {
        if (allDescriptors.some(d => s.toLowerCase().includes(d.toLowerCase()))) {
          descriptions.add(s.trim());
        }
      }
    });
    return Array.from(descriptions).slice(0, 10);
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

  const categoryLabels = {
    body: 'Body Type',
    chest: 'Breast/Chest Detail',
    clothing: 'Western Clothing',
    indianClothing: 'Indian Attire',
    face: 'Facial Features',
    hair: 'Hair',
    skin: 'Skin Tone'
  };

  return (
    <div className="min-h-screen p-8 bg-zinc-50 font-sans">
      <div className="max-w-5xl mx-auto bg-white shadow-2xl rounded-3xl p-10">
        <div className="flex items-center gap-5 mb-10 border-b pb-6">
          <Book className="w-12 h-12 text-indigo-600" />
          <div>
            <h1 className="text-4xl font-black text-zinc-900 tracking-tight">EPUB Character Profiler</h1>
            <p className="text-zinc-500 font-medium">Extracting physical traits, clothing, and body details.</p>
          </div>
        </div>

        <label className="block border-4 border-dashed border-indigo-50 rounded-2xl p-16 text-center cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/50 transition-all group">
          <Upload className="mx-auto w-14 h-14 text-indigo-300 mb-4 group-hover:scale-110 transition-transform" />
          <span className="text-xl font-bold text-zinc-700">{file ? file.name : "Drop EPUB here or click to browse"}</span>
          <input type="file" className="hidden" accept=".epub" onChange={handleFileUpload} />
        </label>

        {analyzing && <div className="mt-12 text-center animate-pulse text-indigo-600 font-black text-xl">Scanning text for physical details...</div>}
        {error && <div className="mt-8 p-5 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 font-bold border border-red-100"><AlertCircle /> {error}</div>}

        <div className="mt-12 space-y-10">
          {characters.map((char, i) => (
            <div key={i} className="border border-zinc-100 rounded-3xl p-8 bg-zinc-50/50 hover:bg-white hover:shadow-xl transition-all">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-3xl font-black text-indigo-950 uppercase tracking-tighter">{char.name}</h2>
                <span className="bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold">{char.count} Match(es)</span>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-8">
                {Object.keys(char.categorized).map(cat => (
                  <span key={cat} className="px-4 py-1.5 bg-white border border-indigo-100 text-indigo-700 text-xs font-black rounded-lg shadow-sm">
                    {categoryLabels[cat] || cat}
                  </span>
                ))}
              </div>

              <div className="space-y-4">
                {char.descriptions.map((d, j) => (
                  <div key={j} className="relative p-5 bg-white rounded-2xl shadow-sm border border-zinc-100">
                    <p className="text-zinc-800 leading-relaxed italic text-lg">"{d}"</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EpubCharacterAnalyzer;
