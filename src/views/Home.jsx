import React from 'react';
import { Link } from 'react-router-dom';

// IMPORT ẢNH TRỰC TIẾP VÀO ĐÂY
import macMockup from '../assets/macOS.png';
import iphoneMockup from '../assets/mobile-iphone.png';
import vcbCardMockup from '../assets/vcb-priority.png';

export default function Home() {
    // Hàm xử lý cuộn mượt khi bấm vào các link neo (anchor links)
    const handleSmoothScroll = (e, targetId) => {
        e.preventDefault();
        const target = document.querySelector(targetId);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen overflow-x-hidden bg-[var(--bg-base)]">

            {/* SCOPED STYLES */}
            <style>{`
        .logo-custom {
          background-image: url('/src/assets/logo-1.png');
          background-repeat: no-repeat;
          background-size: 30%;
          background-position: center;
        }
        .perspective-1000 { perspective: 1000px; }
        .rotate-x-6 { transform: rotateX(6deg) rotateY(-1deg) scale(0.98); }
        .hover-rotate-x-0:hover { transform: rotateX(0deg) rotateY(0deg) scale(1); }
        .rotate-y-12 { transform: rotateY(-12deg) rotateX(5deg); }
        
        @keyframes float {
          0% { transform: translateY(0px) rotate(-12deg); }
          50% { transform: translateY(-18px) rotate(-10deg); }
          100% { transform: translateY(0px) rotate(-12deg); }
        }
        .float-animation {
          animation: float 6s ease-in-out infinite;
        }
        .float-animation:hover {
          animation-play-state: paused;
        }
      `}</style>

            {/* NAVBAR */}
            <nav className="fixed top-0 inset-x-0 z-50 apple-glass !rounded-none !border-x-0 !border-t-0 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-28">

                        <div className="flex-shrink-0 flex items-center cursor-pointer">
                            <div className="logo-custom w-56 h-20 transition-all no-dim"></div>
                        </div>

                        <div className="hidden md:flex flex-1 justify-center items-center gap-2">
                            <div className="flex items-center space-x-3 bg-[var(--bg-elevated-secondary)] px-4 py-2 rounded-full border border-[var(--border-subtle)] shadow-sm">
                                <a href="#features" onClick={(e) => handleSmoothScroll(e, '#features')} className="nav-item !px-2 !py-1 !mt-0 !text-[13px] hover:!bg-transparent">Tính năng</a>
                                <div className="w-[1px] h-4 bg-[var(--separator)]"></div>
                                <a href="#exclusive-card" onClick={(e) => handleSmoothScroll(e, '#exclusive-card')} className="nav-item !px-2 !py-1 !mt-0 !text-[13px] hover:!bg-transparent">Đặc quyền</a>
                                <div className="w-[1px] h-4 bg-[var(--separator)]"></div>
                                <a href="#about" onClick={(e) => handleSmoothScroll(e, '#about')} className="nav-item !px-2 !py-1 !mt-0 !text-[13px] hover:!bg-transparent">Về dự án</a>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button className="caption font-semibold hover:text-[var(--label-primary)] transition-colors outline-none">
                                VN <span className="opacity-50">/ EN</span>
                            </button>

                            {/* Nút Mở ứng dụng - MÀU VÀNG GOLD */}
                            <Link to="/dashboard" className="flex items-center justify-center px-7 py-3 text-[14px] font-black text-[#1A1514] bg-gradient-to-r from-[#FDE08B] via-[#D4AF37] to-[#AA771C] hover:brightness-110 rounded-full transition-all shadow-[0_4px_15px_rgba(212,175,55,0.3)] hover:shadow-[0_6px_20px_rgba(212,175,55,0.4)]">
                                Mở ứng dụng
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* HERO SECTION */}
            <main className="relative pt-48 pb-24 sm:pt-56 sm:pb-32 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#D4AF37]/10 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-20">
                    {/* CHỮ MÀU VÀNG GOLD */}
                    <h2 className="font-black text-4xl md:text-6xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#AA771C] drop-shadow-sm pb-1">
                        Tài chính cá nhân
                    </h2>
                    <br />
                    <h2 className="font-black text-4xl md:text-5xl text-[var(--label-primary)] mt-1">Được định hình lại.</h2>
                    <br />

                    <p className="caption max-w-2xl mx-auto text-[18px] md:text-[21px] mt-4 leading-relaxed">
                        Tôi xây dựng Góc Tài Chính không phải một sản phẩm thương mại, mà là trợ lý số hoàn mỹ cho chính mình. Nơi mọi giao dịch, dòng tiền được tĩnh lược, thông minh và riêng tư tuyệt đối.
                    </p>

                    <div className="mt-12 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center gap-5">
                        <Link to="/dashboard" className="w-full flex items-center justify-center px-10 py-4 text-[15px] font-bold rounded-full bg-[var(--label-primary)] text-[var(--bg-base)] hover:scale-105 transition-transform duration-300 md:w-auto shadow-sm">
                            Trải nghiệm ngay
                        </Link>
                        <a href="#features" onClick={(e) => handleSmoothScroll(e, '#features')} className="mt-3 w-full flex items-center justify-center px-10 py-4 text-[15px] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-full font-bold hover:bg-[var(--bg-elevated-secondary)] text-[var(--label-primary)] transition-colors md:mt-0 md:w-auto shadow-sm">
                            Tìm hiểu thêm <span aria-hidden="true" className="ml-2">→</span>
                        </a>
                    </div>
                </div>

                {/* 3D MOCKUPS SECTION (Chỉ còn Mac và iPhone) */}
                <div className="mt-24 relative max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-[500px] md:h-[700px] flex justify-center perspective-1000">

                    {/* Mac Mockup */}
                    <div className="absolute top-0 w-[90%] md:w-[80%] max-w-[1000px] apple-glass !rounded-b-none !rounded-t-[2.5rem] rotate-x-6 hover-rotate-x-0 transition-transform duration-700 ease-out z-10 overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.12)]">
                        <div className="w-full h-8 md:h-12 bg-[var(--bg-elevated)] border-b border-[var(--separator)] flex items-center px-4 gap-2">
                            <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#FF5F56]"></div>
                            <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#FFBD2E]"></div>
                            <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#27C93F]"></div>
                        </div>
                        <img src={macMockup} alt="Mac Mockup" className="w-full h-auto object-cover opacity-90 no-dim" />
                    </div>

                    {/* iPhone Mockup */}
                    <div className="absolute -bottom-10 right-4 md:right-[15%] w-[160px] md:w-[280px] rounded-[2rem] md:rounded-[3rem] border-4 md:border-8 border-gray-950 dark:border-gray-800 bg-white dark:bg-black shadow-[0_30px_70px_rgba(0,0,0,0.4)] z-30 transform hover:-translate-y-4 rotate-y-12 transition-transform duration-500 overflow-hidden">
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1/3 h-5 md:h-7 bg-black rounded-full z-40"></div>
                        <img src={iphoneMockup} alt="iPhone Mockup" className="w-full h-full object-cover no-dim" />
                    </div>
                </div>
            </main>

            {/* MỤC DÀNH RIÊNG CHO THẺ VIETCOMBANK PRIORITY */}
            <section id="exclusive-card" className="py-24 sm:py-32 relative overflow-hidden border-t border-[var(--separator)] bg-[var(--bg-elevated-secondary)]/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">

                        {/* Nửa Trái: Ảnh Thẻ 3D */}
                        <div className="flex-1 w-full max-w-[500px] lg:max-w-none relative perspective-1000">
                            {/* Ánh sáng glow đằng sau thẻ */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] md:w-[400px] md:h-[400px] bg-[#D4AF37]/20 rounded-full blur-[80px] pointer-events-none z-0"></div>

                            {/* Khối chứa ảnh thẻ nổi */}
                            <div className="float-animation hover:scale-105 transition-transform duration-500 relative z-10">
                                <img
                                    src={vcbCardMockup}
                                    alt="Thẻ Vietcombank Priority Signature"
                                    className="w-full h-auto object-contain drop-shadow-[0_40px_60px_rgba(0,0,0,0.5)] rounded-3xl"
                                />
                            </div>
                        </div>

                        {/* Nửa Phải: Nội dung mô tả */}
                        <div className="flex-1 text-center lg:text-left z-20">
                            <h3 className="text-[14px] font-bold tracking-[0.2em] text-[#D4AF37] uppercase mb-4">Đẳng cấp tinh hoa</h3>
                            <h2 className="font-black text-3xl md:text-5xl text-[var(--label-primary)] mb-6 leading-tight">
                                Quyền năng <br/> trong tầm tay.
                            </h2>
                            <p className="caption text-[17px] md:text-[19px] max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed">
                                Tích hợp hiển thị giao diện thẻ <strong>Vietcombank Priority Signature</strong>. Góc Tài Chính không chỉ đồng bộ hóa chi tiêu mà còn tôn vinh phong cách sống của bạn qua từng điểm chạm thị giác.
                            </p>

                            <ul className="space-y-6 text-left max-w-md mx-auto lg:mx-0">
                                <li className="flex items-start gap-4">
                                    <div className="w-8 h-8 mt-1 rounded-full bg-[#D4AF37]/10 flex items-center justify-center shrink-0 border border-[#D4AF37]/20">
                                        <svg className="w-4 h-4 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <div>
                                        <h4 className="text-[16px] font-bold text-[var(--label-primary)] mb-1">Mã hóa cấp Ngân hàng</h4>
                                        <p className="caption text-[14px]">Dữ liệu được bảo vệ an toàn với tiêu chuẩn bảo mật tối cao.</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-4">
                                    <div className="w-8 h-8 mt-1 rounded-full bg-[#D4AF37]/10 flex items-center justify-center shrink-0 border border-[#D4AF37]/20">
                                        <svg className="w-4 h-4 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <div>
                                        <h4 className="text-[16px] font-bold text-[var(--label-primary)] mb-1">Thiết kế Giấu số (Numberless)</h4>
                                        <p className="caption text-[14px]">Mô phỏng mặt trước thẻ không dập nổi thông tin, đảm bảo tính riêng tư tuyệt đối ngay cả khi trình chiếu.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>

                    </div>
                </div>
            </section>

            {/* FEATURES SECTION */}
            <section id="features" className="py-24 border-t border-[var(--separator)] relative overflow-hidden">
                <div className="absolute inset-0 trong-dong-pattern pointer-events-none"></div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h2 className="font-black text-4xl md:text-5xl text-[var(--label-primary)]">Thiết kế cho sự tập trung.</h2>
                        <p className="caption mt-4 text-[17px] max-w-xl mx-auto">Tĩnh lược tối đa để bạn chỉ nhìn thấy những con số thực sự quan trọng.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        <div className="apple-glass p-8 group hover:-translate-y-2 hover:shadow-lg transition-all duration-300">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-7 bg-[var(--bg-elevated-secondary)] border border-[var(--border-subtle)]">
                                <svg className="sf-icon sf-icon-bold w-6 h-6 text-[#D4AF37] group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <h3 className="font-bold text-xl text-[#D4AF37]">Giao dịch 1-Chạm</h3>
                            <p className="caption mt-4 text-[14px]">Đừng để việc ghi chép làm mất thời gian của bạn. Hệ thống tĩnh lược mọi bước thừa, thêm giao dịch mới chỉ trong "một nốt nhạc".</p>
                        </div>

                        <div className="apple-glass p-8 group hover:-translate-y-2 hover:shadow-lg transition-all duration-300">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-7 bg-[var(--bg-elevated-secondary)] border border-[var(--border-subtle)]">
                                <svg className="sf-icon sf-icon-bold w-6 h-6 text-[var(--label-primary)] group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            </div>
                            <h3 className="font-bold text-xl text-[var(--label-primary)]">Pháo đài Riêng tư</h3>
                            <p className="caption mt-4 text-[14px]">Dữ liệu tài chính là tài sản quý giá nhất. Góc Tài Chính được mã hóa an toàn, nằm gọn trên nền tảng Azure SQL.</p>
                        </div>

                        <div className="apple-glass p-8 group hover:-translate-y-2 hover:shadow-lg transition-all duration-300">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-7 bg-[var(--bg-elevated-secondary)] border border-[var(--border-subtle)]">
                                <svg className="sf-icon sf-icon-bold w-6 h-6 text-[#D4AF37] group-hover:scale-y-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
                            </div>
                            <h3 className="font-bold text-xl text-[#D4AF37]">Trí tuệ Phân tích</h3>
                            <p className="caption mt-4 text-[14px]">Nhìn thấu bức tranh tài chính qua các biểu đồ thông minh, trực quan theo phong cách Apple. Hiểu rõ tiền của bạn đang chảy đi đâu.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* MÔ TẢ VỀ DỰ ÁN (ABOUT SECTION) */}
            <section id="about" className="py-24 sm:py-32 border-t border-[var(--separator)] relative overflow-hidden bg-[var(--bg-elevated-secondary)]/40">
                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
                    <h2 className="font-black text-3xl md:text-5xl text-[var(--label-primary)] mb-8 tracking-tight">Về Góc Tài Chính.</h2>

                    <div className="space-y-6 text-[16px] md:text-[19px] text-[var(--label-secondary)] leading-relaxed font-medium">
                        <p>
                            Dự án được thai nghén và phát triển độc lập bởi <strong className="text-[#D4AF37]">Nguyễn Thái Phong</strong>. Xuất phát từ nhu cầu tìm kiếm một công cụ quản lý tài chính cá nhân tĩnh lược, không chứa quảng cáo rác, không thừa thãi tính năng và đề cao tuyệt đối sự riêng tư.
                        </p>
                        <p>
                            Toàn bộ kiến trúc hệ thống được xây dựng theo chuẩn <strong className="text-[var(--label-primary)]">Enterprise Cấp Doanh Nghiệp</strong>: Vận hành mượt mà trên nền tảng Frontend <strong className="text-[#61DAFB]">ReactJS + Vite</strong>, xử lý logic máy chủ mạnh mẽ bằng <strong className="text-[#6DB33F]">Java Spring Boot</strong> và lưu trữ dữ liệu an toàn trên đám mây <strong className="text-[#0078D4]">Microsoft Azure SQL</strong>.
                        </p>
                        <p>
                            Hơn cả một ứng dụng ghi chép, đây là một tác phẩm công nghệ mang đậm triết lý thiết kế phẳng của Apple, nơi mọi dòng tiền của bạn được minh bạch hóa thông qua lăng kính phân tích của các thuật toán Trí tuệ Nhân tạo (AI).
                        </p>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="py-16 border-t border-[var(--separator)] transition-colors bg-[var(--bg-base)]">
                <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center">
                    <div className="logo-custom w-56 h-20 mb-8 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700 no-dim"></div>

                    <div className="flex items-center justify-center gap-8 mb-8">
                        <a href="#" className="caption hover:text-[#D4AF37] transition-colors"><span className="sr-only">GitHub</span>
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
                        </a>
                        <a href="#" className="caption hover:text-[#D4AF37] transition-colors"><span className="sr-only">Facebook</span>
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
                        </a>
                    </div>
                    <p className="caption text-[14px]">
                        Ý tưởng bởi <span className="font-bold text-[var(--label-primary)]">Nguyễn Thái Phong</span>. Sáng tạo 2026.
                    </p>
                    <p className="caption text-[13px] mt-2">
                        Sản phẩm cá nhân. Không vì mục đích thương mại.
                    </p>
                </div>
            </footer>

        </div>
    );
}