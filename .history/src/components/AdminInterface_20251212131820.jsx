import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MoreVertical, Trash2, Edit, Plus, Image as ImageIcon, Loader2 } from 'lucide-react';

export default function AdminInterface() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Tabs & Data
  const [activeTab, setActiveTab] = useState('products'); // 'products' or 'info'
  const [projects, setProjects] = useState([]);
  const [infoImage, setInfoImage] = useState(null);
  
  // Form States (Product)
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
    // Lấy Projects
    const { data: proj } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (proj) setProjects(proj);
    // Lấy Info
    const { data: info } = await supabase.from('info_page').select('*').single();
    if (info) setInfoImage(info.image_url);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    setLoading(false);
  };

  // Upload ảnh lên Storage
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

      // Upload Thumbnail
      if (thumbnailFile) thumbUrl = await uploadImage(thumbnailFile);
      
      // Upload Gallery
      if (galleryFiles.length > 0) {
        for (const file of galleryFiles) {
          const url = await uploadImage(file);
          galleryUrls.push(url);
        }
      }

      const payload = {
        ...formData,
        ...(thumbUrl && { thumbnail_url: thumbUrl }),
        ...(galleryUrls.length > 0 && { gallery_urls: galleryUrls }) // Logic đơn giản: thay thế gallery mới
      };

      if (editId) {
        await supabase.from('projects').update(payload).eq('id', editId);
      } else {
        await supabase.from('projects').insert([payload]);
      }
      
      resetForm();
      fetchData();
      setIsEditing(false);
    } catch (error) {
      alert('Lỗi lưu dự án: ' + error.message);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (confirm('Bạn có chắc muốn xóa dự án này?')) {
      await supabase.from('projects').delete().eq('id', id);
      fetchData();
    }
  };

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    if (!thumbnailFile) return alert("Vui lòng chọn ảnh!");
    setLoading(true);
    const url = await uploadImage(thumbnailFile);
    
    // Xóa cái cũ nếu có (để tiết kiệm - làm sau), giờ cứ insert/update
    // Kiểm tra xem đã có record nào chưa
    const { data } = await supabase.from('info_page').select('*');
    if (data && data.length > 0) {
        await supabase.from('info_page').update({ image_url: url }).eq('id', data[0].id);
    } else {
        await supabase.from('info_page').insert([{ image_url: url }]);
    }
    setInfoImage(url);
    setLoading(false);
    alert("Đã cập nhật ảnh Info!");
    setThumbnailFile(null);
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
          <h2 className="mb-6 text-2xl font-bold text-center">Admin Login</h2>
          <input type="email" placeholder="Email" className="w-full p-2 mb-4 border rounded" value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" className="w-full p-2 mb-6 border rounded" value={password} onChange={e => setPassword(e.target.value)} />
          <button disabled={loading} className="w-full p-2 text-white bg-black rounded hover:bg-gray-800">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Header Admin */}
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Minh CMS</h1>
            <button onClick={() => supabase.auth.signOut()} className="text-sm text-red-500 underline">Logout</button>
        </div>

        {/* Tabs */}
        <div className="flex mb-6 border-b">
            <button 
                onClick={() => setActiveTab('products')}
                className={`mr-6 pb-2 ${activeTab === 'products' ? 'border-b-2 border-black font-bold' : 'text-gray-500'}`}
            >
                Products
            </button>
            <button 
                onClick={() => setActiveTab('info')}
                className={`pb-2 ${activeTab === 'info' ? 'border-b-2 border-black font-bold' : 'text-gray-500'}`}
            >
                Info
            </button>
        </div>

        {/* INFO TAB */}
        {activeTab === 'info' && (
            <div className="bg-white p-6 rounded shadow">
                <h2 className="text-xl font-bold mb-4">Ảnh trang Info</h2>
                {infoImage && <img src={infoImage} alt="Current Info" className="w-48 h-auto mb-4 border rounded" />}
                <form onSubmit={handleSaveInfo}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Chọn ảnh mới (Chỉ 1 ảnh)</label>
                        <input type="file" onChange={e => setThumbnailFile(e.target.files[0])} accept="image/*" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"/>
                    </div>
                    <button disabled={loading} className="px-4 py-2 bg-black text-white rounded">
                        {loading ? 'Đang tải lên...' : 'Cập nhật Info'}
                    </button>
                </form>
            </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
            <div>
                {/* Nút bật tắt Form */}
                {!isEditing && (
                     <button onClick={() => setIsEditing(true)} className="flex items-center px-4 py-2 mb-6 text-white bg-black rounded shadow hover:bg-gray-800">
                        <Plus className="w-4 h-4 mr-2" /> Thêm Dự Án Mới
                    </button>
                )}

                {/* Form Thêm/Sửa */}
                {isEditing && (
                    <div className="p-6 mb-8 bg-white rounded shadow-lg animate-in fade-in slide-in-from-bottom-4">
                        <h2 className="mb-4 text-xl font-bold">{editId ? 'Sửa Dự Án' : 'Thêm Dự Án Mới'}</h2>
                        <form onSubmit={handleSaveProject} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium">Tên dự án</label>
                                    <input required type="text" className="w-full p-2 border rounded" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Trạng thái</label>
                                    <select className="w-full p-2 border rounded" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                                        <option value="visible">Hiện (Visible)</option>
                                        <option value="hidden">Ẩn (Hidden)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium">Phân loại</label>
                                    <input type="text" className="w-full p-2 border rounded" placeholder="Retouching, Wedding..." value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Camera / Gear</label>
                                    <input type="text" className="w-full p-2 border rounded" value={formData.camera_gear} onChange={e => setFormData({...formData, camera_gear: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Mô tả</label>
                                <textarea rows="3" className="w-full p-2 border rounded" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                            </div>
                            
                            {/* Upload Area */}
                            <div className="p-4 bg-gray-50 rounded border border-dashed border-gray-300">
                                <div className="mb-4">
                                    <label className="block text-sm font-bold mb-1">1. Ảnh Bìa (Thumbnail)</label>
                                    <input type="file" onChange={e => setThumbnailFile(e.target.files[0])} accept="image/*" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1">2. Gallery (Nhiều ảnh)</label>
                                    <input type="file" multiple onChange={e => setGalleryFiles(Array.from(e.target.files))} accept="image/*" />
                                    <p className="text-xs text-gray-500 mt-1">Chọn nhiều ảnh cùng lúc để upload vào gallery.</p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => {setIsEditing(false); resetForm();}} className="px-4 py-2 text-gray-600 bg-gray-200 rounded">Hủy</button>
                                <button disabled={loading} type="submit" className="px-6 py-2 text-white bg-red-500 rounded hover:bg-red-600 font-bold">
                                    {loading ? 'Đang lưu...' : 'LƯU DỰ ÁN'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Danh sách dự án */}
                <div className="space-y-4">
                    {projects.map(p => (
                        <div key={p.id} className="flex items-center justify-between p-4 bg-white border rounded shadow-sm hover:shadow-md transition">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gray-200 rounded overflow-hidden">
                                    {p.thumbnail_url && <img src={p.thumbnail_url} className="w-full h-full object-cover" />}
                                </div>
                                <div>
                                    <h3 className="font-bold">{p.title}</h3>
                                    <p className="text-sm text-gray-500">{p.category} • {p.status}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => { setEditId(p.id); setFormData(p); setIsEditing(true); }} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
                                    <Edit size={18} />
                                </button>
                                <button onClick={() => handleDelete(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {projects.length === 0 && <p className="text-center text-gray-500 py-8">Chưa có dự án nào.</p>}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}