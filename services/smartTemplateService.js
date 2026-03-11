const fs = require('fs');
const path = require('path');

// A robust set of templates based on actual highly successful AI responses.
// Now using plain text for easier editing by non-technical users.
const defaultTemplates = [
    {
        id: "pricing_and_costs",
        keywords: ["price", "cost", "how much", "quote", "pricing", "rate", "10sqft", "sqft", "square feet"],
        template: `Hello,

Thank you for your enquiry regarding our storage rates.

Our pricing depends entirely on the size of the unit you require. All of our prices include VAT and are billed every four weeks:

Indoor Storage Units:
- 10 sqft starts from £13.00 per week
- 50 sqft is £28.00 per week
- 100 sqft is £38.00 per week
- Up to 300 sqft for £116.00 per week

Outdoor Container Storage (Drive-Up):
- 35 sqft is £20.00 per week
- 150 sqft is £45.00 per week
- Up to 300 sqft for £85.00 per week

If you have a specific size in mind or would like a more exact quote, please let us know or give our office a call, and we would be delighted to assist you further.`
    },
    {
        id: "promotion",
        keywords: ["seo", "service accounts", "api keys", "promotion", "marketing", "web design", "unsubscribe"],
        template: `Hello,

Thank you for getting in touch with Twenty4 Secure Storage.

It looks as though your email may have been cut short or perhaps was intended for a different recipient, as the content does not relate to our self-storage services.

Could you please clarify what information you require regarding our storage units, serviced offices, or pricing? We would be delighted to assist you with any query concerning our facilities in Leeds.

We look forward to hearing the full details of your request.`
    },
    {
        id: "biggest_size",
        keywords: ["biggest", "largest", "maximum size", "large unit", "max size"],
        template: `Hello,

Thank you for getting in touch. We offer a variety of sizes depending on whether you require indoor or outdoor container storage.

Our largest standard storage unit size is 300 square feet. We currently offer this size in the following formats:

Indoor Storage: 300 sq ft at £116.00 per week (including VAT).
Container Storage (Outdoor, Drive-Up Access): 300 sq ft at £85.00 per week (including VAT).

If you require something larger for a business need, we also have serviced office spaces, the largest of which is 550 square feet. We would be happy to discuss your specific requirements if you need a non-standard size.

Please do let us know if you would like to arrange a site tour to view the units.`
    },
    {
        id: "christmas_hours",
        keywords: ["christmas", "new year", "festive", "holiday hours"],
        template: `Hello,

Thank you for reaching out to Twenty4 Secure Storage.

Our standard operating hours are:
Monday to Friday: 7:00-19:00
Saturday: 8:00-17:00
Sunday: 9:00-14:00

Please be aware that our opening times between Christmas and New Year's may be slightly adjusted from our regular schedule. We usually publish our specific holiday timetable closer to the time on our website.

For the most accurate opening hours during the festive period, we recommend checking our website at twenty4storage.com or calling us directly on 0113 426 9111 nearer the date. We will be happy to confirm the exact schedule then.`
    },
    {
        id: "opening_hours_docs",
        keywords: ["opening hours", "opening times", "documentation", "papers", "id", "identification", "when are you open", "closing time"],
        template: `Hello,

Thank you for getting in touch. I would be pleased to provide you with those details.

Our site is open seven days a week for customer access, as follows:
Monday to Friday: 7:00 – 19:00
Saturday: 8:00 – 17:00
Sunday: 9:00 – 14:00

When setting up your Customer Licence for a storage unit, we require two forms of ID. One must be a photo ID, and the other must be proof of your current address.

Please remember that we are unable to accept scanned or copied documents, so please bring the originals with you to the office.

If you have any further questions or would like to arrange a tour of the facility, please feel free to call us!`
    },
    {
        id: "contact_info",
        keywords: ["address", "location", "postcode", "where are you", "directions", "locate", "phone", "phone number", "contact number", "contact details", "call", "telephone"],
        template: `Hello,

Thank you for reaching out.

You can contact our office directly by calling 0113 426 9111.
We are located at: Chelsea Close, Leeds, LS12 4HP.

Please do let us know if you require directions or have any other questions.`
    },
    {
        id: "waive_fee",
        keywords: ["waive", "remove late charge", "remove fee", "offset", "credit note", "late charge"],
        template: `Hello,

Thank you for reaching out to Twenty4 Secure Storage.

I understand you are requesting that the late charge be waived or reviewed regarding your account. I am happy to look into this for you immediately.

To locate your account and review the transaction history, could you please provide your full name, storage unit number, or account reference?

Once I have this information, I will be able to review the details regarding the charge and resolve this for you.`
    },
    {
        id: "payments_and_arrears",
        keywords: ["payment options", "fail to pay", "arrears", "bank transfer", "card payment", "payment method", "pay for sometime"],
        template: `Hello,

Thank you for getting in touch with Twenty4 Secure Storage.

Regarding payments, our policy requires that fees are paid in advance. We typically invoice and collect payment every four weeks. While we accept several common forms of payment, including bank transfers and card payments, we recommend giving our office a call directly on 0113 426 9111, and a member of the team can confirm the most suitable method for setting up your payment schedule.

With respect to failed or late payments, this is a serious contractual issue. Details regarding the process for managing accounts in arrears, including any potential access restrictions, are fully outlined in the Customer Licence agreement that you sign when renting a unit. If you have immediate concerns about meeting a payment deadline, please contact the office as soon as possible so we can discuss your account privately.

We look forward to hearing from you shortly.`
    },
    {
        id: "fifty_ft",
        keywords: ["50ft container", "50 ft", "50foot"],
        template: `Hello,

Thank you very much for getting in touch regarding container storage.

We generally measure the size of our storage units by their internal floor space in square feet, and we do not currently offer a unit that is 50 linear feet long.

If you were looking for a container size close to that capacity, we offer the following options:
- 35 square feet container: £20.00 per week
- 75 square feet container: £25.00 per week

We also offer indoor storage, where we do have a 50 square feet unit available for £28.00 per week. All of these prices include VAT.

Please could you clarify the specific dimensions or capacity you require, and we would be delighted to assist you further?`
    },
    {
        id: "options_sizes",
        keywords: ["options available", "sizes available", "dimensions", "what sizes", "options", "sizes"],
        template: `Hello,

Thank you for your enquiry regarding our storage options at Twenty4 Secure Storage.

We offer two main types of secure storage: Indoor Units and Container Storage. Below are the sizes we currently have available for each type (all measurements are in square feet):

Indoor Storage Units:
Our indoor units are clean, dry, and ideal for domestic or business use. We offer the following dimensions:
10, 25, 35, 50, 75, 100, 150, and 300 sq ft.

Container Storage:
These units provide drive-up access and are highly secure. Available sizes are:
35, 75, 150, and 300 sq ft.

If you require specific pricing details for any of these sizes, please do not hesitate to ask, and we would be happy to provide them.`
    },
    {
        id: "gate_code",
        keywords: ["gate code", "access code", "entry code", "pin", "gate", "access"],
        template: `Hello,

Thank you for getting in touch. Your gate access code is {{gate_code}}. Please make sure to enter the '#' key after the code.

If you have any trouble accessing the facility, please let us know.

Best regards,
Twenty4 Storage`
    },
    {
        id: "move_out",
        keywords: ["move out", "leaving", "vacate", "moving out", "cancel"],
        template: `Hello,

We are sorry to see you go! To process your move-out, please ensure your unit is completely empty and the lock is removed. Let us know the date you plan to vacate so we can update our records and stop any future billing.

Thank you for choosing Twenty4 Storage.`
    }
];

