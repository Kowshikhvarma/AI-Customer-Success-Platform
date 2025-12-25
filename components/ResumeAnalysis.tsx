
import React, { useState } from 'react';
import { analyzeResume, optimizeResume } from '../services/geminiService';
import { jsPDF } from 'jspdf';

interface IAnalysis {
  keywordScore: number;
  formattingScore: number;
  experienceScore: number;
  overallScore: number;
  feedback: string;
  missingKeywords: string[];
  suggestedTasks: string[];
}

interface IStructuredResume {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    linkedin?: string;
    github?: string;
    location?: string;
  };
  education: Array<{
    institution: string;
    location: string;
    degree: string;
    dates: string;
  }>;
  experience: Array<{
    company: string;
    location: string;
    title: string;
    dates: string;
    bullets: string[];
  }>;
  projects: Array<{
    name: string;
    technologies: string;
    bullets: string[];
  }>;
  skills: Array<{
    category: string;
    items: string[];
  }>;
}

interface IOptimization {
  structuredResume: IStructuredResume;
  keyImprovements: string[];
  predictedScore: number;
}

const ResumeAnalysis: React.FC = () => {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [analysis, setAnalysis] = useState<IAnalysis | null>(null);
  const [optimization, setOptimization] = useState<IOptimization | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const handleAnalyze = async () => {
    if (!resumeText.trim() || !jobDescription.trim()) return;
    setLoading(true);
    setError(null);
    setOptimization(null);
    try {
      const result = await analyzeResume(resumeText, jobDescription);
      setAnalysis(result);
    } catch (err) {
      setError("AI analysis failed. Please check your API key and connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async () => {
    if (!resumeText.trim() || !jobDescription.trim()) return;
    setOptimizing(true);
    setError(null);
    try {
      const result = await optimizeResume(resumeText, jobDescription);
      setOptimization(result);
      setTimeout(() => {
        document.getElementById('optimization-result')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error(err);
      setError("Resume optimization failed. Please try again.");
    } finally {
      setOptimizing(false);
    }
  };

  const downloadAsPDF = () => {
    if (!optimization?.structuredResume) return;
    setDownloading(true);
    
    try {
      const { structuredResume } = optimization;
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'pt',
        format: 'letter'
      });

      const margin = 40;
      const pageWidth = doc.internal.pageSize.getWidth();
      let cursorY = 40;

      const drawLine = () => {
        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.line(margin, cursorY, pageWidth - margin, cursorY);
        cursorY += 12;
      };

      // Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text(structuredResume.personalInfo?.name || "Candidate Name", pageWidth / 2, cursorY, { align: 'center' });
      cursorY += 18;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const contactParts = [
        structuredResume.personalInfo?.phone,
        structuredResume.personalInfo?.email,
        structuredResume.personalInfo?.linkedin,
        structuredResume.personalInfo?.github,
        structuredResume.personalInfo?.location
      ].filter(Boolean);
      doc.text(contactParts.join(' | '), pageWidth / 2, cursorY, { align: 'center' });
      cursorY += 25;

      // Section: Education
      if (structuredResume.education && structuredResume.education.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("EDUCATION", margin, cursorY);
        cursorY += 4;
        drawLine();

        structuredResume.education.forEach(edu => {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.text(edu.institution || "", margin, cursorY);
          doc.setFont("helvetica", "normal");
          doc.text(edu.location || "", pageWidth - margin, cursorY, { align: 'right' });
          cursorY += 12;
          doc.setFont("helvetica", "italic");
          doc.text(edu.degree || "", margin, cursorY);
          doc.setFont("helvetica", "normal");
          doc.text(edu.dates || "", pageWidth - margin, cursorY, { align: 'right' });
          cursorY += 20;
        });
      }

      // Section: Experience
      if (structuredResume.experience && structuredResume.experience.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("EXPERIENCE", margin, cursorY);
        cursorY += 4;
        drawLine();

        structuredResume.experience.forEach(exp => {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.text(exp.company || "", margin, cursorY);
          doc.setFont("helvetica", "normal");
          doc.text(exp.location || "", pageWidth - margin, cursorY, { align: 'right' });
          cursorY += 12;
          doc.setFont("helvetica", "italic");
          doc.text(exp.title || "", margin, cursorY);
          doc.setFont("helvetica", "normal");
          doc.text(exp.dates || "", pageWidth - margin, cursorY, { align: 'right' });
          cursorY += 12;

          (exp.bullets || []).forEach(bullet => {
            doc.setFontSize(9);
            const splitBullet = doc.splitTextToSize(`• ${bullet}`, pageWidth - margin * 2 - 10);
            doc.text(splitBullet, margin + 5, cursorY);
            cursorY += (splitBullet.length * 11);
            
            if (cursorY > 750) {
              doc.addPage();
              cursorY = 40;
            }
          });
          cursorY += 8;
        });
      }

      // Section: Projects
      if (structuredResume.projects && structuredResume.projects.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("PROJECTS", margin, cursorY);
        cursorY += 4;
        drawLine();

        structuredResume.projects.forEach(proj => {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.text(proj.name || "", margin, cursorY);
          doc.setFont("helvetica", "italic");
          doc.text(` | ${proj.technologies || ""}`, margin + doc.getTextWidth(proj.name || ""), cursorY);
          cursorY += 12;

          (proj.bullets || []).forEach(bullet => {
            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            const splitBullet = doc.splitTextToSize(`• ${bullet}`, pageWidth - margin * 2 - 10);
            doc.text(splitBullet, margin + 5, cursorY);
            cursorY += (splitBullet.length * 11);
          });
          cursorY += 8;
        });
      }

      // Section: Technical Skills
      if (structuredResume.skills && structuredResume.skills.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("TECHNICAL SKILLS", margin, cursorY);
        cursorY += 4;
        drawLine();

        structuredResume.skills.forEach(skill => {
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.text(`${skill.category || "Skills"}: `, margin, cursorY);
          doc.setFont("helvetica", "normal");
          const itemsText = (skill.items || []).join(', ');
          doc.text(itemsText, margin + doc.getTextWidth(`${skill.category || "Skills"}: `), cursorY);
          cursorY += 12;
        });
      }

      doc.save(`${(structuredResume.personalInfo?.name || "Optimized").replace(/\s+/g, '_')}_Resume.pdf`);
    } catch (err) {
      console.error("PDF Export failed", err);
      setError("Failed to generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    return 'text-orange-600';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">🎯</span>
          <h3 className="text-xl font-bold text-slate-800">Professional Resume Styler</h3>
        </div>
        <p className="text-sm text-slate-500 mb-8">Optimize resumes and export them in the high-converting "Jake's Resume" format preferred by recruiters.</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Job Description</label>
            <textarea
              className="w-full h-80 p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-sans leading-relaxed bg-slate-50/30 shadow-inner"
              placeholder="Paste the target job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            ></textarea>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Resume Text</label>
            <textarea
              className="w-full h-80 p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono leading-relaxed bg-slate-50/30 shadow-inner"
              placeholder="Paste the candidate's resume text here..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
            ></textarea>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
          <div className="flex gap-6">
            <div className="text-[10px] text-slate-400 font-medium">
              JD: <span className="text-slate-600 font-bold">{jobDescription.split(/\s+/).filter(w => w.length > 0).length} words</span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              Resume: <span className="text-slate-600 font-bold">{resumeText.split(/\s+/).filter(w => w.length > 0).length} words</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAnalyze}
              disabled={loading || optimizing || !resumeText.trim() || !jobDescription.trim()}
              className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${
                loading 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
              }`}
            >
              {loading ? 'Analyzing...' : 'Analyze Match'}
            </button>
            <button
              onClick={handleOptimize}
              disabled={loading || optimizing || !resumeText.trim() || !jobDescription.trim()}
              className={`px-8 py-3 rounded-xl text-sm font-bold transition-all shadow-lg ${
                optimizing 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                : 'bg-slate-900 text-white hover:bg-black shadow-slate-200 active:scale-[0.98]'
              }`}
            >
              {optimizing ? (
                <span className="flex items-center gap-2">
                   <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Professional Redesign...
                </span>
              ) : '✨ Generate Recruiter-Ready PDF'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-3">
          <span className="text-lg">⚠️</span> {error}
        </div>
      )}

      {analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Match</span>
                    <span className={`text-6xl font-black ${getScoreColor(analysis.overallScore || 0)}`}>
                      {analysis.overallScore || 0}<span className="text-2xl">%</span>
                    </span>
                  </div>
               </div>

              <h4 className="font-bold text-slate-800 mb-8 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-sm">📊</span>
                Initial Analysis
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                {[
                  { label: 'Keywords', value: analysis.keywordScore || 0, color: 'bg-blue-500' },
                  { label: 'Formatting', value: analysis.formattingScore || 0, color: 'bg-indigo-500' },
                  { label: 'Experience', value: analysis.experienceScore || 0, color: 'bg-purple-500' },
                ].map(s => (
                  <div key={s.label} className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-end mb-3">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-tighter">{s.label}</span>
                      <span className={`text-xl font-bold ${getScoreColor(s.value)}`}>{s.value}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-1000 ease-out ${s.color}`} style={{ width: `${s.value}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  AI Strategic Overview
                </h5>
                <div className="p-5 bg-blue-50/30 border border-blue-100 rounded-2xl">
                  <p className="text-sm text-slate-700 leading-relaxed font-medium">{analysis.feedback || "No feedback provided."}</p>
                </div>
              </div>

              {analysis.missingKeywords && analysis.missingKeywords.length > 0 && (
                <div className="mt-8 space-y-4">
                  <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                    Missing Keywords
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {analysis.missingKeywords.map((kw, i) => (
                      <span key={i} className="px-3 py-1.5 bg-white border border-red-100 text-red-600 rounded-lg text-[10px] font-bold shadow-sm uppercase">
                        + {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center text-sm">📋</span>
              Action Plan
            </h4>
            <div className="space-y-4 flex-1">
              {(analysis.suggestedTasks || []).map((task, idx) => (
                <div key={idx} className="flex gap-4 p-4 rounded-xl border border-slate-100 hover:border-blue-200 transition-all group">
                  <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-200 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-slate-400 group-hover:text-blue-500 group-hover:border-blue-500">
                    {idx + 1}
                  </div>
                  <p className="text-xs text-slate-600 font-bold leading-relaxed">{task}</p>
                </div>
              ))}
            </div>
            {!optimization && (
              <button 
                onClick={handleOptimize}
                className="w-full mt-8 bg-slate-900 text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg"
              >
                🚀 Generate Optimized PDF
              </button>
            )}
          </div>
        </div>
      )}

      {optimization && (
        <div id="optimization-result" className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="bg-slate-900 rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden border border-slate-800">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
            
            <div className="flex flex-col lg:flex-row gap-12 relative z-10">
              <div className="lg:w-1/3 space-y-6">
                <div className="flex items-center gap-6 mb-8">
                   <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex flex-col items-center">
                      <span className="text-[8px] font-black text-slate-500 uppercase mb-1">Original</span>
                      <span className="text-2xl font-bold text-slate-400 line-through">{analysis?.overallScore || 0}%</span>
                   </div>
                   <div className="text-blue-400 text-2xl font-bold">→</div>
                   <div className="bg-blue-600/20 p-4 rounded-2xl border border-blue-400/30 flex flex-col items-center shadow-lg shadow-blue-500/10">
                      <span className="text-[8px] font-black text-blue-400 uppercase mb-1">Optimized</span>
                      <span className="text-4xl font-black text-blue-300">{optimization.predictedScore || 0}%</span>
                   </div>
                </div>

                <h3 className="text-3xl font-black leading-tight">Recruiter-Ready Result</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  The resume has been completely restyled into "Jake's Format" with an optimized ATS score of <span className="text-blue-300 font-bold">{optimization.predictedScore || 0}%</span>.
                </p>

                <div className="space-y-4 pt-4">
                  <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Top AI Changes</h5>
                  <ul className="space-y-3">
                    {(optimization.keyImprovements || []).map((imp, idx) => (
                      <li key={idx} className="flex gap-3 text-xs font-medium text-slate-300">
                        <span className="text-blue-400">✦</span>
                        {imp}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8 flex flex-col gap-3">
                    <button 
                      onClick={downloadAsPDF}
                      disabled={downloading}
                      className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all shadow-xl active:scale-95"
                    >
                      {downloading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          Processing...
                        </span>
                      ) : (
                        <>
                          <span className="text-lg">📥</span> Download Final PDF
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-center text-slate-500 font-bold uppercase tracking-tighter">
                      Industry Standard LaTeX-Style PDF
                    </p>
                </div>
              </div>

              <div className="lg:w-2/3">
                <div className="bg-white rounded-2xl shadow-inner overflow-hidden border border-slate-700/50">
                  <div className="flex items-center justify-between px-6 py-3 bg-slate-50 border-b border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Document Preview</span>
                    <span className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-red-400"></div>
                      <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    </span>
                  </div>
                  <div className="p-10 h-[600px] overflow-y-auto bg-white text-black font-serif text-[11px] leading-tight space-y-6">
                     {optimization.structuredResume && (
                       <>
                         <div className="text-center space-y-1">
                            <div className="text-xl font-bold uppercase tracking-tight">{optimization.structuredResume.personalInfo?.name || "Name"}</div>
                            <div className="text-slate-700 text-[9px]">
                              {[
                                optimization.structuredResume.personalInfo?.phone, 
                                optimization.structuredResume.personalInfo?.email, 
                                optimization.structuredResume.personalInfo?.linkedin,
                                optimization.structuredResume.personalInfo?.github
                              ].filter(Boolean).join(' | ')}
                            </div>
                         </div>

                         {optimization.structuredResume.education && optimization.structuredResume.education.length > 0 && (
                           <div className="space-y-2">
                              <div className="border-b border-black font-bold uppercase text-[10px] pb-0.5">Education</div>
                              {optimization.structuredResume.education.map((edu, i) => (
                                <div key={i} className="text-[10px]">
                                  <div className="flex justify-between font-bold">
                                    <span>{edu.institution}</span>
                                    <span>{edu.location}</span>
                                  </div>
                                  <div className="flex justify-between italic text-slate-700">
                                    <span>{edu.degree}</span>
                                    <span>{edu.dates}</span>
                                  </div>
                                </div>
                              ))}
                           </div>
                         )}

                         {optimization.structuredResume.experience && optimization.structuredResume.experience.length > 0 && (
                           <div className="space-y-4">
                              <div className="border-b border-black font-bold uppercase text-[10px] pb-0.5">Experience</div>
                              {optimization.structuredResume.experience.map((exp, i) => (
                                <div key={i} className="space-y-1 text-[10px]">
                                  <div className="flex justify-between font-bold">
                                    <span>{exp.company}</span>
                                    <span>{exp.location}</span>
                                  </div>
                                  <div className="flex justify-between italic text-slate-700">
                                    <span>{exp.title}</span>
                                    <span>{exp.dates}</span>
                                  </div>
                                  <ul className="list-disc ml-4 space-y-1 mt-1">
                                    {(exp.bullets || []).map((b, bi) => <li key={bi} className="leading-tight">{b}</li>)}
                                  </ul>
                                </div>
                              ))}
                           </div>
                         )}

                         {optimization.structuredResume.projects && optimization.structuredResume.projects.length > 0 && (
                            <div className="space-y-4">
                               <div className="border-b border-black font-bold uppercase text-[10px] pb-0.5">Projects</div>
                               {optimization.structuredResume.projects.map((proj, i) => (
                                 <div key={i} className="space-y-1 text-[10px]">
                                   <div className="flex justify-between font-bold">
                                     <span>{proj.name} <span className="font-normal italic">| {proj.technologies}</span></span>
                                   </div>
                                   <ul className="list-disc ml-4 space-y-1 mt-1">
                                     {(proj.bullets || []).map((b, bi) => <li key={bi} className="leading-tight">{b}</li>)}
                                   </ul>
                                 </div>
                               ))}
                            </div>
                         )}

                         {optimization.structuredResume.skills && optimization.structuredResume.skills.length > 0 && (
                           <div className="space-y-2">
                              <div className="border-b border-black font-bold uppercase text-[10px] pb-0.5">Technical Skills</div>
                              <div className="space-y-0.5 text-[10px]">
                                {optimization.structuredResume.skills.map((s, i) => (
                                  <div key={i}><span className="font-bold">{s.category}:</span> {(s.items || []).join(', ')}</div>
                                ))}
                              </div>
                           </div>
                         )}
                       </>
                     )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeAnalysis;
