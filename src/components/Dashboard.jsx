import React, { useState } from 'react';
import './Dashboard.css';
import { Download, Filter, Calendar as CalendarIcon, Scale, AlertCircle, CheckCircle } from 'lucide-react';
import { employees, shifts, rules } from '../data/mockData';

const BalancePanel = () => {
    return (
        <div className="card balance-panel">
            <div className="panel-header">
                <h3>Balanço Geral</h3>
                <Scale size={18} className="text-secondary" />
            </div>
            <div className="employee-list">
                {employees.map(emp => (
                    <div key={emp.id} className="employee-row">
                        <div className="employee-info">
                            <div className="avatar">{emp.avatar}</div>
                            <div className="name-role">
                                <span className="name">{emp.name}</span>
                                <span className="role">{emp.role}</span>
                            </div>
                        </div>
                        <div className="score-badge">
                            {emp.score} pts
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const RulesPanel = () => {
    return (
        <div className="card rules-panel">
            <div className="panel-header">
                <h3>Regras Ativas</h3>
                <AlertCircle size={18} className="text-secondary" />
            </div>
            <ul className="rules-list">
                {rules.map(rule => (
                    <li key={rule.id} className={`rule-item ${rule.status}`}>
                        <CheckCircle size={16} />
                        <span>{rule.text}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const ShiftCard = ({ shift, employees }) => {
    const judge = employees.find(e => e.id === shift.judgeId);
    const server = employees.find(e => e.id === shift.serverId);

    return (
        <div className="card shift-card">
            <div className="shift-date">
                <span className="day-name">{shift.day}</span>
                <span className="date-num">{shift.date.split('-')[2]}</span>
            </div>
            <div className="shift-details">
                <div className="role-group">
                    <span className="label">Juiz(a)</span>
                    <span className="value">{judge?.name}</span>
                </div>
                <div className="role-group">
                    <span className="label">Servidor(a)</span>
                    <span className="value">{server?.name}</span>
                </div>
            </div>
        </div>
    );
};

export const Dashboard = () => {
    const [filterEmp, setFilterEmp] = useState('all');

    const filteredShifts = filterEmp === 'all'
        ? shifts
        : shifts.filter(s => {
            const emp = employees.find(e => e.name === filterEmp);
            return s.judgeId === emp?.id || s.serverId === emp?.id;
        });

    return (
        <div className="dashboard-container">
            <header className="page-header">
                <div className="header-title">
                    <h1>Escala de Plantão</h1>
                    <span className="subtitle">Janeiro 2026</span>
                </div>
                <div className="header-actions">
                    <div className="filter-wrapper">
                        <Filter size={16} />
                        <select
                            className="filter-select"
                            value={filterEmp}
                            onChange={(e) => setFilterEmp(e.target.value)}
                        >
                            <option value="all">Todos os Funcionários</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.name}>{emp.name}</option>
                            ))}
                        </select>
                    </div>
                    <button className="btn-primary">
                        <Download size={18} />
                        Exportar Excel
                    </button>
                </div>
            </header>

            <div className="dashboard-grid">
                <div className="main-feed">
                    <div className="feed-header">
                        <h2>Plantões de Janeiro</h2>
                        <div className="badge">10 Plantões</div>
                    </div>
                    <div className="shifts-grid">
                        {filteredShifts.map(shift => (
                            <ShiftCard key={shift.id} shift={shift} employees={employees} />
                        ))}
                    </div>
                </div>

                <aside className="right-sidebar">
                    <BalancePanel />
                    <RulesPanel />
                </aside>
            </div>
        </div>
    );
};
