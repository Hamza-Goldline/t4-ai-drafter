const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
console.log("Main process loading..."); // Debug log
const path = require('path');
const fs = require('fs');

// Global error handlers
process.on('uncaughtException', (error) => {
    console.error("CRITICAL ERROR (Uncaught Exception):", error);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error("CRITICAL ERROR (Unhandled Rejection):", reason);
});

const userDataPath = app.getPath('userData');

// Ensure critical files exist in UserData
function ensureDataFile(filename, subDir = '') {
    const targetDir = subDir ? path.join(userDataPath, subDir) : userDataPath;
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    const targetPath = path.join(targetDir, filename);

    // If it doesn't exist in UserData, try to copy from app resources
    if (!fs.existsSync(targetPath)) {
        console.log(`File missing in UserData: ${targetPath}. Attempting copy...`);
        try {
            // In production, resources are in resources/app.asar handling
            // We use __dirname which resolves correctly in ASAR to read source
            // Check if source exists in 'data' folder or root
            let sourcePath = path.join(__dirname, 'data', filename);
            if (!fs.existsSync(sourcePath)) {
                sourcePath = path.join(__dirname, filename);
            }

            if (fs.existsSync(sourcePath)) {
                fs.copyFileSync(sourcePath, targetPath);
                console.log(`Copied ${filename} to ${targetPath}`);
            } else {
                console.log(`Source file ${filename} not found, skipping copy.`);
            }
        } catch (err) {
            console.error(`Error copying ${filename}:`, err);
        }
    }
    return targetPath;
}

// 1. Setup .env
const envPath = ensureDataFile('.env');
require('dotenv').config({ path: envPath });

// 2. Setup Gmail Service Paths
const gmailService = require('./services/gmailService');
gmailService.setPaths(userDataPath);

// 3. Setup AI Service (load after env)
let aiService;
try {
    console.log("Loading AI Service...");
    aiService = require('./services/aiService');
    console.log("AI Service Loaded.");
} catch (err) {
    console.error("FAILED to load AI Service:", err);
}

// Ensure other data files
ensureDataFile('companyData.json', 'data'); // Creates userData/data/companyData.json
// Note: We'll access companyData via a helper to get the specific path inside userData

// Function to create the main browser window
let mainWindow = null; // Keep global reference

function createWindow() {
    console.log("Creating main window...");
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        backgroundColor: '#f5f7fa', // Set background color to avoid white flash
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        icon: path.join(__dirname, 'assets', 'logo.png')
    });

    mainWindow.loadFile('index.html');
    // mainWindow.webContents.openDevTools(); // Optional: Keep or remove based on preference
    console.log("Window loaded index.html");

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Startup Logic
const startApp = () => {
    console.log("startApp called.");
    createWindow();

    // Auto-updater logging
    autoUpdater.logger = console;
    autoUpdater.logger.transports.file.level = "info";

    // Check for updates immediately
    if (app.isPackaged) {
        console.log("App is packaged, checking for updates...");
        autoUpdater.checkForUpdatesAndNotify();
    }

    // Update events
    autoUpdater.on('update-available', () => {
        console.log("Update available!");
        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Update Available',
            message: 'A new version of T4 Ai Drafter is available. It will be downloaded in the background.',
            buttons: ['OK']
        });
    });

    autoUpdater.on('update-downloaded', () => {
        console.log("Update downloaded!");
        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Update Ready',
            message: 'A new version has been downloaded. Restart the application to apply the updates.',
            buttons: ['Restart', 'Later']
        }).then((result) => {
            if (result.response === 0) {
                autoUpdater.quitAndInstall();
            }
        });
    });

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
};

// Handle manual update check from renderer
ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});

