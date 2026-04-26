import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="mt-auto pt-16 pb-8 px-4 sm:px-6 lg:px-8 relative z-10 font-sans">
            <div className="max-w-7xl mx-auto apple-glass !rounded-[32px] p-8 md:p-12 shadow-sm border border-[var(--separator)] overflow-hidden">

                <div className="flex flex-col lg:flex-row justify-between items-start gap-10 lg:gap-0">

                    <div className="max-w-md">
                        <div className="flex items-center gap-3 mb-6 select-none">
                            <div className="w-11 h-11 rounded-[14px] bg-[var(--system-orange)] flex items-center justify-center text-[var(--bg-base)] shrink-0 shadow-[0_4px_14px_rgba(255,153,0,0.3)]">
                                <TrendingUp className="sf-icon sf-icon-bold w-6 h-6" />
                            </div>
                            <h2 className="text-[26px] font-black text-[var(--label-primary)] tracking-tight leading-none">
                                Finance<span className="text-[var(--system-orange)]">.</span>
                            </h2>
                        </div>
                        <p className="text-[14px] text-[var(--label-secondary)] leading-relaxed font-medium">
                            Our mission is to empower individuals to track, manage, and grow their wealth with the absolute least amount of effort.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <a href="#" className="flex items-center gap-2.5 px-3 py-1.5 bg-[var(--bg-elevated-secondary)] border border-[var(--border-subtle)] rounded-xl hover:bg-[var(--bg-elevated)] transition-colors outline-none shadow-sm group">
                            <svg className="w-6 h-6 no-dim" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 3.42168L17.728 11.2335L14.7709 14.1906L4 3.42168Z" fill="#00E676"/>
                                <path d="M21.2646 13.2505L17.728 11.2344L14.7709 14.1915L17.8488 17.1485L21.2646 13.2505Z" fill="#FFC107"/>
                                <path d="M4 20.9419L14.7709 14.1914L17.8488 17.1484L4 20.9419Z" fill="#FF3D00"/>
                                <path d="M4 3.42168V20.9419L14.7709 14.1914V14.1914L4 3.42168Z" fill="#29B6F6"/>
                            </svg>
                            <div className="flex flex-col">
                                <span className="text-[9px] text-[var(--label-secondary)] uppercase font-bold leading-none mb-0.5">Get it on</span>
                                <span className="text-[13px] text-[var(--label-primary)] font-semibold leading-none">Google Play</span>
                            </div>
                        </a>

                        <a href="#" className="flex items-center gap-2.5 px-3 py-1.5 bg-[var(--bg-elevated-secondary)] border border-[var(--border-subtle)] rounded-xl hover:bg-[var(--bg-elevated)] transition-colors outline-none shadow-sm group">
                            <svg className="sf-icon sf-icon-regular w-6 h-6 text-[var(--label-primary)]" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M16.365 14.863c-.02-.02-.638-1.428-1.505-2.613-.935-1.278-1.92-2.186-3.031-2.186-1.341 0-2.316.892-3.136 1.636-.837.76-1.53 1.39-2.35 1.39-1.077 0-2.023-.881-2.923-2.12-.835-1.15-1.385-2.484-1.385-4.004 0-3.376 2.308-5.328 4.708-5.328 1.156 0 2.215.536 2.916 1.056.44.327.75.556 1.045.556.28 0 .584-.223 1.011-.539.75-.558 1.874-1.144 3.12-1.144 2.261 0 4.196 1.616 4.606 4.103-2.385 1.002-2.585 4.398-.244 5.67-1.107 2.148-2.812 3.524-2.832 3.524zm-4.787-11.45c-.09.002-.191.002-.294.002-1.433 0-2.684-1.01-3.238-2.428-.158-.403-.239-.838-.239-1.277 0-.083.003-.166.01-.249 1.488.082 2.756 1.086 3.292 2.502.164.425.247.87.247 1.31 0 .048-.002.095-.005.141-.013.004-.027.004-.037.004-.847.016-.848-.005.264-.005z"/>
                            </svg>
                            <div className="flex flex-col">
                                <span className="text-[9px] text-[var(--label-secondary)] uppercase font-bold leading-none mb-0.5">Download on the</span>
                                <span className="text-[13px] text-[var(--label-primary)] font-semibold leading-none">App Store</span>
                            </div>
                        </a>
                    </div>

                </div>

                <div className="mt-12 mb-10 flex flex-wrap items-center gap-x-8 gap-y-4">
                    <Link to="/" className="text-[13.5px] font-bold text-[var(--label-primary)] hover:text-[var(--system-orange)] transition-colors outline-none">Overview</Link>
                    <Link to="/revenue" className="text-[13.5px] font-bold text-[var(--label-primary)] hover:text-[var(--system-orange)] transition-colors outline-none">Money In</Link>
                    <Link to="/expense" className="text-[13.5px] font-bold text-[var(--label-primary)] hover:text-[var(--system-orange)] transition-colors outline-none">Money Out</Link>
                    <Link to="/debts" className="text-[13.5px] font-bold text-[var(--label-primary)] hover:text-[var(--system-orange)] transition-colors outline-none">Loans & Debts</Link>
                    <Link to="/taxes" className="text-[13.5px] font-bold text-[var(--label-primary)] hover:text-[var(--system-orange)] transition-colors outline-none">Tax Center</Link>
                </div>

                <div className="h-px w-full bg-[var(--separator)] mb-8"></div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-6">

                    <div className="text-[13px] text-[var(--label-secondary)] font-medium flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                        <span>Copyright {new Date().getFullYear()} &copy; Finance. All Rights Reserved.</span>
                        <span className="hidden md:inline-block text-[var(--separator)]">|</span>
                        <span>
              Designed & Dev by{' '}
                            <a href="https://github.com/phongnguyen" target="_blank" rel="noopener noreferrer" className="text-[var(--label-primary)] hover:text-[var(--system-orange)] font-bold transition-colors outline-none">
                Nguyễn Thái Phong
              </a>
            </span>
                    </div>

                    <div className="flex items-center gap-5">
                        <a href="#" className="text-[var(--label-secondary)] hover:text-[var(--system-blue)] transition-colors outline-none" aria-label="Facebook">
                            <svg className="sf-icon sf-icon-regular w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" /></svg>
                        </a>
                        <a href="#" className="text-[var(--label-secondary)] hover:text-[var(--label-primary)] transition-colors outline-none" aria-label="X">
                            <svg className="sf-icon sf-icon-regular w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                        </a>
                        <a href="#" className="text-[var(--label-secondary)] hover:text-[#E1306C] transition-colors outline-none" aria-label="Instagram">
                            <svg className="sf-icon sf-icon-regular w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" /></svg>
                        </a>
                        <a href="#" className="text-[var(--label-secondary)] hover:text-[#0077B5] transition-colors outline-none" aria-label="LinkedIn">
                            <svg className="sf-icon sf-icon-regular w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd"/></svg>
                        </a>
                        <a href="https://github.com/phongnguyen" target="_blank" rel="noopener noreferrer" className="text-[var(--label-secondary)] hover:text-[var(--label-primary)] transition-colors outline-none" aria-label="GitHub">
                            <svg className="sf-icon sf-icon-regular w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
                        </a>
                    </div>

                </div>
            </div>
        </footer>
    );
}