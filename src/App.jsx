import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, Users, FileText, AlertCircle, CheckCircle, LogOut, Building2, DollarSign, Plus, X, Loader2, AlertTriangle, Calendar } from 'lucide-react';

// --- CONFIGURATION ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- MODAL COMPONENT ---
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// --- AUTH SCREEN ---
const AuthScreen = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess('Account created! Please sign in.');
        setIsSignUp(false);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onLogin(data.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500 rounded-full blur-3xl opacity-10 -mr-20 -mt-20"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-emerald-500 p-2 rounded-lg"><Building2 size={24} className="text-white" /></div>
            <span className="text-2xl font-bold text-white tracking-tight">VendorConnect</span>
          </div>
          <p className="text-slate-400">Enterprise Procurement OS</p>
        </div>
        <div className="relative z-10">
          <blockquote className="text-xl font-light text-white mb-6">"Finally, a system that keeps our data secure and organized."</blockquote>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
            <p className="text-slate-500 mt-2">{isSignUp ? 'Start managing your vendors.' : 'Sign in to access your dashboard.'}</p>
          </div>
          <form onSubmit={handleAuth} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2"><XCircle size={16}/>{error}</div>}
            {success && <div className="p-3 bg-emerald-50 text-emerald-600 text-sm rounded-lg flex items-center gap-2"><CheckCircle size={16}/>{success}</div>}
            <button disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>
          </form>
          <div className="text-center text-sm">
            <button onClick={() => { setIsSignUp(!isSignUp); setError(''); }} className="text-emerald-600 hover:text-emerald-500 font-medium">
              {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN DASHBOARD ---
const Dashboard = ({ user, onLogout }) => {
  const [vendors, setVendors] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals State
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [isAddContractOpen, setIsAddContractOpen] = useState(false);
  
  // Forms State
  const [newVendor, setNewVendor] = useState({ name: '', category: 'IT Services', total_spend: '', contact: '' });
  const [newContract, setNewContract] = useState({ vendor_id: '', contract_name: '', end_date: '', value: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [vRes, cRes] = await Promise.all([
      supabase.from('vendors').select('*').order('created_at', { ascending: false }),
      supabase.from('contracts').select('*').order('end_date', { ascending: true })
    ]);
    setVendors(vRes.data || []);
    setContracts(cRes.data || []);
    setLoading(false);
  };

  const handleAddVendor = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { error } = await supabase.from('vendors').insert([{
      ...newVendor,
      user_id: user.id, 
      compliance_status: 'compliant', 
      total_spend: parseFloat(newVendor.total_spend) || 0
    }]);

    if (!error) {
      await fetchData(); 
      setIsAddVendorOpen(false);
      setNewVendor({ name: '', category: 'IT Services', total_spend: '', contact: '' });
    } else {
      alert("Error: " + error.message);
    }
    setIsSubmitting(false);
  };

  const handleAddContract = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Auto-calculate start date as today for simplicity
    const today = new Date().toISOString().split('T')[0];
    
    const { error } = await supabase.from('contracts').insert([{
      vendor_id: newContract.vendor_id,
      contract_name: newContract.contract_name,
      end_date: newContract.end_date,
      value: parseFloat(newContract.value) || 0,
      start_date: today,
      status: 'active',
      user_id: user.id
    }]);

    if (!error) {
      await fetchData();
      setIsAddContractOpen(false);
      setNewContract({ vendor_id: '', contract_name: '', end_date: '', value: '' });
    } else {
      alert("Error: " + error.message);
    }
    setIsSubmitting(false);
  };

  const handleComplaint = async (vendorId) => {
    const reason = prompt("Describe the issue (e.g., 'Missed Deadline'):");
    if (!reason) return;
    setVendors(vendors.map(v => v.id === vendorId ? { ...v, compliance_status: 'non_compliant' } : v));
    await supabase.from('vendors').update({ compliance_status: 'non_compliant' }).eq('id', vendorId);
  };

  // Logic for Alerts
  const totalSpend = vendors.reduce((sum, v) => sum + (v.total_spend || 0), 0);
  const expiringContracts = contracts.filter(c => {
    const daysLeft = Math.ceil((new Date(c.end_date) - new Date()) / (1000 * 60 * 60 * 24));
    return daysLeft >= 0 && daysLeft <= 30;
  });

  const getVendorName = (id) => vendors.find(v => v.id === id)?.name || 'Unknown Vendor';

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-emerald-600" size={32} /></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="text-emerald-600" />
            <span className="font-bold text-lg hidden sm:inline">VendorConnect</span>
          </div>
          
          {/* Main Nav */}
          <nav className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            {['dashboard', 'vendors', 'contracts'].map((view) => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  activeView === view 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                } capitalize`}
              >
                {view}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <button onClick={onLogout} className="text-sm font-medium text-slate-600 hover:text-red-600 flex items-center gap-2">
              <LogOut size={16} /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* VIEW: DASHBOARD */}
        {activeView === 'dashboard' && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between">
                <div><div className="text-2xl font-bold">{vendors.length}</div><div className="text-sm text-slate-500">My Vendors</div></div>
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600"><Users size={20} /></div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between">
                <div><div className="text-2xl font-bold">{contracts.length}</div><div className="text-sm text-slate-500">Contracts</div></div>
                <div className="p-2 rounded-lg bg-purple-50 text-purple-600"><FileText size={20} /></div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between">
                <div><div className="text-2xl font-bold">${(totalSpend/1000).toFixed(0)}k</div><div className="text-sm text-slate-500">My Spend</div></div>
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600"><DollarSign size={20} /></div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between">
                <div><div className="text-2xl font-bold">{expiringContracts.length}</div><div className="text-sm text-slate-500">Alerts</div></div>
                <div className="p-2 rounded-lg bg-red-50 text-red-600"><AlertCircle size={20} /></div>
              </div>
            </div>

            {/* ALERTS SECTION */}
            {expiringContracts.length > 0 ? (
              <div className="bg-red-50 border border-red-100 rounded-xl p-6 animate-in slide-in-from-top-2">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="text-red-600" />
                  <h3 className="font-bold text-red-900 text-lg">Action Required: Expiring Contracts</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {expiringContracts.map(c => (
                    <div key={c.id} className="bg-white p-4 rounded-lg border border-red-100 shadow-sm flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-slate-900">{c.contract_name}</div>
                        <div className="text-sm text-slate-500 flex items-center gap-1">
                          <Building2 size={12}/> {getVendorName(c.vendor_id)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-red-600 font-bold text-sm">
                          Expires: {new Date(c.end_date).toLocaleDateString()}
                        </div>
                        <button className="text-xs text-red-700 hover:underline mt-1">Renew Now</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 text-center">
                <CheckCircle className="mx-auto text-emerald-600 mb-2" />
                <h3 className="text-emerald-900 font-medium">All systems go! No contracts expiring soon.</h3>
              </div>
            )}
          </>
        )}

        {/* VIEW: VENDORS */}
        {activeView === 'vendors' && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800">My Vendors</h3>
              <button onClick={() => setIsAddVendorOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                <Plus size={16} /> Add Vendor
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Vendor Name</th>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vendors.map(v => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">{v.name}</td>
                      <td className="px-6 py-4 text-slate-600">{v.category}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          v.compliance_status === 'compliant' ? 'bg-emerald-100 text-emerald-700' : 
                          v.compliance_status === 'non_compliant' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {v.compliance_status?.replace('_', ' ') || 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => handleComplaint(v.id)} className="text-slate-400 hover:text-red-600 flex items-center gap-1 text-xs font-medium">
                          <AlertTriangle size={14} /> Report
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {vendors.length === 0 && <div className="p-8 text-center text-slate-500">No vendors found. Add one to get started.</div>}
            </div>
          </div>
        )}

        {/* VIEW: CONTRACTS */}
        {activeView === 'contracts' && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800">Contract Repository</h3>
              <button onClick={() => setIsAddContractOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                <Plus size={16} /> New Contract
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Contract Name</th>
                    <th className="px-6 py-3">Vendor</th>
                    <th className="px-6 py-3">End Date</th>
                    <th className="px-6 py-3">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {contracts.map(c => {
                    const daysLeft = Math.ceil((new Date(c.end_date) - new Date()) / (1000 * 60 * 60 * 24));
                    const isExpiring = daysLeft >= 0 && daysLeft <= 30;
                    return (
                      <tr key={c.id} className={`hover:bg-slate-50 ${isExpiring ? 'bg-red-50/30' : ''}`}>
                        <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                          {isExpiring && <AlertTriangle size={14} className="text-red-500" />}
                          {c.contract_name}
                        </td>
                        <td className="px-6 py-4 text-slate-600">{getVendorName(c.vendor_id)}</td>
                        <td className="px-6 py-4 text-slate-600 font-mono">
                          {new Date(c.end_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-mono">${c.value?.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {contracts.length === 0 && <div className="p-8 text-center text-slate-500">No contracts found.</div>}
            </div>
          </div>
        )}

      </main>

      {/* MODAL: ADD VENDOR */}
      <Modal isOpen={isAddVendorOpen} onClose={() => setIsAddVendorOpen(false)} title="Add New Vendor">
        <form onSubmit={handleAddVendor} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1 uppercase">Company Name</label>
            <input required className="w-full p-2 border border-slate-200 rounded-lg outline-none" value={newVendor.name} onChange={e => setNewVendor({...newVendor, name: e.target.value})} placeholder="e.g. Acme Corp" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1 uppercase">Category</label>
              <select className="w-full p-2 border border-slate-200 rounded-lg outline-none bg-white" value={newVendor.category} onChange={e => setNewVendor({...newVendor, category: e.target.value})}>
                <option>IT Services</option><option>Logistics</option><option>Hardware</option><option>Consulting</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1 uppercase">Annual Spend ($)</label>
              <input type="number" required className="w-full p-2 border border-slate-200 rounded-lg outline-none" value={newVendor.total_spend} onChange={e => setNewVendor({...newVendor, total_spend: e.target.value})} placeholder="0.00" />
            </div>
          </div>
          <button disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-medium mt-2">
            {isSubmitting ? 'Saving...' : 'Add Vendor'}
          </button>
        </form>
      </Modal>

      {/* MODAL: ADD CONTRACT */}
      <Modal isOpen={isAddContractOpen} onClose={() => setIsAddContractOpen(false)} title="Create New Contract">
        <form onSubmit={handleAddContract} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1 uppercase">Contract Name</label>
            <input required className="w-full p-2 border border-slate-200 rounded-lg outline-none" value={newContract.contract_name} onChange={e => setNewContract({...newContract, contract_name: e.target.value})} placeholder="e.g. Annual Maintenance 2026" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1 uppercase">Link to Vendor</label>
            <select required className="w-full p-2 border border-slate-200 rounded-lg outline-none bg-white" value={newContract.vendor_id} onChange={e => setNewContract({...newContract, vendor_id: e.target.value})}>
              <option value="">Select a vendor...</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1 uppercase">End Date</label>
              <input type="date" required className="w-full p-2 border border-slate-200 rounded-lg outline-none" value={newContract.end_date} onChange={e => setNewContract({...newContract, end_date: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1 uppercase">Value ($)</label>
              <input type="number" required className="w-full p-2 border border-slate-200 rounded-lg outline-none" value={newContract.value} onChange={e => setNewContract({...newContract, value: e.target.value})} placeholder="0.00" />
            </div>
          </div>
          <button disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium mt-2">
            {isSubmitting ? 'Creating...' : 'Create Contract'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);
  if (!user) return <AuthScreen onLogin={setUser} />;
  return <Dashboard user={user} onLogout={() => supabase.auth.signOut()} />;
}