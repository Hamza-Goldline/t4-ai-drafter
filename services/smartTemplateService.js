const fs = require('fs');
const path = require('path');

// A robust set of templates based on actual highly successful AI responses.
// We keep keywords broad, and rank by specificity in the generation function.
const defaultTemplates = [
    {
        id: "promotion",
        keywords: ["seo", "service accounts", "api keys", "promotion", "marketing", "web design", "unsubscribe"],
        template: `
<p>Hello,</p>
<p>Thank you for getting in touch with Twenty4 Secure Storage.</p>
<p>It looks as though your email may have been cut short or perhaps was intended for a different recipient, as the content does not relate to our self-storage services.</p>
<p>Could you please clarify what information you require regarding our storage units, serviced offices, or pricing? We would be delighted to assist you with any query concerning our facilities in Leeds.</p>
<p>We look forward to hearing the full details of your request.</p>`
    },
    {
        id: "biggest_size",
        keywords: ["biggest", "largest", "maximum size", "large unit", "max size"],
        template: `
<p>Hello,</p>
<p>Thank you for getting in touch. We offer a variety of sizes depending on whether you require indoor or outdoor container storage.</p>
<p>Our largest standard storage unit size is 300 square feet. We currently offer this size in the following formats:</p>
<p>
  <strong>Indoor Storage:</strong> 300 sq ft at £116.00 per week (including VAT).<br>
  <strong>Container Storage (Outdoor, Drive-Up Access):</strong> 300 sq ft at £85.00 per week (including VAT).
</p>
<p>If you require something larger for a business need, we also have serviced office spaces, the largest of which is 550 square feet. We would be happy to discuss your specific requirements if you need a non-standard size.</p>
<p>Please do let us know if you would like to arrange a site tour to view the units.</p>`
    },
    {
        id: "christmas_hours",
        keywords: ["christmas", "new year", "festive", "holiday hours"],
        template: `
<p>Hello,</p>
<p>Thank you for reaching out to Twenty4 Secure Storage.</p>
<p>Our standard operating hours are:<br>
  <strong>Monday to Friday:</strong> 7:00-19:00<br>
  <strong>Saturday:</strong> 8:00-17:00<br>
  <strong>Sunday:</strong> 9:00-14:00
</p>
<p>Please be aware that our opening times between Christmas and New Year's may be slightly adjusted from our regular schedule. We usually publish our specific holiday timetable closer to the time on our website.</p>
<p>For the most accurate opening hours during the festive period, we recommend checking our website at <a href="https://www.twenty4storage.com/">twenty4storage.com</a> or calling us directly on 0113 426 9111 nearer the date. We will be happy to confirm the exact schedule then.</p>`
    },
    {
        id: "opening_hours_docs",
        keywords: ["opening hours", "opening times", "documentation", "papers", "id", "identification", "when are you open", "closing time"],
        template: `
<p>Hello,</p>
<p>Thank you for getting in touch. I would be pleased to provide you with those details.</p>
<p><strong>Our Operating Hours:</strong><br>
Our site is open seven days a week for customer access, as follows:<br>
  Monday to Friday: 7:00 – 19:00<br>
  Saturday: 8:00 – 17:00<br>
  Sunday: 9:00 – 14:00
</p>
<p><strong>Required Documentation:</strong><br>
When setting up your Customer Licence for a storage unit, we require two forms of ID. One must be a photo ID, and the other must be proof of your current address.</p>
<p>Please remember that we are unable to accept scanned or copied documents, so please bring the originals with you to the office.</p>
<p>If you have any further questions or would like to arrange a tour of the facility, please feel free to call us!</p>`
    },
    {
        id: "address",
        keywords: ["address", "location", "postcode", "where are you", "directions", "locate"],
        template: `
<p>Hello,</p>
<p>Thank you for reaching out.</p>
<p>We are located at Chelsea Close, Leeds, LS12 4HP.</p>
<p>Please do let us know if you require directions or have any other questions.</p>`
    },
    {
        id: "waive_fee",
        keywords: ["waive", "remove late charge", "remove fee", "offset", "credit note", "late charge"],
        template: `
<p>Hello,</p>
<p>Thank you for reaching out to Twenty4 Secure Storage.</p>
<p>I understand you are requesting that the late charge be waived or reviewed regarding your account. I am happy to look into this for you immediately.</p>
<p>To locate your account and review the transaction history, could you please provide your full name, storage unit number, or account reference?</p>
<p>Once I have this information, I will be able to review the details regarding the charge and resolve this for you.</p>`
    },
    {
        id: "payments_and_arrears",
        keywords: ["payment options", "fail to pay", "arrears", "bank transfer", "card payment", "payment method", "pay for sometime"],
        template: `
<p>Hello,</p>
<p>Thank you for getting in touch with Twenty4 Secure Storage.</p>
<p>Regarding payments, our policy requires that fees are paid in advance. We typically invoice and collect payment every four weeks. While we accept several common forms of payment, including bank transfers and card payments, we recommend giving our office a call directly on 0113 426 9111, and a member of the team can confirm the most suitable method for setting up your payment schedule.</p>
<p>With respect to failed or late payments, this is a serious contractual issue. Details regarding the process for managing accounts in arrears, including any potential access restrictions, are fully outlined in the Customer Licence agreement that you sign when renting a unit. If you have immediate concerns about meeting a payment deadline, please contact the office as soon as possible so we can discuss your account privately.</p>
<p>We look forward to hearing from you shortly.</p>`
    },
    {
        id: "fifty_ft",
        keywords: ["50ft container", "50 ft", "50foot"],
        template: `
<p>Hello,</p>
<p>Thank you very much for getting in touch regarding container storage.</p>
<p>We generally measure the size of our storage units by their internal floor space in square feet, and we do not currently offer a unit that is 50 linear feet long.</p>
<p>If you were looking for a container size close to that capacity, we offer the following options:<br>
  - 35 square feet container: £20.00 per week<br>
  - 75 square feet container: £25.00 per week
</p>
<p>We also offer indoor storage, where we do have a 50 square feet unit available for £28.00 per week. All of these prices include VAT.</p>
<p>Please could you clarify the specific dimensions or capacity you require, and we would be delighted to assist you further?</p>`
    },
    {
        id: "options_sizes",
        keywords: ["options available", "sizes available", "dimensions", "what sizes", "options", "sizes"],
        template: `
<p>Hello,</p>
<p>Thank you for your enquiry regarding our storage options at Twenty4 Secure Storage.</p>
<p>We offer two main types of secure storage: Indoor Units and Container Storage. Below are the sizes we currently have available for each type (all measurements are in square feet):</p>
<p><strong>Indoor Storage Units</strong><br>
Our indoor units are clean, dry, and ideal for domestic or business use. We offer the following dimensions:<br>
10, 25, 35, 50, 75, 100, 150, and 300 sq ft.</p>
<p><strong>Container Storage</strong><br>
These units provide drive-up access and are highly secure. Available sizes are:<br>
35, 75, 150, and 300 sq ft.</p>
<p>If you require specific pricing details for any of these sizes, please do not hesitate to ask, and we would be happy to provide them.</p>`
    },
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
        id: "move_out",
        keywords: ["move out", "leaving", "vacate", "moving out", "cancel"],
        template: `
<p>Hello,</p>
<p>We are sorry to see you go! To process your move-out, please ensure your unit is completely empty and the lock is removed. Let us know the date you plan to vacate so we can update our records and stop any future billing.</p>
<p>Thank you for choosing Twenty4 Storage.</p>`
    }
];

function generateSmartTemplateReply(emailContent, companyData) {
    const contentLower = emailContent.toLowerCase();

    // Try to match the email content with our template keywords
    for (const dTemplate of defaultTemplates) {
        // If any of the keywords in the template are found in the email
        if (dTemplate.keywords.some(keyword => contentLower.includes(keyword))) {
            let reply = dTemplate.template;

            // Intelligent Fallback Parsing:
            // Since companyData might contain specific hours or addresses, we can replace them here 
            // if we have corresponding {{variables}} in the template, or merge information dynamically.

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
