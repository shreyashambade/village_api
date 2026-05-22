const express = require("express");
const router = express.Router();
const clientController = require("../controllers/clientController");

const billingController = require("../controllers/billingController");
const { requireJWT } = require("../middleware/auth");



// POST /api/clients/register
router.post("/register", clientController.registerClient);

// login route
router.post('/login', clientController.loginClient);

// GET /api/clients/usage/:email 
router.get("/usage/:email", clientController.getClientUsage);

// GET /api/clients/ (Gets all clients for admin)
router.get("/", clientController.getAllClients);

// GET /api/clients/me/dashboard (Gets live data for the logged-in client)
router.get("/me/dashboard", clientController.getClientDashboardData);

// PUT /api/clients/:id/revoke (Suspends a user)
router.put("/:id/revoke", clientController.revokeClientAccess);

// PUT /api/clients/:id/reset (Generates a new API key)
router.put("/:id/reset", clientController.resetApiKey);

// PUT /api/clients/:id/reactivate (Restores a user's access)
router.put("/:id/reactivate", clientController.reactivateClientAccess);

// PUT /api/clients/:id/profile (Updates company and email)
router.put("/:id/profile", clientController.updateClientProfile);

// PUT /api/clients/keys/:keyId/revoke (Revokes a specific API key)
router.put("/keys/:keyId/revoke", clientController.revokeSpecificKey);

// 🚀 FIXED: The billing route (No requireJWT, exact path)
router.post("/billing/checkout", billingController.createCheckoutSession);

// 🚀 NEW: The Portal Route
router.post("/billing/portal", billingController.createPortalSession);

router.post('/auth/2fa/generate', clientController.generate2FA);
router.post('/auth/2fa/verify', clientController.verify2FA);
router.post('/auth/2fa/disable', clientController.disable2FA);

module.exports = router;