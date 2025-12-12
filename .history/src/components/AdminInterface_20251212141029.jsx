import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trash2, Plus, Edit, Loader2, LogOut } from 'lucide-react'; // Đã thêm icon LogOut

export default function AdminInterface() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Tabs & Data
  const [activeTab, setActiveTab] = useState('products'); 
  const [projects, setProjects] = useState([]);
  const [infoImage, setInfoImage] = useState(null);
  
  // Form States
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
    
    // Lấy Info mới nhất
    const { data: infoList } = await supabase.from('info_page').select('*').order('id', { ascending: false }).limit(1);
    if (infoList && infoList.length > 0) {
        setInfoImage(infoList[0].image_url);
    } else {
        setInfoImage(null);
    }
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

  // --- XỬ LÝ PROJECT ---
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

      if (editId) {
        await supabase.from('projects').update(payload).eq('id', editId);
      } else {
        await supabase.from('projects').insert([payload]);
      }
      resetForm();
      fetchData();
      setIsEditing(false);
    } catch (error) {
      alert('Lỗi: ' + error.message);
    }
    setLoading(false);
  };

  const handleDeleteProject = async (id) => {
    if (confirm('Bạn có chắc muốn xóa dự án này?')) {
      await supabase.from('projects').delete().eq('id', id);
      fetchData();
    }
  };

  // --- XỬ LÝ INFO (MỚI) ---
  const handleSaveInfo = async (e) => {
    e.preventDefault();
    if (!thumbnailFile) return alert("Vui lòng chọn ảnh!");
    setLoading(true);
    try {
        const url = await uploadImage(thumbnailFile);
        // Insert luôn cái mới, logic hiển thị sẽ lấy cái mới nhất
        await supabase.from('info_page').insert([{ image_url: url }]);
        setInfoImage(url);
        setThumbnailFile(null);
        alert("Đã cập nhật Info thành công!");
    } catch (error) {
        alert("Lỗi: " + error.message);
    }
    setLoading(false);
  };

  // Hàm Xóa Info (Tính năng bạn vừa yêu cầu)
  const handleDeleteInfo = async () => {
    if (confirm("Bạn có chắc muốn xóa ảnh Info này không? Trang Info sẽ bị trống.")) {
        setLoading(true);
        // Xóa sạch bảng info_page để reset
        await supabase.from('info_page').delete().gt('id', 0);
        setInfoImage(null);