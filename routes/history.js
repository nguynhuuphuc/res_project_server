const express = require('express')
const router = express.Router()

const historyController = require('../app/controllers/HistoryController')


router.use('/get_revenue',historyController.getRevenue)
router.use('/get_paid_orderitems',historyController.getPaidOrderItems)
router.use('/get_all_paid_orders',historyController.getAllPaidOrders)
router.use('/',historyController.index)


module.exports = router