const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const pool = require("../db");

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

exports.submitContactForm = async (req, res) => {
    try {
        const { full_name, email, phone, state, district, subdistrict, village, message } = req.body;

        // Basic validation
        if (!full_name || !email || !message) {
            return res.status(400).json({ success: false, message: "Name, email, and message are required." });
        }

        // Save to database
        const newLead = await prisma.contact_requests.create({
            data: { full_name, email, phone, state, district, subdistrict, village, message }
        });

        // TIP: In the future, you could add Nodemailer here to send yourself an email alert!

        res.json({ success: true, message: "Request submitted successfully!" });
    } catch (error) {
        console.error("Contact Form Error:", error);
        res.status(500).json({ success: false, message: "Failed to submit request." });
    }
};