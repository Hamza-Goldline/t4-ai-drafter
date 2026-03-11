const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const { generateSmartTemplateReply } = require('./smartTemplateService');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateReply(emailContent, companyData, customTemplates = null) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY not found in .env");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const instructions = `
1. Read the incoming email snippet carefully.
2. Read the company data provided to find the answer (especially in the 'qa' or 'policies' section).
3. Draft a professional, friendly, comprehensive, and helpful reply. Write in complete paragraphs and be detailed in your explanation to ensure the response is sufficiently long.
4. ACT LIKE A HUMAN EMPLOYEE working at Twenty4 Secure Storage. Do NOT ever mention "our records", "the company data", "the provided information", or sound like an AI. You are a customer service representative answering directly.
5. If the answer is not in the data, do not say the data doesn't have it. Just politely explain the policies and ask the user to clarify or contact the office. 
6. Do NOT include a subject line (Gmail handles that).
7. Ensure the tone is British English, polite, and professional.
8. Output the body of the email in HTML format (use <p>, <br>, <strong>, etc.) but DO NOT include <html> or <body> tags.
9. Do NOT include a sign-off or footer (this will be appended automatically).
`;

    const fullPrompt = `${instructions}

COMPANY DATA:
${JSON.stringify(companyData, null, 2)}

EMAIL SNIPPET:
${emailContent}
`;

    try {
        const result = await model.generateContent(fullPrompt);
        return {
            source: "AI Draft",
            html: result.response.text()
        };
    } catch (error) {
        console.error("AI failed, falling back to Smart Template:", error.message);

        // Return a response from our localized smart engine!
        const templateDraft = generateSmartTemplateReply(emailContent, companyData, customTemplates);
        return {
            source: "Smart Template",
            html: templateDraft
        };
    }
}

module.exports = {
    generateReply
};
