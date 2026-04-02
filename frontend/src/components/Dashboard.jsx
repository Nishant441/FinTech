import React, { useState, useEffect, useRef } from 'react';
import {
    PieChart, Pie, Cell,
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Upload, Activity, TrendingUp, DollarSign, Trash2, Zap, FileText } from 'lucide-react';
import { downloadPDF } from '../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const fmtCurrency = (n) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n || 0));

const forecastNextMonth = (monthlyTrend) => {
    if (!Array.isArray(monthlyTrend) || monthlyTrend.length < 2) return 0;
    const y = monthlyTrend.map((d) => Number(d.amount ?? d.total ?? 0));
    const n = y.length;
    const x = Array.from({ length: n }, (_, i) => i);

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);

    const denom = n * sumXX - sumX * sumX;
    if (denom === 0) return y[n - 1];

    const b = (n * sumXY - sumX * sumY) / denom;
    const a = (sumY - b * sumX) / n;

    const nextX = n;
    const pred = a + b * nextX;

    return Math.max(0, pred);
};

const Dashboard = () => {
    const [data, setData] = useState(null);
    const [recurring, setRecurring] = useState([]);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    const fetchData = async () => {
        try {
            const [dashRes, recRes, filesRes] = await Promise.all([
                fetch('http://localhost:8000/dashboard-data'),
                fetch('http://localhost:8000/analytics/recurring'),
                fetch('http://localhost:8000/uploaded-files')
            ]);
            
            const dashResult = await dashRes.json();
            const recResult = await recRes.json();
            const filesResult = await filesRes.json();
            
            setData(dashResult);
            setRecurring(recResult);
            setUploadedFiles(filesResult);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openFileDialog = () => fileInputRef.current?.click();

    const handleFileSelected = async (e) => {
        const selected = e.target.files?.[0];
        if (!selected) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('file', selected);

        try {
            await fetch('http://localhost:8000/upload', { method: 'POST', body: formData });
            await fetchData();
        } catch (error) {
            console.error("Error uploading file:", error);
            alert("Upload failed.");
        } finally {
            setLoading(false);
            e.target.value = '';
        }
    };

    const handleReset = async () => {
        if (!window.confirm("Delete all data?")) return;
        setLoading(true);
        try {
            await fetch('http://localhost:8000/clear', { method: 'POST' });
            await fetchData();
        } catch (error) {
            console.error("Error clearing data:", error);
            alert("Clear failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleSimulate = async () => {
        setLoading(true);
        try {
            await fetch('http://localhost:8000/simulate', { method: 'POST' });
            await fetchData();
        } catch (error) {
            console.error("Error simulating data:", error);
            alert("Simulate failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteFile = async (fileId) => {
        if (!window.confirm("Delete this file and all its transactions?")) return;
        setLoading(true);
        try {
            await fetch(`http://localhost:8000/uploaded-files/${fileId}`, { method: 'DELETE' });
            await fetchData();
        } catch (error) {
            console.error("Error deleting file:", error);
            alert("Delete failed.");
        } finally {
            setLoading(false);
        }
    };

    if (!data) return <div className="p-8 text-center text-slate-200">Loading dashboard...</div>;

    const aiForecast =
        data.forecast_next_month ??
        data.ai_forecast ??
        forecastNextMonth(data.monthly_trend);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
            <div className="max-w-7xl mx-auto p-6 space-y-6">
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
                            title="Delete all data"
                        >
                            <Trash2 size={20} />
                        </button>


                        <button
                            onClick={downloadPDF}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 text-slate-300 font-medium text-sm transition-all disabled:opacity-50"
                            title="Export PDF Report"
                        >
                            <FileText size={16} />
                            Export PDF
                        </button>

                        <button
                            onClick={handleSimulate}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 text-slate-300 font-medium text-sm transition-all disabled:opacity-50"
                            title="Generate demo data"
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
                            title="Upload CSV"
                        >
                            <Upload size={16} />
                            {loading ? "Processing..." : "Upload CSV"}
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <DollarSign size={80} />
                        </div>
                        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Total Spend</h3>
                        <p className="text-3xl font-bold text-white flex items-center gap-2">
                            {Number(data.total_spending ?? 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </p>
                        <p className="text-slate-500 text-xs mt-2 font-medium">Lifetime Accumulation</p>
                    </div>

                    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <TrendingUp size={80} />
                        </div>
                        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">MoM Growth</h3>
                        {data.months_count >= 2 ? (
                            <>
                                <p
                                    className={`text-3xl font-bold flex items-center gap-2 ${Number(data.growth_rate ?? 0) > 0 ? 'text-rose-500' : 'text-emerald-500'}`}
                                >
                                    {Number(data.growth_rate ?? 0) > 0 ? '+' : ''}{Number(data.growth_rate ?? 0).toFixed(1)}%
                                </p>
                                <p className="text-slate-500 text-xs mt-2 font-medium">vs Previous Month</p>
                            </>
                        ) : (
                            <>
                                <p className="text-xl font-bold text-slate-400">Need 2+ Months</p>
                                <p className="text-slate-600 text-xs mt-2 font-medium">To calculate growth</p>
                            </>
                        )}
                    </div>

                    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Zap size={80} />
                        </div>
                        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">AI Forecast</h3>
                        {aiForecast > 0 ? (
                            <>
                                <p className="text-3xl font-bold text-white flex items-center gap-2">
                                    {fmtCurrency(aiForecast)}
                                </p>
                                <p className="text-slate-500 text-xs mt-2 font-medium">Predicted for Next Month</p>
                            </>
                        ) : (
                            <>
                                <p className="text-xl font-bold text-slate-400">Need 2+ Months</p>
                                <p className="text-slate-600 text-xs mt-2 font-medium">To run prediction</p>
                            </>
                        )}
                    </div>
                </div>

                {uploadedFiles.length > 0 && (
                    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm">
                        <h2 className="text-base font-semibold mb-6 text-white flex items-center gap-2">
                            <div className="w-1 h-5 bg-indigo-500 rounded-full"></div>
                            Uploaded Documents
                        </h2>
                        <div className="space-y-3">
                            {uploadedFiles.map((file) => (
                                <div key={file.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors group">
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
                                    <button 
                                        onClick={() => handleDeleteFile(file.id)}
                                        className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        title="Delete file and transactions"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm">
                        <h2 className="text-base font-semibold mb-6 text-white flex items-center gap-2">
                            <div className="w-1 h-5 bg-indigo-500 rounded-full"></div>
                            Spending by Category
                        </h2>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.spending_by_category || []}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {(data.spending_by_category || []).map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f1f5f9' }}
                                        itemStyle={{ color: '#e2e8f0' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm">
                        <h2 className="text-base font-semibold mb-6 text-white flex items-center gap-2">
                            <div className="w-1 h-5 bg-indigo-500 rounded-full"></div>
                            Spending Trend & Forecast
                        </h2>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={data.monthly_trend || []}
                                    margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis
                                        dataKey="month"
                                        stroke="#475569"
                                        tick={{ fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        stroke="#475569"
                                        tick={{ fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `$${value}`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f1f5f9' }}
                                        cursor={{ stroke: '#334155', strokeWidth: 1 }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} />
                                    <Line
                                        type="monotone"
                                        dataKey="amount"
                                        stroke="#6366f1"
                                        strokeWidth={3}
                                        dot={{ fill: '#6366f1', r: 4, strokeWidth: 0 }}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {recurring.length > 0 && (
                    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm">
                        <h2 className="text-base font-semibold mb-6 text-white flex items-center gap-2">
                            <div className="w-1 h-5 bg-indigo-500 rounded-full"></div>
                            Detected Recurring Subscriptions
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {recurring.map((item, idx) => (
                                <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between group hover:border-indigo-500/50 transition-colors">
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
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;