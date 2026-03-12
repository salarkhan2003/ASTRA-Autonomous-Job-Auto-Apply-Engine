/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Search, 
  Briefcase, 
  User, 
  Bot, 
  Zap, 
  ShieldAlert, 
  CheckCircle2, 
  Clock,
  ExternalLink,
  Terminal,
  Cpu,
  Globe,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { searchJobs, generateScreeningAnswer } from './services/gemini';

interface Application {
  id: number;
  company: string;
  role: string;
  platform: string;
  status: string;
  applied_at: string;
  job_url: string;
  notes: string;
}

interface Profile {
  full_name: string;
  email: string;
  phone: string;
  education: string;
  cgpa: number;
  achievements: string;
  experience: string;
  skills: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [applications, setApplications] = useState<Application[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({ total: 0, applied: 0, interviews: 0 });
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>(["[SYSTEM] Astra Job Bot Initialized...", "[SYSTEM] Monitoring 10 keywords every 20m..."]);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const [location, setLocation] = useState('India');
  const [preferredRole, setPreferredRole] = useState('Embedded Systems');
  const [isAutoPilot, setIsAutoPilot] = useState(false);
  const [autoPilotTimer, setAutoPilotTimer] = useState<NodeJS.Timeout | null>(null);

  const keywords = ["embedded systems", "IoT", "AI/ML", "EV", "robotics", "computer vision", "firmware", "electronics", "automation engineer fresher"];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (isAutoPilot) {
      const timer = setInterval(() => {
        if (!isSearching) {
          handleAutoPilotCycle();
        }
      }, 60000); // Check every minute in autopilot
      setAutoPilotTimer(timer);
    } else {
      if (autoPilotTimer) clearInterval(autoPilotTimer);
    }
    return () => { if (autoPilotTimer) clearInterval(autoPilotTimer); };
  }, [isAutoPilot]);

  const handleAutoPilotCycle = async () => {
    setLogs(prev => [...prev, `[AUTOPILOT] Cycle started. Scanning for ${preferredRole} in ${location}...`]);
    const results = await searchJobs([preferredRole], location);
    setSearchResults(results);
    
    for (const job of results.slice(0, 2)) { // Apply to top 2 per cycle
      await handleApply(job);
    }
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const fetchData = async () => {
    try {
      const [appsRes, profileRes, statsRes] = await Promise.all([
        fetch('/api/applications'),
        fetch('/api/profile'),
        fetch('/api/stats')
      ]);
      setApplications(await appsRes.json());
      setProfile(await profileRes.json());
      setStats(await statsRes.json());
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const handleSearch = async () => {
    try {
      setIsSearching(true);
      setLogs(prev => [...prev, `[SEARCH] Initiating global scan for ${preferredRole} in ${location}...`]);
      const results = await searchJobs([preferredRole, ...keywords.slice(0, 2)], location);
      setSearchResults(results);
      setLogs(prev => [...prev, `[SEARCH] Found ${results.length} high-match opportunities.`]);
    } catch (err) {
      setLogs(prev => [...prev, `[ERROR] Search failed: ${err instanceof Error ? err.message : 'Unknown error'}`]);
    } finally {
      setIsSearching(false);
    }
  };

  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);

  const handleApply = async (job: any) => {
    if (applyingJobId) return;
    
    try {
      setApplyingJobId(job.company + job.role);
      setLogs(prev => [...prev, `[BOT] Starting autonomous workflow for ${job.company}...`]);
      
      // Simulated Login Phase
      setLogs(prev => [...prev, `[AUTH] Authenticating with ${job.platform} credentials...`]);
      await new Promise(r => setTimeout(r, 1000));
      setLogs(prev => [...prev, `[AUTH] Login successful. Session established.`]);

      // Call the real backend automation endpoint
      setLogs(prev => [...prev, `[SYSTEM] Handing over to backend automation engine...`]);
      const autoRes = await fetch('/api/automate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job, profile })
      });

      const autoData = await autoRes.json();

      if (!autoRes.ok) {
        throw new Error(autoData.message || 'Automation failed');
      }

      // Log the steps returned by the backend
      for (const step of autoData.steps) {
        await new Promise(r => setTimeout(r, 600));
        setLogs(prev => [...prev, `[DOM] ${step}...`]);
      }

      const answer = await generateScreeningAnswer("Why should we hire you for this specific role?", profile);
      setLogs(prev => [...prev, `[AI] Generated custom pitch: "${answer.slice(0, 60)}..."`]);
      
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: job.company,
          role: job.role,
          platform: job.platform,
          status: 'Applied',
          job_url: job.job_url,
          notes: `AI Decision: ${job.fit_reason}`
        })
      });
      
      if (res.ok) {
        setLogs(prev => [...prev, `[SUCCESS] ${autoData.message}`]);
        fetchData();
      }
    } catch (err) {
      setLogs(prev => [...prev, `[ERROR] Application failed: ${err instanceof Error ? err.message : 'Unknown error'}`]);
    } finally {
      setApplyingJobId(null);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r border-[var(--color-line)] flex flex-col bg-[var(--color-card)]">
        <div className="p-6 border-b border-[var(--color-line)]">
          <h1 className="text-2xl font-serif italic font-bold tracking-tighter flex items-center gap-2">
            <Cpu className="w-6 h-6" /> ASTRA
          </h1>
          <p className="text-[10px] uppercase tracking-[0.2em] opacity-50 mt-1">Autonomous Job Engine</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Command Center' },
            { id: 'search', icon: Search, label: 'Job Scanner' },
            { id: 'applications', icon: Briefcase, label: 'Applications' },
            { id: 'profile', icon: User, label: 'Candidate Profile' },
            { id: 'bot', icon: Bot, label: 'Bot Logs' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all ${
                activeTab === item.id 
                  ? 'bg-[var(--color-ink)] text-[var(--color-bg)]' 
                  : 'hover:bg-black/5'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[var(--color-line)]">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest opacity-50 mb-2">
            <Zap className="w-3 h-3 text-emerald-600" /> System Status
          </div>
          <div className="text-[11px] font-mono">
            <div className="flex justify-between">
              <span>Uptime</span>
              <span>12:44:02</span>
            </div>
            <div className="flex justify-between text-emerald-600">
              <span>Mode</span>
              <span>Autonomous</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[var(--color-bg)]/50">
        <header className="h-16 border-b border-[var(--color-line)] flex items-center justify-between px-8 bg-[var(--color-bg)]/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest opacity-50">Current Session</span>
              <span className="text-sm font-medium">Patan Salarkhan | B.Tech EEE</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 border border-[var(--color-line)] rounded-full hover:bg-[var(--color-ink)] hover:text-[var(--color-bg)] transition-colors"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className="px-4 py-1 border border-[var(--color-line)] rounded-full text-[11px] font-mono flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Monitoring
            </div>
          </div>
        </header>

        <div className="p-8 max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-3 gap-6">
                  <div className="p-6 border border-[var(--color-line)] bg-[var(--color-card)] card-shadow">
                    <span className="col-header">Total Scanned</span>
                    <div className="text-4xl font-mono mt-2">1,284</div>
                  </div>
                  <div className="p-6 border border-[var(--color-line)] bg-[var(--color-card)] card-shadow">
                    <span className="col-header">Applications Sent</span>
                    <div className="text-4xl font-mono mt-2">{stats.applied}</div>
                  </div>
                  <div className="p-6 border border-[var(--color-line)] bg-[var(--color-card)] card-shadow">
                    <span className="col-header">Interviews</span>
                    <div className="text-4xl font-mono mt-2">{stats.interviews}</div>
                  </div>
                </div>

                <div className="border border-[var(--color-line)] bg-[var(--color-card)]">
                  <div className="p-4 border-b border-[var(--color-line)] flex justify-between items-center">
                    <h2 className="font-serif italic text-lg">Recent Autonomous Activity</h2>
                    <button className="text-[10px] uppercase tracking-widest hover:underline">View All</button>
                  </div>
                  <div className="divide-y divide-[var(--color-line)]">
                    {applications.slice(0, 5).map((app) => (
                      <div key={app.id} className="data-row">
                        <div className="flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="font-medium">{app.company}</div>
                        <div className="data-value text-xs">{app.role}</div>
                        <div className="data-value text-xs opacity-50">{app.platform}</div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-[10px] uppercase font-bold">{app.status}</span>
                        </div>
                      </div>
                    ))}
                    {applications.length === 0 && (
                      <div className="p-12 text-center opacity-30 italic font-serif">
                        No applications sent yet. Start the scanner.
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'search' && (
              <motion.div 
                key="search"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-4 flex-1 mr-8">
                    <h2 className="text-3xl font-serif italic">Job Scanner</h2>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest opacity-50">Target Role</label>
                        <select 
                          value={preferredRole}
                          onChange={(e) => setPreferredRole(e.target.value)}
                          className="w-full bg-[var(--color-card)] border border-[var(--color-line)] p-2 text-sm outline-none"
                        >
                          {keywords.map(k => <option key={k} value={k}>{k}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest opacity-50">Location</label>
                        <input 
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="e.g. Bangalore, Remote"
                          className="w-full bg-[var(--color-card)] border border-[var(--color-line)] p-2 text-sm outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 border border-emerald-500/30 bg-emerald-500/5 rounded">
                      <div className="flex-1">
                        <h4 className="text-sm font-bold flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-emerald-600" /> Auto-Pilot Mode
                        </h4>
                        <p className="text-[11px] opacity-60">When enabled, the bot will automatically search and apply to matching jobs every 20 minutes.</p>
                      </div>
                      <button 
                        onClick={() => setIsAutoPilot(!isAutoPilot)}
                        className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
                          isAutoPilot 
                            ? 'bg-emerald-600 text-white' 
                            : 'border border-[var(--color-line)] hover:bg-[var(--color-ink)] hover:text-[var(--color-bg)]'
                        }`}
                      >
                        {isAutoPilot ? 'Enabled' : 'Enable Auto-Pilot'}
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="px-8 py-4 bg-[var(--color-ink)] text-[var(--color-bg)] text-sm font-bold uppercase tracking-widest flex items-center gap-2 disabled:opacity-50 mt-10"
                  >
                    {isSearching ? <Clock className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                    {isSearching ? 'Scanning...' : 'Start Global Scan'}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {searchResults.map((job, i) => (
                    <div key={i} className="p-6 border border-[var(--color-line)] bg-[var(--color-card)] flex justify-between items-center group hover:bg-[var(--color-ink)] hover:text-[var(--color-bg)] transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-bold">{job.company}</h3>
                          <span className="px-2 py-0.5 border border-current text-[9px] uppercase font-bold">{job.platform}</span>
                        </div>
                        <p className="font-mono text-sm">{job.role}</p>
                        <p className="text-xs italic opacity-70 max-w-xl">{job.fit_reason}</p>
                      </div>
                      <div className="flex gap-3">
                        <a 
                          href={job.job_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-3 border border-current hover:bg-[var(--color-card)] hover:text-[var(--color-ink)] transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button 
                          onClick={() => handleApply(job)}
                          disabled={!!applyingJobId}
                          className="px-6 py-3 bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                        >
                          {applyingJobId === (job.company + job.role) ? (
                            <>
                              <Clock className="w-3 h-3 animate-spin" />
                              Applying...
                            </>
                          ) : (
                            'Auto-Apply'
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                  {!isSearching && searchResults.length === 0 && (
                    <div className="p-20 border-2 border-dashed border-[var(--color-line)] opacity-20 text-center">
                      <Search className="w-12 h-12 mx-auto mb-4" />
                      <p className="font-serif italic text-xl">Ready to scan for new opportunities</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'applications' && (
              <motion.div 
                key="applications"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-serif italic">Application History</h2>
                    <p className="text-sm opacity-60 mt-1">Full log of autonomous submissions and status tracking.</p>
                  </div>
                </div>

                <div className="border border-[var(--color-line)] bg-[var(--color-card)]">
                  <div className="grid grid-cols-[40px_1.5fr_1.5fr_1fr_1fr_80px] p-4 border-b border-[var(--color-line)] bg-[var(--color-ink)] text-[var(--color-bg)]">
                    <div className="col-header text-[var(--color-bg)] opacity-100">#</div>
                    <div className="col-header text-[var(--color-bg)] opacity-100">Company</div>
                    <div className="col-header text-[var(--color-bg)] opacity-100">Role</div>
                    <div className="col-header text-[var(--color-bg)] opacity-100">Platform</div>
                    <div className="col-header text-[var(--color-bg)] opacity-100">Date</div>
                    <div className="col-header text-[var(--color-bg)] opacity-100">Link</div>
                  </div>
                  <div className="divide-y divide-[var(--color-line)]">
                    {applications.map((app, i) => (
                      <div key={app.id} className="grid grid-cols-[40px_1.5fr_1.5fr_1fr_1fr_80px] p-4 items-center hover:bg-black/5 transition-colors">
                        <div className="data-value text-xs opacity-50">{i + 1}</div>
                        <div className="font-bold">{app.company}</div>
                        <div className="text-sm">{app.role}</div>
                        <div className="data-value text-[10px] uppercase">{app.platform}</div>
                        <div className="text-xs opacity-60">{new Date(app.applied_at).toLocaleDateString()}</div>
                        <div>
                          <a 
                            href={app.job_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 border border-[var(--color-line)] rounded hover:bg-[var(--color-ink)] hover:text-[var(--color-bg)] transition-colors inline-block"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                    {applications.length === 0 && (
                      <div className="p-20 text-center opacity-30 italic font-serif">
                        No applications recorded yet.
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'profile' && profile && (
              <motion.div 
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-3xl space-y-8"
              >
                <div className="border-b-2 border-[var(--color-line)] pb-4">
                  <h2 className="text-4xl font-serif italic">{profile.full_name}</h2>
                  <p className="text-sm font-mono opacity-60">{profile.email} | {profile.phone}</p>
                </div>

                <div className="grid grid-cols-2 gap-12">
                  <section className="space-y-4">
                    <h3 className="col-header">Education</h3>
                    <div className="space-y-2">
                      <p className="font-bold">{profile.education}</p>
                      <p className="text-sm font-mono">CGPA: {profile.cgpa}</p>
                    </div>
                  </section>
                  <section className="space-y-4">
                    <h3 className="col-header">Experience</h3>
                    <p className="text-sm leading-relaxed">{profile.experience}</p>
                  </section>
                </div>

                <section className="space-y-4">
                  <h3 className="col-header">Achievements</h3>
                  <p className="text-sm leading-relaxed">{profile.achievements}</p>
                </section>

                <section className="space-y-4">
                  <h3 className="col-header">Technical Stack</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.split(',').map(skill => (
                      <span key={skill} className="px-3 py-1 border border-[var(--color-line)] text-[11px] font-mono">
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === 'bot' && (
              <motion.div 
                key="bot"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-serif italic">System Logs</h2>
                  <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] uppercase font-bold">Bot Active</span>
                  </div>
                </div>
                <div className="bg-[#0a0a0a] text-emerald-500 p-6 font-mono text-xs h-[500px] overflow-y-auto rounded-lg shadow-2xl border border-white/5">
                  <div className="mb-4 p-2 border border-emerald-500/30 bg-emerald-500/10 text-[10px]">
                    [NOTICE] Development environment detected. WebSocket errors in console are expected and do not affect bot performance.
                  </div>
                  {logs.map((log, i) => (
                    <div key={i} className="mb-1">
                      <span className="opacity-50 mr-2">[{new Date().toLocaleTimeString()}]</span>
                      {log}
                    </div>
                  ))}
                  <div className="animate-pulse">_</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
