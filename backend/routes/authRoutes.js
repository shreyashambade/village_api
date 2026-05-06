const express = require("express");
const router = express.Router();
const {
    register,
    login,
    generateKey,
    listKeys,
    revokeKey
} = require("../controllers/authController");

const {requireJWT} = require("../middleware/auth");

//public routes (no auth needed)
router.post("/register", register);
router.post("/login", login);

//protected routes (authentication require)
router.post("/keys", requireJWT,generateKey);
router.get("/keys", requireJWT,listKeys);
router.delete("/keys/:id", requireJWT,revokeKey);


module.exports = router;
