import React from 'react';
import './Layout.css';
import { LayoutDashboard, Users, FileText, Settings, LogOut } from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, active }) => (
    <div className={`sidebar-item ${active ? 'active' : ''}`}>
        <Icon size={20} />
        <span>{label}</span>
    </div>
);

export const Layout = ({ children }) => {
    return (
        <div className="layout">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="logo-icon">EP</div>
                    <span className="logo-text">Escala 2026</span>
                </div>

                <nav className="sidebar-nav">
                    <SidebarItem icon={LayoutDashboard} label="Dashboard" active />
                    <SidebarItem icon={Users} label="Equipe" />
                    <SidebarItem icon={FileText} label="Relatórios" />
                    <SidebarItem icon={Settings} label="Configurações" />
                </nav>

                <div className="sidebar-footer">
                    <SidebarItem icon={LogOut} label="Sair" />
                </div>
            </aside>

            <main className="main-content">
                {children}
            </main>
        </div>
    );
};
