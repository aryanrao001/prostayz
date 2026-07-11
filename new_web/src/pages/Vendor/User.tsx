import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Search, User2, Edit, X, Save, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UserData {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: 'active' | 'blocked';
  total_bookings: number;
  total_spent: number;
}

const User: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Debounced search logic
  const fetchUsers = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/users?search=${query}`, { withCredentials: true });
      setUsers(res.data.data);
    } catch (err) {
      console.error("Error fetching users", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => fetchUsers(searchTerm), 500);
    return () => clearTimeout(handler);
  }, [searchTerm, fetchUsers]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSaving(true);
    try {
      await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/admin/users/${selectedUser.id}`, selectedUser, { withCredentials: true });
      setIsPanelOpen(false);
      fetchUsers(searchTerm); // Refresh list
    } catch (err) {
      console.error("Update failed", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[20px] font-semibold text-[#1E2A23]">User Management</h2>
        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 text-[#9A917D]" size={16} />
          <input 
            placeholder="Search by name, phone, email..." 
            className="w-full bg-white border border-[#E5DECF] rounded-lg py-2 pl-10 pr-4 text-[13px] outline-none focus:border-[#2F6F62]"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E5DECF] overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#EFE9DC]/30 border-b border-[#E5DECF]">
            <tr>
              {['User Details', 'Bookings', 'Total Spent', 'Status', 'Action'].map(h => <th key={h} className="p-4 text-[12px] font-bold text-[#6B6354] uppercase">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5DECF]">
            {loading ? <tr><td colSpan={5} className="p-8 text-center text-[#9A917D]"><Loader2 className="animate-spin inline" /></td></tr> : 
            users.map((user) => (
              <tr key={user.id} className="hover:bg-[#F8F7F4] transition">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#2F6F62]/10 flex items-center justify-center text-[#2F6F62]"><User2 size={16} /></div>
                    <div><p className="text-[13px] font-medium">{user.first_name} {user.last_name}</p><p className="text-[11px] text-[#9A917D]">{user.email}</p></div>
                  </div>
                </td>
                <td className="p-4 text-[13px]">{user.total_bookings}</td>
                <td className="p-4 text-[13px] font-semibold text-[#2F6F62]">₹{user.total_spent}</td>
                <td className="p-4"><span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{user.status}</span></td>
                <td className="p-4 text-right">
                  <button onClick={() => { setSelectedUser(user); setIsPanelOpen(true); }} className="p-2 hover:bg-[#E5DECF] rounded-lg text-[#6B6354]"><Edit size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Slide-over Panel */}
      <AnimatePresence>
        {isPanelOpen && selectedUser && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPanelOpen(false)} className="fixed inset-0 bg-black/20 z-40" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed right-0 top-0 h-full w-[400px] bg-white z-50 shadow-2xl border-l border-[#E5DECF] p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-[18px] font-semibold">Edit User</h3>
                <button onClick={() => setIsPanelOpen(false)}><X size={20} /></button>
              </div>
              <form onSubmit={handleUpdate} className="space-y-4">
                {['first_name', 'last_name', 'email', 'phone'].map((field) => (
                  <div key={field}>
                    <label className="text-[10px] font-bold uppercase text-[#9A917D]">{field.replace('_', ' ')}</label>
                    <input 
                      required 
                      defaultValue={selectedUser[field as keyof UserData]} 
                      onChange={(e) => setSelectedUser({...selectedUser, [field]: e.target.value})}
                      className="w-full mt-1 p-3 bg-[#F8F7F4] border border-[#E5DECF] rounded-lg focus:border-[#2F6F62] outline-none" 
                    />
                  </div>
                ))}
                <button type="submit" disabled={isSaving} className="w-full mt-6 py-3 bg-[#2F6F62] text-white rounded-lg flex items-center justify-center gap-2">
                  {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Save Changes
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default User;