function generateSmartTemplateReply(emailContent, companyData, customTemplates = null) {
    const contentLower = emailContent.toLowerCase();
    const templatesToUse = customTemplates && customTemplates.length > 0 ? customTemplates : defaultTemplates;

    // --- DYNAMIC PRICING ENGINE ---
    // Detect if they're asking for a specific size price directly from company data
    const sizeMatch = contentLower.match(/(\d+)\s*(sqft|sq ft|square feet|square meter)/);
    const isAskingForPrice = ["price", "cost", "how much", "quote", "pricing", "rate"].some(k => contentLower.includes(k));

    if (sizeMatch && isAskingForPrice && companyData && companyData.pricing) {
        const sizeNumber = sizeMatch[1];
        const sizeKey = `${sizeNumber}sqft`;
        let foundPrices = [];

        if (companyData.pricing.indoor && companyData.pricing.indoor[sizeKey]) {
            foundPrices.push(`- Indoor Storage: ${companyData.pricing.indoor[sizeKey]} per week`);
        }
        if (companyData.pricing.container && companyData.pricing.container[sizeKey]) {
            foundPrices.push(`- Outdoor Container Storage: ${companyData.pricing.container[sizeKey]} per week`);
        }
        if (companyData.pricing.offices && companyData.pricing.offices[sizeKey]) {
            foundPrices.push(`- Serviced Office space: ${companyData.pricing.offices[sizeKey]} per week`);
        }

        if (foundPrices.length > 0) {
            let dynamicReply = `Hello,\n\nThank you for getting in touch to enquire about our storage rates.\n\nHere are the options we currently have available for a ${sizeNumber} sqft unit:\n\n${foundPrices.join('\n')}\n\nAll of our prices include VAT and are billed every four weeks.\n\nPlease let us know if you would like to proceed or arrange a site tour to view the facilities.\n\nBest regards,\nTwenty4 Storage`;
            return dynamicReply.replace(/\n/g, '<br>');
        }
    }
    // --- END DYNAMIC PRICING ENGINE ---

    // Try to match the email content with our template keywords
    for (const dTemplate of templatesToUse) {
        // If any of the keywords in the template are found in the email
        if (dTemplate.keywords.some(keyword => contentLower.includes(keyword))) {
            let replyText = dTemplate.template;

            // Convert plain text newlines into HTML breaks because it gets injected into a Gmail HTML draft
            let htmlReply = replyText.replace(/\n/g, '<br>');
            return htmlReply;
        }
    }

    // A generic fallback if no keywords match
    let fallbackText = `Hello,

Thank you for contacting Twenty4 Storage. We have received your message and will get back to you with a detailed response shortly.

For immediate assistance, please call our office.

Best regards,
Twenty4 Storage`;

    return fallbackText.replace(/\n/g, '<br>');
}

module.exports = {
    generateSmartTemplateReply,
    defaultTemplates
};
