const fs = require('fs');
const path = require('path');

// A basic set of default templates to get started
const defaultTemplates = [
    {
        id: "gate_code",
        keywords: ["gate code", "access code", "entry code", "pin", "gate", "access"],
        template: `
<p>Hello,</p>
<p>Thank you for getting in touch. Your gate access code is <strong>{{gate_code}}</strong>. Please make sure to enter the '#' key after the code.</p>
<p>If you have any trouble accessing the facility, please let us know.</p>
<p>Best regards,<br>Twenty4 Storage</p>`
    },
    {
        id: "pricing",
        keywords: ["price", "cost", "quote", "how much", "pricing", "rates"],
        template: `
<p>Hello,</p>
<p>Thank you for inquiring about our storage rates. Our pricing depends on the unit size.</p>
<p>Please let us know what size unit you are looking for, or visit our website for the most up-to-date pricing and availability.</p>
<p>Best regards,<br>Twenty4 Storage</p>`
    },
    {
        id: "move_out",
        keywords: ["move out", "leaving", "vacate", "moving out", "cancel"],
        template: `
<p>Hello,</p>
<p>We are sorry to see you go! To process your move-out, please ensure your unit is completely empty and the lock is removed. Let us know the date you plan to vacate so we can update our records and stop any future billing.</p>
<p>Thank you for choosing Twenty4 Storage.</p>`
    },
    {
        id: "late_payment",
        keywords: ["late payment", "overdue", "pay bill", "balance", "late fee"],
        template: `
<p>Hello,</p>
<p>Thank you for reaching out regarding your account. Please be advised that any past due balances must be settled to ensure uninterrupted access to your unit.</p>
<p>You can make a payment through our online portal or by giving us a call.</p>
<p>Best regards,<br>Twenty4 Storage</p>`
    }
];

function generateSmartTemplateReply(emailContent, companyData) {
    const contentLower = emailContent.toLowerCase();

    // Try to match the email content with our template keywords
    for (const dTemplate of defaultTemplates) {
        // If any of the keywords in the template are found in the email
        if (dTemplate.keywords.some(keyword => contentLower.includes(keyword))) {
            let reply = dTemplate.template;

            // This is a basic form of "Smart" filling. We can expand this.
            // Example: If companyData has a default gate access instruction, we could inject it

            return reply;
        }
    }

    // A generic fallback if no keywords match
    return `
<p>Hello,</p>
<p>Thank you for contacting Twenty4 Storage. We have received your message and will get back to you with a detailed response shortly.</p>
<p>For immediate assistance, please call our office.</p>
<p>Best regards,<br>Twenty4 Storage</p>`;
}

module.exports = {
    generateSmartTemplateReply
};
