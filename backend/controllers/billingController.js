const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { PrismaClient } = require("@prisma/client");

// 🚀 Add these two missing imports for the Neon Database Pool!
const { PrismaPg } = require("@prisma/adapter-pg");
const pool = require("../db");

// ── PRISMA 7 ADAPTER SETUP ──
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// PRD Pricing Matrix (in cents for Stripe)
const PLAN_PRICES = {
    PREMIUM: { price: 4900, name: "Premium Tier (50k req/day)" },
    PRO: { price: 19900, name: "Pro Tier (300k req/day)" },
    UNLIMITED: { price: 49900, name: "Unlimited Tier (1M req/day)" }
};

exports.createCheckoutSession = async (req, res) => {
    try {
        const { planId, email } = req.body; // e.g., "PRO"

        // 1. Validate the requested plan
        const selectedPlan = PLAN_PRICES[planId];
        if (!selectedPlan) {
            return res.status(400).json({ success: false, message: "Invalid plan selected." });
        }

        // 2. Fetch the client from your DB
        const client = await prisma.client.findUnique({ where: { email: email } });
        if (!client) {
            return res.status(404).json({ success: false, message: "Client not found." });
        }

        // 3. Create the Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: client.email,
            client_reference_id: client.id, // CRITICAL: Tells the webhook WHICH user paid!
            metadata: {
                target_plan: planId // Tells the webhook WHICH plan to upgrade them to!
            },
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `VillageAPI - ${selectedPlan.name}`,
                            description: "Monthly subscription for API access.",
                        },
                        unit_amount: selectedPlan.price,

                        // tell stripe to charge every month
                        recurring: {
                            interval : "month"
                        },
                        
                    },
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            // Where Stripe sends them after payment
            success_url: 'http://localhost:5173/dashboard?payment=success',
            cancel_url: 'http://localhost:5173/dashboard?payment=cancelled',
        });

        // 4. Send the URL back to React
        return res.json({ success: true, url: session.url });

    } catch (error) {
        console.error("Stripe Checkout Error:", error);
        return res.status(500).json({ success: false, message: "Failed to initialize checkout." });
    }
};

// 🚀 NEW: The Secure Webhook Listener (With Upgrades & Downgrades)
exports.stripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        // 1. Verify the message actually came from Stripe (Security!)
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(`Webhook signature verification failed:`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // --- 2. UPGRADE LOGIC ---
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        // Grab the metadata we sent during checkout
        const clientId = session.client_reference_id;
        const targetPlan = session.metadata.target_plan; 

        try {
            await prisma.client.update({
                where: { id: clientId },
                data: { plan: targetPlan }
            });
            console.log(`✅ SUCCESS: Upgraded Client ${clientId} to ${targetPlan} tier!`);
        } catch (dbError) {
            console.error("Failed to update database after payment:", dbError);
        }
    } 
    
    // --- 3. DOWNGRADE LOGIC (The Grace Period Alarm Clock) ---
    else if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object;
        
        // Stripe sends us the Customer ID that just expired
        const stripeCustomerId = subscription.customer;
        console.log(`❌ Subscription ended for Stripe Customer: ${stripeCustomerId}`);
        
        try {
            // NOTE: If your Prisma schema doesn't have stripeCustomerId yet, 
            // you may need to look up the user by email via the Stripe API first, 
            // but this is the correct architectural pattern!
            await prisma.client.updateMany({
                where: { stripeCustomerId: stripeCustomerId }, 
                data: { plan: 'FREE' }
            });
            console.log(`📉 Successfully downgraded client to FREE tier.`);
        } catch (dbError) {
            console.error("Failed to downgrade client:", dbError);
        }
    }

    // 4. Always send a 200 OK back to Stripe so they know we got it
    res.status(200).json({ received: true });
};


exports.createPortalSession = async (req, res) => {
    try {
        const { email } = req.body;
        console.log(`\n--- BILLING PORTAL DIAGNOSTIC ---`);
        console.log(`1. Requesting Portal for email: ${email}`);

        // Get ALL customer records for this email
        const customers = await stripe.customers.list({ email: email });
        console.log(`2. Stripe found ${customers.data.length} records for this email.`);

        if (customers.data.length === 0) {
            return res.status(404).json({ success: false, message: "No billing profile found." });
        }

        // 🚨 DIAGNOSTIC: Print exactly what Stripe sent us!
        console.log(`3. Raw Data from Stripe:`, customers.data);

        // Try to find ANY record in the list that actually has a valid ID
        const validCustomer = customers.data.find(c => c.id);

        if (!validCustomer) {
            return res.status(500).json({ 
                success: false, 
                message: "Check your backend terminal. Stripe sent malformed data." 
            });
        }

        console.log(`4. Success! Opening Portal for Customer ID: ${validCustomer.id}`);

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: validCustomer.id,
            return_url: 'http://localhost:5173/dashboard',
        });

        console.log(`--- DIAGNOSTIC COMPLETE ---\n`);
        return res.json({ success: true, url: portalSession.url });

    } catch (error) {
        console.error("Portal Error:", error.message);
        return res.status(500).json({ success: false, message: "Failed to open billing portal." });
    }
};