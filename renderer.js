document.addEventListener('DOMContentLoaded', async () => {
    // Navigation
    const tabs = document.querySelectorAll('.sidebar li');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            const target = tab.getAttribute('data-tab');
            document.getElementById(target).classList.add('active');
        });
    });

    // Dashboard Logic
    const toggleBtn = document.getElementById('toggle-btn');
    const statusIndicator = document.getElementById('status-indicator');
    const activityLog = document.getElementById('activity-log');
    const statsChecked = document.getElementById('stats-checked');
    const statsDrafted = document.getElementById('stats-drafted');

    let isRunning = false;
    let checkedCount = 0;
    let draftedCount = 0;

    toggleBtn.addEventListener('click', async () => {
        if (!isRunning) {
            await window.api.startDrafting();
            toggleBtn.textContent = 'Stop Drafting';
            toggleBtn.classList.add('stop');
            statusIndicator.textContent = 'Online';
            statusIndicator.classList.remove('offline');
            statusIndicator.classList.add('online');
            isRunning = true;
            addLog('System started', 'info');
        } else {
            await window.api.stopDrafting();
            toggleBtn.textContent = 'Start Drafting';
            toggleBtn.classList.remove('stop');
            statusIndicator.textContent = 'Offline';
            statusIndicator.classList.remove('online');
            statusIndicator.classList.add('offline');
            isRunning = false;
            addLog('System stopped', 'info');
        }
    });

    function addLog(message, type = 'info') {
        const div = document.createElement('div');
        div.className = `log-entry ${type}`;
        div.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        activityLog.prepend(div);

        // Limit log size
        if (activityLog.children.length > 50) {
            activityLog.removeChild(activityLog.lastChild);
        }
    }

    // IPC Status Updates
    window.api.onStatusUpdate((data) => {
        if (data.type === 'log') {
            addLog(data.message, 'info');
            if (data.message.includes('Checking')) {
                checkedCount++;
                statsChecked.textContent = checkedCount;
            }
        } else if (data.type === 'error') {
            addLog(data.message, 'error');
        } else if (data.type === 'success') {
            addLog(data.message, 'success');
            draftedCount++;
            statsDrafted.textContent = draftedCount;
        } else if (data.type === 'history-update') {
            updateHistoryList(data.data);
        }
    });

    // History Logic
    const historyList = document.getElementById('history-list');
    function updateHistoryList(historyData) {
        historyList.innerHTML = '';
        historyData.forEach(item => {
            const card = document.createElement('div');
            card.className = 'history-card';
            card.innerHTML = `
                <div class="history-header">
                    <span class="history-id">ID: ${item.id}</span>
                    <span class="history-date">${new Date(item.date).toLocaleString()}</span>
                </div>
                <div class="history-snippet">${item.snippet}</div>
                <div class="history-status status-badge">${item.status}</div>
                <a href="https://mail.google.com/mail/u/0/#drafts/${item.id}" target="_blank" class="history-link">View in Gmail</a>
            `;
            historyList.appendChild(card);
        });
    }

    // Q&A Logic
    const qaList = document.getElementById('qa-list');
    const btnToggleQa = document.getElementById('btn-toggle-qa');
    const btnAddQa = document.getElementById('btn-add-qa');
    const newQaQ = document.getElementById('new-qa-question');
    const newQaA = document.getElementById('new-qa-answer');

    let isQaVisible = false;

    // Toggle Visibility
    btnToggleQa.addEventListener('click', () => {
        isQaVisible = !isQaVisible;
        qaList.style.display = isQaVisible ? 'block' : 'none';
        btnToggleQa.textContent = isQaVisible ? 'Hide Data' : 'Show/Edit All Data';
        if (isQaVisible) loadQA();
    });

    // Add New logic
    btnAddQa.addEventListener('click', async () => {
        const q = newQaQ.value.trim();
        const a = newQaA.value.trim();
        if (!q || !a) return alert("Please fill in both fields.");

        const data = await window.api.getCompanyData();
        if (!data) return;

        if (!data.qa) data.qa = [];
        data.qa.push({ question: q, answer: a });

        const result = await window.api.saveCompanyData(data);
        if (result.success) {
            newQaQ.value = '';
            newQaA.value = '';
            addLog("New Q&A added to knowledge base.", "success");
            if (isQaVisible) loadQA(); // Refresh list if open
        } else {
            alert("Failed to save.");
        }
    });

    async function loadQA() {
        const data = await window.api.getCompanyData();
        if (data && data.qa) {
            renderQA(data.qa);
        }
    }

    function renderQA(qaData) {
        qaList.innerHTML = '';
        qaData.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'qa-item';
            div.innerHTML = `
                <div class="qa-inputs">
                    <label style="font-size:11px; font-weight:bold; color:#999;">QUESTION</label>
                    <input type="text" value="${item.question}" data-index="${index}" class="qa-q">
                    <label style="font-size:11px; font-weight:bold; color:#999;">ANSWER</label>
                    <textarea data-index="${index}" class="qa-a" rows="3">${item.answer}</textarea>
                </div>
                <button class="btn-delete" data-index="${index}">Delete</button>
            `;
            qaList.appendChild(div);
        });

        // Bind change events to save automatically
        document.querySelectorAll('.qa-inputs input, .qa-inputs textarea').forEach(input => {
            input.addEventListener('change', async (e) => {
                const index = e.target.dataset.index;
                const isQuestion = e.target.classList.contains('qa-q');
                const data = await window.api.getCompanyData();

                if (isQuestion) data.qa[index].question = e.target.value;
                else data.qa[index].answer = e.target.value;

                await window.api.saveCompanyData(data);
                addLog("Q&A updated.", "info");
            });
        });

        // Bind delete buttons
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (!confirm("Are you sure?")) return;
                const index = e.target.dataset.index;
                const data = await window.api.getCompanyData();
                data.qa.splice(index, 1);
                await window.api.saveCompanyData(data);
                loadQA(); // Re-render
                addLog("Q&A item deleted.", "info");
            });
        });
    }

    loadQA();

    // Settings Logic
    const gmailAccountDisplay = document.getElementById('gmail-account_display');
    const btnChangeAccount = document.getElementById('btn-change-account');

    async function loadSettings() {
        // App Version
        const version = await window.api.getAppVersion();
        const versionDisplay = document.getElementById('app-version-display');
        if (versionDisplay) versionDisplay.textContent = `Version ${version}`;

        const email = await window.api.getEmailProfile();
        if (email) {
            gmailAccountDisplay.textContent = email;
            gmailAccountDisplay.className = "status-indicator online";
            gmailAccountDisplay.style.color = "#2e7d32";
        } else {
            gmailAccountDisplay.textContent = "Not Connected";
            gmailAccountDisplay.className = "status-indicator offline";
            gmailAccountDisplay.style.color = "#d32f2f";
        }
    }

    // Update Progress Listener
    window.api.onDownloadProgress((percent) => {
        const status = document.getElementById('update-status');
        if (status) {
            status.textContent = `Downloading update: ${Math.round(percent)}%`;
            status.style.color = "blue";
        }
    });

    btnChangeAccount.addEventListener('click', async () => {
        if (confirm("This will disconnect the current account and require you to login again. Continue?")) {
            const res = await window.api.logoutGmail();
            if (res.success) {
                alert("Disconnected. Please restart the app to sign in with a new account.");
                gmailAccountDisplay.textContent = "Disconnected (Restart App)";
            } else {
                alert("Error disconnecting: " + res.error);
            }
        }
    });

    // Load settings when tab is clicked
    document.querySelector('.sidebar li[data-tab="settings"]').addEventListener('click', loadSettings);

    // Update Check Logic
    const btnCheckUpdate = document.getElementById('btn-check-update');
    const updateStatus = document.getElementById('update-status');

    if (btnCheckUpdate) {
        btnCheckUpdate.addEventListener('click', async () => {
            updateStatus.textContent = "Checking for updates...";
            updateStatus.style.color = "#666";

            const result = await window.api.checkUpdate();

            if (result.status === 'error') {
                updateStatus.textContent = "Error: " + result.error;
                updateStatus.style.color = "red";
            } else if (result.status === 'not-packaged') {
                updateStatus.textContent = "App is running in development mode (no updates).";
            } else if (result.status === 'update-available') {
                updateStatus.textContent = "Update available! Creating download...";
                updateStatus.style.color = "green";
            } else if (result.status === 'no-update') {
                updateStatus.textContent = "You are on the latest version.";
                updateStatus.style.color = "green";
            }
        });
    }

    // Also load once on startup just in case
    loadSettings();
});
