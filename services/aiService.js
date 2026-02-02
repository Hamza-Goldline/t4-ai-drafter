const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateReply(emailContent, companyData) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY not found in .env");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-09-2025" });

    const instructions = `
1. Read the incoming email snippet carefully.
2. Read the company data provided to find the answer (especially in the 'qa' or 'policies' section).
3. Draft a professional, friendly, and helpful reply.
4. If the answer is not in the data, ask the user to clarify or contact the office.
5. Do NOT include a subject line (Gmail handles that).
6. Ensure the tone is British English, polite, and professional.
7. Output the body of the email in HTML format (use <p>, <br>, <strong>, etc.) but DO NOT include <html> or <body> tags.
8. Do NOT include a sign-off or footer (this will be appended automatically).
`;

    const fullPrompt = `${instructions}

COMPANY DATA:
${JSON.stringify(companyData, null, 2)}

EMAIL SNIPPET:
${emailContent}
`;

    const result = await model.generateContent(fullPrompt);
    return result.response.text();
}

module.exports = {
    generateReply
};
