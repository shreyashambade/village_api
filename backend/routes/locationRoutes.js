const express = require("express");
const router = express.Router();

const {getStates,
    getDistricts,
    getSubdistricts,
    getVillages, 
    searchVillages,
    autocompleteVillages
} = require("../controllers/locationController");

// swagger comments
/**
 * @swagger
 * /api/v1/states:
 *   get:
 *     summary: Get all states
 *     tags: [Locations]
 *     responses:
 *       200:
 *         description: List of all states
 */


//route
router.get("/states", getStates);

// swagger comment
/**
 * @swagger
 * /api/v1/states/{state_code}/districts:
 *   get:
 *     summary: Get districts by state code
 *     tags: [Locations]
 *     parameters:
 *       - in: path
 *         name: state_code
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of districts
 */
router.get("/states/:state_code/districts", getDistricts);  //route

//swagger comment
/**
 * @swagger
 * /api/v1/districts/{district_code}/subdistricts:
 *   get:
 *     summary: Get subdistricts by district code
 *     tags: [Locations]
 *     parameters:
 *       - in: path
 *         name: district_code
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of subdistricts
 */

router.get("/districts/:district_code/subdistricts", getSubdistricts); //route

//swagger comment
/**
 * @swagger
 * /api/v1/subdistricts/{subdistrict_code}/villages:
 *   get:
 *     summary: Get villages by subdistrict code
 *     tags: [Locations]
 *     parameters:
 *       - in: path
 *         name: subdistrict_code
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of villages
 */


router.get("/subdistricts/:subdistrict_code/villages", getVillages); //route

//swagger comment
/**
 * @swagger
 * /api/v1/search:
 *   get:
 *     summary: Search villages
 *     tags: [Locations]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *       - in: query
 *         name: district
 *         schema:
 *           type: string
 *       - in: query
 *         name: subDistrict
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results
 */

router.get("/search", searchVillages);


//swagger comment
/**
 * @swagger
 * /api/v1/autocomplete:
 *   get:
 *     summary: Autocomplete locations
 *     tags: [Locations]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: hierarchyLevel
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Autocomplete results
 */

router.get("/autocomplete", autocompleteVillages); //route

module.exports = router;


