const express = require('express');
const router = express.Router();
const controllers = require('../controller/routeController.js');

router.get('/' , controllers.home );

router.get("/about" , controllers.about );

router.get("/canvasdata" , controllers.getCanvasData);

router.post("/canvasdata" , controllers.postCanvasData);

module.exports = router;