ipcMain.handle('check-update', async () => {
    if (!app.isPackaged) return { status: 'not-packaged' };

    try {
        const result = await autoUpdater.checkForUpdates();
        // result.updateInfo exists if update is available
        // But importantly, result is null if check failed? No, promise rejects.
        // If no update, result is defined but result.downloadPromise might be null?
        // Actually Electron-Updater returns UpdateCheckResult

        // If we are here, check was successful.
        // We rely on 'update-available' event for the dialog, but we want to return status to renderer.

        // Check if update is available based on result
        if (result && result.updateInfo && result.updateInfo.version !== app.getVersion()) {
            // Technically version check logic is internal, but...
            // Let's trust the promise result.
            // If update is available, autoUpdater will emit 'update-available'
            return { status: 'update-available', version: result.updateInfo.version };
        } else {
            return { status: 'no-update' };
        }
    } catch (error) {
        console.error("Update check error:", error);
        return { status: 'error', error: error.message };
    }
});

autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "Download speed: " + progressObj.bytesPerSecond;
    log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    console.log(log_message);
    if (mainWindow) {
        mainWindow.webContents.send('download-progress', progressObj.percent);
    }
});

if (app.isReady()) {
    console.log("App is ALREADY ready. execution startApp immediately.");
    startApp();
} else {
    console.log("App not ready yet. Waiting for 'ready' event.");
    app.on('ready', () => {
        console.log("App 'ready' event fired.");
        startApp();
    });
}

// Quit when all windows are closed
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});



// Diagnostic Heartbeat
console.log("End of synchronous main.js execution.");
setInterval(() => {
    console.log(`Heartbeat: Event loop alive. App.isReady() = ${app.isReady()}`);
}, 1000);

// Try disabling hardware accel if it's crashing the GPU process
app.disableHardwareAcceleration();

let draftingInterval = null;

// IPC Handlers
ipcMain.handle('get-email-profile', async () => {
    try {
        const auth = await gmailService.authorize();
        if (!auth) return null;
        const profile = await gmailService.getProfile(auth);
        return profile.emailAddress;
    } catch (error) {
        console.error("Error fetching profile:", error);
        return null;
    }
});

