import axios from 'axios';


const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export const getDashboardData = async () => {
    const response = await axios.get(`${API_URL}/dashboard-data`);
    return response.data;
};

export const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const clearAllData = async () => {
    const response = await axios.post(`${API_URL}/clear`);
    return response.data;
};

export const deleteFile = async (fileId) => {
    const response = await axios.delete(`${API_URL}/uploaded-files/${fileId}`);
    return response.data;
};

export const simulateData = async () => {
    const response = await axios.post(`${API_URL}/simulate`);
    return response.data;
};

export const getRecurringTransactions = async () => {
    const response = await axios.get(`${API_URL}/analytics/recurring`);
    return response.data;
};

export const getUploadedFiles = async () => {
    const response = await axios.get(`${API_URL}/uploaded-files`);
    return response.data;
};


export const downloadPDF = async () => {
    const response = await axios.get(`${API_URL}/export-pdf`, {
        responseType: 'blob',
    });


    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'FinSight_Report.pdf');
    document.body.appendChild(link);
    link.click();


    window.URL.revokeObjectURL(url);
};