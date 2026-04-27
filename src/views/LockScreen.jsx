// import React, { useState, useEffect } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { Delete, Keyboard } from 'lucide-react'; // Sử dụng icon từ thư viện lucide-react
//
// // Import logo giống như ở Home.jsx
// import logoImg from '../assets/logo-1.png';
//
// export default function LockScreen({ onUnlock }) {
//     const [pin, setPin] = useState('');
//     const [error, setError] = useState(false);
//
//     // Trạng thái hiển thị bàn phím ảo (Mặc định ẩn, bấm vào ô nhập mới hiện)
//     const [showNumpad, setShowNumpad] = useState(false);
//
//     // Hỗ trợ gõ bằng bàn phím vật lý (Laptop/PC)
//     useEffect(() => {
//         const handleKeyDown = (e) => {
//             setError(false);
//             if (/^[0-9]$/.test(e.key)) {
//                 // Giới hạn mã PIN tối đa 8 số để không tràn giao diện
//                 if (pin.length < 8) setPin((prev) => prev + e.key);
//             } else if (e.key === 'Backspace') {
//                 setPin((prev) => prev.slice(0, -1));
//             } else if (e.key === 'Enter') {
//                 if (pin.length >= 4) {
//                     executeUnlock(pin);
//                 } else {
//                     setError(true);
//                 }
//             }
//         };
//
//         window.addEventListener('keydown', handleKeyDown);
//         return () => window.removeEventListener('keydown', handleKeyDown);
//     }, [pin]);
//
//     const handleNumClick = (num) => {
//         setError(false);
//         if (pin.length < 8) setPin((prev) => prev + num);
//     };
//
//     const handleDelete = () => {
//         setPin((prev) => prev.slice(0, -1));
//     };
//
//     const executeUnlock = (currentPin) => {
//         if (currentPin.length < 4) {
//             setError(true);
//             return;
//         }
//         // Lưu PIN vào localStorage và báo cho App biết đã mở khóa
//         localStorage.setItem('app_pin', currentPin);
//         onUnlock();
//     };
//
//     const handleSubmit = (e) => {
//         e.preventDefault();
//         executeUnlock(pin);
//     };
//
//     return (
//         <div className="fixed inset-0 bg-[var(--bg-base)] flex items-center justify-center z-[99999] overflow-hidden">
//             {/* Vòng sáng nền */}
//             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D4AF37]/10 rounded-full blur-[100px] pointer-events-none"></div>
//
//             <motion.div
//                 initial={{ opacity: 0, scale: 0.9, y: 20 }}
//                 animate={{ opacity: 1, scale: 1, y: 0 }}
//                 transition={{ duration: 0.4, ease: "easeOut" }}
//                 className="apple-glass p-6 sm:p-10 rounded-[32px] w-[90%] max-w-[380px] flex flex-col items-center border border-[var(--separator)] shadow-2xl relative z-10"
//             >
//                 <div className="w-40 h-14 bg-contain bg-center bg-no-repeat mb-6 no-dim" style={{ backgroundImage: `url(${logoImg})` }}></div>
//
//                 <h2 className="text-[22px] font-black tracking-tight text-[var(--label-primary)] mb-2">Bảo mật truy cập</h2>
//                 <p className="caption text-center mb-6">Nhập mã PIN để giải mã dữ liệu tài chính.</p>
//
//                 <div className="w-full">
//                     {/* Ô NHẬP PIN GIẢ LẬP (Tránh bật bàn phím mặc định của điện thoại) */}
//                     <div
//                         onClick={() => setShowNumpad(true)}
//                         className={`w-full bg-[var(--bg-elevated)] border-2 ${error ? 'border-[var(--system-red)]' : 'border-[var(--separator)] focus:border-[#D4AF37]'} rounded-2xl h-16 flex items-center justify-center cursor-pointer shadow-inner transition-colors mb-6`}
//                     >
//                         {pin.length === 0 ? (
//                             <span className="text-[28px] font-black tracking-[0.5em] text-[var(--label-tertiary)] opacity-50">••••</span>
//                         ) : (
//                             <div className="flex gap-3">
//                                 {pin.split('').map((_, i) => (
//                                     <span key={i} className="w-3.5 h-3.5 bg-[var(--label-primary)] rounded-full shadow-sm"></span>
//                                 ))}
//                             </div>
//                         )}
//                     </div>
//
//                     {/* BÀN PHÍM SỐ (NUMPAD) */}
//                     <AnimatePresence>
//                         {showNumpad && (
//                             <motion.div
//                                 initial={{ opacity: 0, height: 0, y: 10 }}
//                                 animate={{ opacity: 1, height: 'auto', y: 0 }}
//                                 exit={{ opacity: 0, height: 0, y: 10 }}
//                                 className="w-full overflow-hidden mb-6"
//                             >
//                                 <div className="grid grid-cols-3 gap-3">
//                                     {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
//                                         <button
//                                             key={num}
//                                             type="button"
//                                             onClick={() => handleNumClick(num.toString())}
//                                             className="bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated-secondary)] active:scale-95 py-3 rounded-xl text-[22px] font-medium text-[var(--label-primary)] transition-all shadow-sm border border-[var(--border-subtle)] outline-none"
//                                         >
//                                             {num}
//                                         </button>
//                                     ))}
//
//                                     {/* Hàng cuối cùng: Ẩn phím, Số 0, Xóa */}
//                                     <button
//                                         type="button"
//                                         onClick={() => setShowNumpad(false)}
//                                         className="flex items-center justify-center bg-transparent hover:bg-[var(--bg-elevated-secondary)] active:scale-95 py-3 rounded-xl transition-all outline-none"
//                                     >
//                                         <Keyboard className="w-6 h-6 text-[var(--label-secondary)]" strokeWidth={2} />
//                                     </button>
//                                     <button
//                                         type="button"
//                                         onClick={() => handleNumClick('0')}
//                                         className="bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated-secondary)] active:scale-95 py-3 rounded-xl text-[22px] font-medium text-[var(--label-primary)] transition-all shadow-sm border border-[var(--border-subtle)] outline-none"
//                                     >
//                                         0
//                                     </button>
//                                     <button
//                                         type="button"
//                                         onClick={handleDelete}
//                                         className="flex items-center justify-center bg-transparent hover:bg-[var(--bg-elevated-secondary)] active:scale-95 py-3 rounded-xl transition-all outline-none"
//                                     >
//                                         <Delete className="w-6 h-6 text-[var(--label-secondary)]" strokeWidth={2} />
//                                     </button>
//                                 </div>
//                             </motion.div>
//                         )}
//                     </AnimatePresence>
//
//                     {/* NÚT XÁC NHẬN */}
//                     <button
//                         onClick={handleSubmit}
//                         className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#AA771C] text-[#1A1514] text-[16px] font-black shadow-[0_4px_15px_rgba(212,175,55,0.3)] hover:brightness-110 active:scale-[0.98] transition-all outline-none"
//                     >
//                         MỞ KHÓA
//                     </button>
//                 </div>
//             </motion.div>
//         </div>
//     );
// }