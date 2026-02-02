const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const gmailService = require('./services/gmailService');

async function verify() {
    const log = (msg) => {
        console.log(msg);
        fs.appendFileSync('verification_result.txt', msg + '\n');
    };

    // Clear previous log
    fs.writeFileSync('verification_result.txt', '');

    log("--- Starting API Verification ---");
    let allGood = true;

    // 1. Check .env
    log("\n[1] Checking Environment Variables...");
    if (process.env.GEMINI_API_KEY) {
        log("✅ GEMINI_API_KEY found.");
    } else {
        log("❌ GEMINI_API_KEY is MISSING in .env");
        allGood = false;
    }

    // 2. Check Credentials
    log("\n[2] Checking Google Credentials...");
    const credPath = path.join(__dirname, 'credentials.json');
    if (fs.existsSync(credPath)) {
        log("✅ credentials.json found.");
    } else if (process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET) {
        log("✅ credentials.json missing but ENV vars present. Service will auto-generate it.");
    } else {
        log("❌ credentials.json is MISSING. Please download it from Google Cloud Console.");
        allGood = false;
    }

    // 3. Verify Gemini API
    log("\n[3] Testing Gemini API Connection...");
    if (process.env.GEMINI_API_KEY) {
        try {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            // const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });
            // const result = await model.generateContent("Say 'Hello from Gemini!'");
            // log("✅ Gemini Response: " + result.response.text().trim());

            // List models to debug
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Fallback init
            log("    Listing available models...");
            // Note: The Node SDK for listing models is slightly different.
            // We can just try a few known ones.

            const modelsToTry = ["gemini-2.5-flash-preview-09-2025", "gemini-1.5-flash", "gemini-pro"];
            let workingModel = null;

            for (const m of modelsToTry) {
                try {
                    log(`    Testing model: ${m}...`);
                    const testModel = genAI.getGenerativeModel({ model: m });
                    const r = await testModel.generateContent("Hi");
                    log(`    ✅ Model ${m} WORKS!`);
                    workingModel = m;
                    break;
                } catch (e) {
                    log(`    ❌ Model ${m} failed: ${e.message.split(' ')[0]}...`);
                }
            }

            if (workingModel) {
                log(`✅ Found working model: ${workingModel}`);
                // We should probably update the code to use this model, but for now just reporting success.
            } else {
                allGood = false;
                log("❌ No working Gemini model found.");
            }
        } catch (error) {
            log("❌ Gemini API Verification Failed: " + error.message);
            allGood = false;
        }
    } else {
        log("⚠️ Skipping Gemini test (no key).");
    }

    // 4. Verify Gmail API
    log("\n[4] Testing Gmail API Authorization...");
    try {
        const auth = await gmailService.authorize();
        if (auth) {
            log("✅ Gmail Authorization initialized.");

            // Try to list messages
            log("    Attempting to list unread messages...");
            try {
                const messages = await gmailService.listUnreadMessages(auth);
                log(`✅ Success! Found ${messages.length} unread messages.`);
            } catch (err) {
                log("❌ Failed to list messages. Token might be invalid or API not enabled. " + err.message);
                allGood = false;
            }

        } else {
            log("⚠️ Gmail Authorization likely requires user interaction (browser open).");
            log("    Run `npm start` to trigger the auth flow if you haven't already.");
        }
    } catch (error) {
        log("❌ Gmail Service Error: " + error.message);
        allGood = false;
    }

    log("\n---------------------------------");
    if (allGood) {
        log("🎉 ALL SYSTEMS GO! URIs look fine.");
    } else {
        log("⚠️ ISSUES FOUND. Please address the errors above.");
    }
}

verify();
