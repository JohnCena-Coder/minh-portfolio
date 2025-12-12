import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trash2, Plus, Edit, Loader2, LogOut, Image as ImageIcon } from 'lucide-react';

export default function AdminInterface() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [activeTab, setActiveTab] = useState('products'); 
  const [projects, setProjects] = useState([]);
  const [infoImage, setInfoImage] = useState(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    title: '', category: '', status: 'visible', camera_gear: '', description: '',
  });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchData();
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchData();
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchData = async () => {
    const { data: proj } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (proj) setProjects(proj);
    const { data: infoList } = await supabase.from('info_page').select('*').order('id', { ascending: false }).limit(1);
    if (infoList && infoList.length > 0) setInfoImage(infoList[0].image_url);
    else setInfoImage(null);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    setLoading(false);
  };

  const uploadImage = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;
    const { error: uploadError } = await supabase.storage.from('portfolio').upload(filePath, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('portfolio').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let thumbUrl = null;
      let galleryUrls = [];
      if (thumbnailFile) thumbUrl = await uploadImage(thumbnailFile);
      if (galleryFiles.length > 0) {
        for (const file of galleryFiles) {
          const url = await uploadImage(file);
          galleryUrls.push(url);
        }
      }
      const payload = {
        ...formData,
        ...(thumbUrl && { thumbnail_url: thumbUrl }),
        ...(galleryUrls.length > 0 && { gallery_urls: galleryUrls })
      };
      if (editId) await supabase.from('projects').update(payload).eq('id', editId);
      else await supabase.from('projects').insert([payload]);
      
      resetForm();
      fetchData();
      setIsEditing(false);
    } catch (error) { alert('Error: ' + error.message); }
    setLoading(false);
  };

  const handleDeleteProject = async (id) => {
    if (confirm('Are you sure you want to delete this project?')) {
      await supabase.from('projects').delete().eq('id', id);
      fetchData();
    }
  };

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    if (!thumbnailFile) return alert("Please select an image!");
    setLoading(true);
    try {
        const url = await uploadImage(thumbnailFile);
        await supabase.from('info_page').insert([{ image_url: url }]);
        setInfoImage(url);
        setThumbnailFile(null);
        alert("Info Page updated successfully!");
    } catch (error) { alert("Error: " + error.message); }
    setLoading(false);
  };

  const handleDeleteInfo = async () => {
    if (confirm("Are you sure? The Info page will be empty.")) {
        setLoading(true);
        await supabase.from('info_page').delete().gt('id', 0);
        setInfoImage(null);
        setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', category: '', status: 'visible', camera_gear: '', description: '' });
    setThumbnailFile(null);
    setGalleryFiles([]);
    setEditId(null);
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <form onSubmit={handleLogin} className="p-8 bg-white rounded shadow-md w-96">
          <h2 className="mb-6 text-2xl font-bold text-center font-serif">Minh CMS</h2>
          <input type="email" placeholder="Email" className="w-full p-2 mb-4 border rounded" value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" className="w-full p-2 mb-6 border rounded" value={password} onChange={e => setPassword(e.target.value)} />
          <button disabled={loading} className="w-full p-3 text-white bg-black rounded hover:bg-gray-800 font-bold transition">
            {loading ? 'Authenticating...' : 'Login'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-gray-50 font-sans text-gray-800">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-end mb-10 border-b border-gray-200 pb-4">
            <div>
                <h1 className="text-3xl font-bold font-serif">Minh CMS</h1>
                <p className="text-gray-400 text-sm mt-1">Content Management System</p>
            </div>
            <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 font-medium px-3 py-1 rounded hover:bg-red-50 transition">
                <LogOut size={16}/> Logout
            </button>
        </div>

        <div className="flex mb-8 gap-8">
            <button onClick={() => setActiveTab('products')} className={`pb-2 text-lg transition ${activeTab === 'products' ? 'border-b-2 border-black font-bold text-black' : 'text-gray-400 hover:text-gray-600'}`}>
                Products
            </button>
            <button onClick={() => setActiveTab('info')} className={`pb-2 text-lg transition ${activeTab === 'info' ? 'border-b-2 border-black font-bold text-black' : 'text-gray-400 hover:text-gray-600'}`}>
                Info Page
            </button>
        </div>

        {activeTab === 'info' && (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-2">
                <h2 className="text-xl font-bold mb-6">Info Image</h2>
                {infoImage ? (
                    <div className="mb-8">
                        <p className="text-sm text-gray-500 mb-2">Current Image:</p>
                        <div className="relative inline-block group">
                            <img src={infoImage} alt="Current Info" className="h-64 w-auto object-contain rounded-lg border shadow-sm" />
                            <button onClick={handleDeleteInfo} className="absolute -top-3 -right-3 bg-red-500 text-white p-2 rounded-full shadow-md hover:bg-red-600 hover:scale-110 transition flex items-center justify-center" title="Delete Image">
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-8 mb-8 text-center border-2 border-dashed rounded-lg bg-gray-50 text-gray-400">No image available.</div>
                )}
                <form onSubmit={handleSaveInfo} className="max-w-md">
                    <label className="block text-sm font-bold mb-2">Upload New Image</label>
                    <div className="flex gap-4 items-center">
                        <input type="file" onChange={e => setThumbnailFile(e.target.files[0])} accept="image/*" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 transition cursor-pointer"/>
                        <button disabled={loading} className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition font-medium whitespace-nowrap">
                            {loading ? <Loader2 className="animate-spin"/> : 'Save Info'}
                        </button>
                    </div>
                </form>
            </div>
        )}

        {activeTab === 'products' && (
            <div>
                {!isEditing && (
                     <button onClick={() => setIsEditing(true)} className="flex items-center px-5 py-3 mb-8 text-white bg-black rounded-lg shadow-lg hover:bg-gray-800 hover:translate-y-[-2px] transition-all">
                        <Plus className="w-5 h-5 mr-2" /> Add New Project
                    </button>
                )}
                {isEditing && (
                    <div className="p-6 mb-8 bg-white rounded-xl shadow-lg border border-gray-100 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex justify-between items-center mb-6">
                             <h2 className="text-xl font-bold">{editId ? 'Edit Project' : 'Add New Project'}</h2>
                             <button onClick={() => {setIsEditing(false); resetForm();}} className="text-gray-400 hover:text-black">Close</button>
                        </div>
                        <form onSubmit={handleSaveProject} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold mb-2">Project Title</label>
                                    <input required type="text" className="w-full p-3 bg-gray-50 border-gray-200 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none transition" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2">Status</label>
                                    <select className="w-full p-3 bg-gray-50 border-gray-200 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                                        <option value="visible">Visible</option>
                                        <option value="hidden">Hidden</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold mb-2">Category</label>
                                    <input type="text" className="w-full p-3 bg-gray-50 border-gray-200 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none transition" placeholder="Retouching, Wedding..." value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2">Camera / Gear</label>
                                    <input type="text" className="w-full p-3 bg-gray-50 border-gray-200 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none transition" value={formData.camera_gear} onChange={e => setFormData({...formData, camera_gear: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2">Description</label>
                                <textarea rows="4" className="w-full p-3 bg-gray-50 border-gray-200 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none transition" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                            </div>
                            <div className="p-6 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                <div className="mb-6">
                                    <label className="block text-sm font-bold mb-2">1. Thumbnail (Cover Image)</label>
                                    <input type="file" onChange={e => setThumbnailFile(e.target.files[0])} accept="image/*" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white file:text-black hover:file:bg-gray-100 transition"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2">2. Gallery (Multiple Images)</label>
                                    <input type="file" multiple onChange={e => setGalleryFiles(Array.from(e.target.files))} accept="image/*" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white file:text-black hover:file:bg-gray-100 transition"/>
                                    <p className="text-xs text-gray-400 mt-2">Hold Ctrl/Cmd to select multiple images.</p>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button type="button" onClick={() => {setIsEditing(false); resetForm();}} className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition font-medium">Cancel</button>
                                <button disabled={loading} type="submit" className="px-8 py-2 text-white bg-black rounded-lg hover:bg-gray-800 transition font-bold shadow-lg">
                                    {loading ? <Loader2 className="animate-spin" /> : 'SAVE PROJECT'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
                <div className="space-y-4">
                    {projects.map(p => (
                        <div key={p.id} className="group flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition duration-300">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                    {p.thumbnail_url ? <img src={p.thumbnail_url} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={24}/></div>}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-1">{p.title}</h3>
                                    <div className="flex gap-2 text-sm">
                                        <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-600 text-xs uppercase tracking-wide">{p.category}</span>
                                        <span className={`px-2 py-0.5 rounded text-xs uppercase tracking-wide ${p.status === 'visible' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>{p.status}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditId(p.id); setFormData(p); setIsEditing(true); }} className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-full transition" title="Edit">
                                    <Edit size={18} />
                                </button>
                                <button onClick={() => handleDeleteProject(p.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition" title="Delete">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {projects.length === 0 && (
                        <div className="text-center py-16 bg-white rounded-xl border border-dashed">
                            <p className="text-gray-400 mb-4">No projects found.</p>
                            <button onClick={() => setIsEditing(true)} className="text-black font-bold underline">Create First Project</button>
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}