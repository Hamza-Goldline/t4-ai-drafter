const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    getCompanyData: () => ipcRenderer.invoke('get-company-data'),
    saveCompanyData: (data) => ipcRenderer.invoke('save-company-data', data),
    startDrafting: () => ipcRenderer.invoke('start-drafting'),
    stopDrafting: () => ipcRenderer.invoke('stop-drafting'),
    onStatusUpdate: (callback) => ipcRenderer.on('status-update', (event, value) => callback(value)),

    // Auth logic
    getEmailProfile: () => ipcRenderer.invoke('get-email-profile'),
    logoutGmail: () => ipcRenderer.invoke('logout-gmail'),

    // Updates
    checkUpdate: () => ipcRenderer.invoke('check-update'),
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (event, value) => callback(value))
});
