const express = require('express')
const router = express.Router()

const homeController = require('../app/controllers/HomeController')

router.use('/read_messages',homeController.readMessages)
router.use('/get_conservation',homeController.getConversation)
router.use('/get_conservations',homeController.getConversations)
router.use('/get_table_by_id',homeController.get_table_by_id)
router.use('/get_all_locations',homeController.get_locations)
router.use('/get_all_tables',homeController.get_all_tables)
router.use('/',homeController.index)

module.exports = router