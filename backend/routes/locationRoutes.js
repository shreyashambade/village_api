const express = require("express");
const router = express.Router();

const {getStates,
    getDistricts,
    getSubdistricts,
    getVillages, 
    searchVillages,
    autocompleteVillages
} = require("../controllers/locationController");

//routes
router.get("/states", getStates);
router.get("/states/:state_code/districts", getDistricts);
router.get("/districts/:district_code/subdistricts", getSubdistricts);
router.get("/subdistricts/:subdistrict_code/villages", getVillages);
router.get("/search", searchVillages);
router.get("/autocomplete", autocompleteVillages);

module.exports = router;


