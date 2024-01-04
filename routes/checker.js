const express = require('express')
const router = express.Router()

const checkerController = require('../app/controllers/CheckerController')


router.use('/is_serv_order',checkerController.isServOrder)
router.use('/is_confirm_order',checkerController.isConfirmOrder)
router.use('/is_table_occupied',checkerController.isTableOccupied)
router.use('/',checkerController.index)

module.exports = router