import React, { useState, useEffect, useRef } from 'react';
import {
    PieChart, Pie, Cell,
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Upload, Activity, TrendingUp, DollarSign, Trash2, Zap, FileText } from 'lucide-react';
import { 
    downloadPDF, 
    getDashboardData, 
    getRecurringTransactions, 
    getUploadedFiles,
    uploadFile,
    clearAllData,
    simulateData,
    deleteFile
} from '../services/api';

/**
 * Constant Colors for Chart Categories
 */
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

/**
 * Helper to format numbers as USD currency strings.
 */
const fmtCurrency = (n) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n || 0));

/**
 * Main Financial Analytics Dashboard Component.
 * Displays spending metrics, category breakdown, trends, and file management.
 */
const Dashboard = () => {
    // Dashboard States
    const [data, setData] = useState(null);
    const [recurring, setRecurring] = useState([]);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // File upload ref
    const fileInputRef = useRef(null);

    /**
     * Refreshes all dashboard data from the backend.
     */
    const fetchData = async () => {
        try {
            const [dashResult, recResult, filesResult] = await Promise.all([
                getDashboardData(),
                getRecurringTransactions(),
                getUploadedFiles()
            ]);
            
            setData(dashResult);
            setRecurring(recResult);
            setUploadedFiles(filesResult);
        } catch (error) {
            console.error("Dashboard Fetch Error:", error);
        }
    };

    // Initial load
    useEffect(() => {
        fetchData();
    }, []);

    const openFileDialog = () => fileInputRef.current?.click();

    /**
     * Handles new CSV file uploads and refreshes the view.
     */
    const handleFileSelected = async (e) => {
        const selected = e.target.files?.[0];
        if (!selected) return;

        setLoading(true);
        try {
            await uploadFile(selected);
            await fetchData();
        } catch (error) {
            alert("Upload failed. Ensure the CSV has correct headers (date, description, amount).");
        } finally {
            setLoading(false);
            e.target.value = ''; // Reset input
        }
    };

    /**
     * Wipes all data from the database.
     */
    const handleReset = async () => {
        if (!window.confirm("Are you sure you want to permanently delete all data and files?")) return;
        setLoading(true);
        try {
            await clearAllData();
            await fetchData();
        } catch (error) {
            alert("Cleanup failed.");
        } finally {
            setLoading(false);
        }
    };

    /**
     * Populates the database with 6 months of demo data.
     */
    const handleSimulate = async () => {
        setLoading(true);
        try {
            await simulateData();
            await fetchData();
        } catch (error) {
            alert("Data simulation failed.");
        } finally {
            setLoading(false);
        }
    };

    /**
     * Deletes a specific uploaded file and its transactions.
     */
    const handleDeleteFile = async (fileId) => {
        if (!window.confirm("Delete this file and all its associated transactions?")) return;
        setLoading(true);
        try {
            await deleteFile(fileId);
            await fetchData();
        } catch (error) {
            alert("File deletion failed.");
        } finally {
            setLoading(false);
        }
    };

    // Shared Loading State
    if (!data) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center animate-pulse">
                    <Zap className="mx-auto text-indigo-500 mb-4" size={48} />
                    <p className="text-slate-400 font-medium">Powering up FinSight Engine...</p>
                </div>
            </div>
        );
    }

    // AI Forecast Logic (Prioritize backend value)
    const aiForecast = data.forecast_next_month || 0;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                
                {/* --- Header Section --- */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3 tracking-tight">
                            <div className="p-2 bg-indigo-500/10 rounded-lg">
                                <Zap className="text-indigo-500" size={24} />
                            </div>
                            FinSight Engine
                        </h1>
                        <p className="text-slate-500 text-sm mt-1 font-medium">Financial Analytics Dashboard</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleReset}
                            disabled={loading}
                            className="p-2 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-red-400 disabled:opacity-50 transition-colors"
                            title="Reset all data"
                        >
                            <Trash2 size={20} />
                        </button>

                        <button
                            onClick={downloadPDF}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 text-slate-300 font-medium text-sm transition-all disabled:opacity-50"
                        >
                            <FileText size={16} />
                            Export PDF
                        </button>

                        <button
                            onClick={handleSimulate}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 text-slate-300 font-medium text-sm transition-all disabled:opacity-50"
                        >
                            <Activity size={16} className={loading ? "animate-spin" : ""} />
                            Simulate Data
                        </button>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,text/csv"
                            onChange={handleFileSelected}
                            className="hidden"
                        />

                        <button
                            onClick={openFileDialog}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
                        >
                            <Upload size={16} />
                            {loading ? "Processing..." : "Upload CSV"}
                        </button>
                    </div>
                </header>

                {/* --- Key Metrics Section --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <MetricCard 
                        title="Total Spend"
                        value={fmtCurrency(data.total_spending)}
                        subtitle="Lifetime Accumulation"
                        icon={<DollarSign size={80} />}
                    />
                    <MetricCard 
                        title="MoM Growth"
                        value={data.months_count >= 2 ? `${data.growth_rate > 0 ? '+' : ''}${data.growth_rate.toFixed(1)}%` : 'Need 2+ Months'}
                        subtitle={data.months_count >= 2 ? 'vs Previous Month' : 'To calculate growth'}
                        icon={<TrendingUp size={80} />}
                        colorClass={data.months_count >= 2 ? (data.growth_rate > 0 ? 'text-rose-500' : 'text-emerald-500') : 'text-slate-400'}
                    />
                    <MetricCard 
                        title="AI Forecast"
                        value={aiForecast > 0 ? fmtCurrency(aiForecast) : 'Need 2+ Months'}
                        subtitle={aiForecast > 0 ? 'Predicted for Next Month' : 'To run prediction'}
                        icon={<Zap size={80} />}
                        colorClass={aiForecast > 0 ? 'text-white' : 'text-slate-400'}
                    />
                </div>

                {/* --- File Registry Section --- */}
                {uploadedFiles.length > 0 && (
                    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                        <SectionHeader title="Uploaded Documents" />
                        <div className="space-y-3">
                            {uploadedFiles.map((file) => (
                                <FileItem 
                                    key={file.id} 
                                    file={file} 
                                    onDelete={() => handleDeleteFile(file.id)} 
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* --- Charts Section --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <DashboardCard title="Spending by Category">
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.spending_by_category || []}
                                        cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {(data.spending_by_category || []).map((_, idx) => (
                                            <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={tooltipStyles} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </DashboardCard>

                    <DashboardCard title="Spending Trend & Forecast">
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.monthly_trend || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis dataKey="month" stroke="#475569" tick={{ fontSize: 12 }} dy={10} />
                                    <YAxis stroke="#475569" tick={{ fontSize: 12 }} />
                                    <Tooltip cursor={{ stroke: '#334155' }} contentStyle={tooltipStyles} />
                                    <Line 
                                        type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={3} 
                                        dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }} 
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </DashboardCard>
                </div>

                {/* --- Recurring Pattern Section --- */}
                {recurring.length > 0 && (
                    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                        <SectionHeader title="Detected Recurring Subscriptions" />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {recurring.map((item, idx) => (
                                <SubscriptionItem key={idx} item={item} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Styled Sub-components for Clean Structure ---

const MetricCard = ({ title, value, subtitle, icon, colorClass = "text-white" }) => (
    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm relative group overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            {icon}
        </div>
        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">{title}</h3>
        <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
        <p className="text-slate-500 text-xs mt-2 font-medium">{subtitle}</p>
    </div>
);

const SectionHeader = ({ title }) => (
    <h2 className="text-base font-semibold mb-6 text-white flex items-center gap-2">
        <div className="w-1 h-5 bg-indigo-500 rounded-full"></div>
        {title}
    </h2>
);

const DashboardCard = ({ title, children }) => (
    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <SectionHeader title={title} />
        {children}
    </div>
);

const FileItem = ({ file, onDelete }) => (
    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors group">
        <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                <FileText size={20} />
            </div>
            <div>
                <p className="text-sm font-bold text-white leading-tight">{file.filename}</p>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">
                    Uploaded {new Date(file.upload_date).toLocaleDateString()}
                </p>
            </div>
        </div>
        <button onClick={onDelete} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100">
            <Trash2 size={18} />
        </button>
    </div>
);

const SubscriptionItem = ({ item }) => (
    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between group hover:border-indigo-500/50 transition-colors">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                <Activity size={20} />
            </div>
            <div>
                <p className="text-sm font-bold text-white mb-0.5">{item.description}</p>
                <p className="text-xs text-slate-500 font-medium">{item.category} • {item.count} items</p>
            </div>
        </div>
        <div className="text-right">
            <p className="text-sm font-bold text-indigo-400">{fmtCurrency(item.avg_amount)}</p>
            <p className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">MONTHLY</p>
        </div>
    </div>
);

const tooltipStyles = { 
    backgroundColor: '#0f172a', 
    borderColor: '#1e293b', 
    borderRadius: '8px', 
    color: '#f1f5f9' 
};

export default Dashboard;