ipcMain.handle('logout-gmail', async () => {
    try {
        const tokenPath = path.join(userDataPath, 'token.json');
        if (fs.existsSync(tokenPath)) {
            fs.unlinkSync(tokenPath);
        }
        return { success: true };
    } catch (error) {
        console.error("Logout error:", error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-company-data', async () => {
    try {
        const dataPath = path.join(userDataPath, 'data', 'companyData.json');
        if (!fs.existsSync(dataPath)) return null;
        const data = fs.readFileSync(dataPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading company data:', error);
        return null;
    }
});

ipcMain.handle('save-company-data', async (event, newData) => {
    try {
        const dataPath = path.join(userDataPath, 'data', 'companyData.json');
        fs.writeFileSync(dataPath, JSON.stringify(newData, null, 2));
        return { success: true };
    } catch (error) {
        console.error('Error saving company data:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('start-drafting', async (event) => {
    console.log('Starting drafting service...');
    if (draftingInterval) return "Already running";

    // Initial check
    checkAndDraft(event.sender);

    // Loop every 60 seconds
    draftingInterval = setInterval(() => {
        checkAndDraft(event.sender);
    }, 60000);

    return "Started";
});

ipcMain.handle('stop-drafting', async () => {
    console.log('Stopping drafting service...');
    if (draftingInterval) {
        clearInterval(draftingInterval);
        draftingInterval = null;
    }
    return "Stopped";
});

async function checkAndDraft(webContents) {
    try {
        console.log("--- Starting Draft Check ---");
        webContents.send('status-update', { type: 'log', message: 'Checking for new emails...' });

        const auth = await gmailService.authorize();
        if (!auth) {
            console.log("Gmail auth failed!");
            webContents.send('status-update', { type: 'error', message: 'Gmail auth failed. Check credentials.' });
            return;
        }

        const messages = await gmailService.listUnreadMessages(auth);
        console.log(`Found ${messages.length} unread messages.`);

        if (messages.length === 0) {
            webContents.send('status-update', { type: 'log', message: 'No new unread messages.' });
            return;
        }

        const dataPath = path.join(userDataPath, 'data', 'companyData.json');
        const companyData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

        for (const msg of messages) {
            console.log(`Processing email ID: ${msg.id}`);
            webContents.send('status-update', { type: 'log', message: `Reading email ${msg.id}...` });
            const messageDetails = await gmailService.getMessage(auth, msg.id);
            const snippet = messageDetails.snippet;

            console.log(`Snippet: ${snippet.substring(0, 50)}...`);
            webContents.send('status-update', { type: 'log', message: `Thinking on email ${msg.id}...` });

            let replyContent;
            try {
                replyContent = await aiService.generateReply(snippet, companyData);
                console.log(`AI Generated Reply: ${replyContent.substring(0, 50)}...`);
            } catch (err) {
                console.error(`AI Error for ${msg.id}:`, err);
                webContents.send('status-update', { type: 'error', message: `AI Error: ${err.message}` });
                continue;
            }

            console.log(`Creating draft for ${msg.id}...`);
            webContents.send('status-update', { type: 'log', message: `Drafting reply for ${msg.id}...` });

            const footerHtml = `
<br><br>
<div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
  <p style="color: #333">
    <strong>Email:</strong> <a href="mailto:daniella@twenty4storage.com" style="color: #0000EE; text-decoration: underline;">daniella@twenty4storage.com</a><br>
    <strong>Office:</strong> +44 (0) 113 426 9111<br>
    Chelsea Close<br>
    Leeds<br>
    LS12 4HP
  </p>
  <p>
    <a href="https://www.twenty4storage.com" style="color: #0000EE; text-decoration: underline;">www.twenty4storage.com</a>
  </p>
  <p>
    <img src="cid:logo_wide" alt="Twenty4 Secure Storage" style="width: 250px; height: auto;">
  </p>
  <p>
    <strong>Award winning service</strong><br>
    Voted Best Container Self Storage Facility 2020.
  </p>
  <p>
    <img src="cid:award_2020" alt="2020 Best Container Self Storage Facility" style="width: 200px; height: auto;">
  </p>
  <p style="font-size: 10px; color: #666;">
    This email and any attachments to it may be confidential and are intended solely for the use of the individual to whom it is addressed. Any views or opinions expressed are solely those of the author and do not necessarily represent those of Twenty4 Secure Storage. If you are not the intended recipient of this email, you must neither take any action based upon its contents, nor copy or show it to anyone. Please contact the sender if you believe you have received this email in error.
  </p>
</div>
`;

            const attachments = [
                { path: path.join(__dirname, 'assets', 'logo_wide.png'), cid: 'logo_wide', contentType: 'image/png' },
                { path: path.join(__dirname, 'assets', 'award_2020.jpg'), cid: 'award_2020', contentType: 'image/jpeg' }
            ];

            const fullHtml = replyContent + footerHtml;

            await gmailService.createDraft(auth, messageDetails, fullHtml, attachments);

            console.log(`Marking ${msg.id} as read...`);
            await gmailService.markAsRead(auth, msg.id);

            webContents.send('status-update', { type: 'success', message: `Draft created for ${msg.id}` });

            // Log to history
            const historyPath = path.join(userDataPath, 'data', 'history.json');
            ensureDataFile('history.json', 'data'); // Ensure it exists before reading/writing

            let history = [];
            if (fs.existsSync(historyPath)) {
                try {
                    history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
                } catch (e) {
                    history = [];
                }
            }
            history.unshift({
                id: msg.id,
                snippet: snippet,
                date: new Date().toISOString(),
                status: 'Drafted'
            });
            fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));

            webContents.send('status-update', { type: 'history-update', data: history });
            console.log(`Finished processing ${msg.id}`);
        }
        console.log("--- Draft Check Complete ---");
    } catch (error) {
        console.error("Error in draft loop:", error);
        webContents.send('status-update', { type: 'error', message: `Error: ${error.message}` });
    }
}

