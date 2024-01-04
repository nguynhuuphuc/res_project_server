const express = require('express')
const router = express.Router()

const orderController = require('../app/controllers/OrderController')
const checker = require('./checker')


router.use('/checker',checker)

router.use('/split_order_table',orderController.splitOrderTable)
router.use('/join_order_table',orderController.joinOrderTable)
router.use('/update_change_table',orderController.changeTable)
router.use('/update_paid_order',orderController.updatePaidOrder)
router.use('/get_order_items_history',orderController.getOrderItemsHistory)
router.use('/update_orders',orderController.updateOrder)
router.use('/update_order_items',orderController.updateOrderItems)
router.use('/get_order_items',orderController.getOrderItems)
router.use('/get_order_by_id',orderController.getOrderById)
router.use('/get_all_orders',orderController.getAllOrders)
router.use('/get_order_by_table_id',orderController.getOrderByTableId)
router.use('/add_new_order',orderController.addNewOrder)
router.use('/',orderController.index)

module.exports = router