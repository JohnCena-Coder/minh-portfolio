import React, { useState } from 'react';
import { Send, Loader2, CheckCircle } from 'lucide-react';

export default function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    
    const formData = new FormData(event.target);
    // Điền Access Key của bạn vào dòng dưới đây:
    formData.append("access_key", "a20571e2-2e49-460f-8481-eae284c04d1d"); 

    const object = Object.fromEntries(formData);
    const json = JSON.stringify(object);

    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: json
    }).then((res) => res.json());

    if (res.success) {
      setSuccess(true);
      event.target.reset(); // Xóa trắng form sau khi gửi
    } else {
        alert("Có lỗi xảy ra, vui lòng thử lại!");
    }
    setLoading(false);
  };

  return (
    <div className="bg-gray-50 border-t border-gray-100 py-12 sm:py-16 mt-20">
      <div className="max-w-xl mx-auto px-6">
        <div className="text-center mb-8">
            <h2 className="text-2xl font-serif font-bold mb-2">Let's work together</h2>
            <p className="text-gray-500 text-sm font-light">Gửi tin nhắn cho Minh để trao đổi về dự án của bạn.</p>
        </div>

        {success ? (
            <div className="bg-green-50 border border-green-200 text-green-700 p-6 rounded-lg text-center animate-in fade-in zoom-in">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50"/>
                <h3 className="font-bold">Đã gửi tin nhắn!</h3>
                <p className="text-sm">Cảm ơn bạn, Minh sẽ phản hồi sớm nhất qua Email.</p>
                <button onClick={() => setSuccess(false)} className="mt-4 text-xs underline text-green-600 hover:text-green-800">Gửi tin nhắn khác</button>
            </div>
        ) : (
            <form onSubmit={onSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Họ Tên</label>
                    <input type="text" name="name" required className="w-full p-3 bg-white border border-gray-200 rounded focus:outline-none focus:border-black transition" placeholder="Tên của bạn" />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Email</label>
                    <input type="email" name="email" required className="w-full p-3 bg-white border border-gray-200 rounded focus:outline-none focus:border-black transition" placeholder="name@example.com" />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Nội Dung</label>
                    <textarea name="message" required rows="4" className="w-full p-3 bg-white border border-gray-200 rounded focus:outline-none focus:border-black transition" placeholder="Bạn muốn chụp concept gì?..."></textarea>
                </div>

                <button disabled={loading} type="submit" className="w-full bg-black text-white font-bold py-3 rounded hover:bg-gray-800 transition flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="animate-spin w-5 h-5"/> : <><Send className="w-4 h-4"/> Gửi Tin Nhắn</>}
                </button>
            </form>
        )}
        
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
             <p className="text-xs text-gray-300 uppercase tracking-widest font-light">© 2024 Minh Photography</p>
        </div>
      </div>
    </div>
  );
}