
import React, { useState } from 'react';
import { analyzeResume } from '../services/geminiService';
import { ResumeAnalysis as IAnalysis } from '../types';

const ResumeAnalysis: React.FC = () => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<IAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeResume(text);
      setAnalysis(result);
    } catch (err) {
      setError("AI analysis failed. Please check your API key.");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    return 'text-orange-600';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800 mb-2">AI ATS Analyzer</h3>
        <p className="text-sm text-slate-500 mb-6">Paste resume text below to generate scores and feedback.</p>
        
        <textarea
          className="w-full h-64 p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm mb-4 font-mono leading-relaxed"
          placeholder="Paste resume content here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        ></textarea>
        
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {text.length} characters | Approx {text.split(/\s+/).filter(w => w.length > 0).length} words
          </div>
          <button
            onClick={handleAnalyze}
            disabled={loading || !text.trim()}
            className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${
              loading 
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
            }`}
          >
            {loading ? 'AI Analyzing...' : 'Analyze Now'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-3">
          <span>⚠️</span> {error}
        </div>
      )}

      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Scores */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h4 className="font-bold text-slate-800 mb-6 flex items-center justify-between">
              Analysis Results
              <span className={`text-4xl font-black ${getScoreColor(analysis.overallScore)}`}>
                {analysis.overallScore}
              </span>
            </h4>
            
            <div className="space-y-6">
              {[
                { label: 'Keywords & Skills', value: analysis.keywordScore, color: 'bg-blue-500' },
                { label: 'Formatting & Layout', value: analysis.formattingScore, color: 'bg-indigo-500' },
                { label: 'Experience Depth', value: analysis.experienceScore, color: 'bg-purple-500' },
              ].map(s => (
                <div key={s.label}>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-slate-500">{s.label}</span>
                    <span className={getScoreColor(s.value)}>{s.value}/100</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className={`h-full ${s.color}`} style={{ width: `${s.value}%` }}></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <h5 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-tighter">AI Feedback</h5>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                "{analysis.feedback}"
              </p>
            </div>
          </div>

          {/* Action Tasks */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span>📋</span> Suggested CS Tasks
            </h4>
            
            <div className="space-y-4 flex-1">
              {analysis.suggestedTasks.map((task, idx) => (
                <div key={idx} className="flex gap-4 p-4 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors group">
                  <div className="w-6 h-6 rounded-full border-2 border-slate-200 flex-shrink-0 flex items-center justify-center text-[10px] group-hover:border-blue-400 group-hover:bg-blue-50">
                    {idx + 1}
                  </div>
                  <p className="text-sm text-slate-600 font-medium">{task}</p>
                </div>
              ))}
            </div>

            <button className="w-full mt-6 bg-slate-900 text-white py-3 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors">
              Convert to Project Tasks
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeAnalysis;
