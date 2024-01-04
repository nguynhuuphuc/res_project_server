const express = require('express')
const router = express.Router()

const kitchenController = require('../app/controllers/KitChenController')
const checker = require('./checker')


router.use('/checker',checker)


router.use('/change_order_item_quantity',kitchenController.changeOrderItemQuantity)
router.use('/delete_order_item',kitchenController.deleteOrderItem)
router.use('/delete_order',kitchenController.deleteOrder)
router.use('/serv_order_items_check_list',kitchenController.servOrderItemsInCheckList)
router.use('/confirm_order_items_check_list',kitchenController.confirmOrderItemsInCheckList)
router.use('/get_order_items',kitchenController.getOrderItems)
router.use('/get_order_check_list',kitchenController.getOrderCheckList)
router.use('/serv_order_items',kitchenController.servOrderItems)
router.use('/confirm_order_items',kitchenController.confirmOrderItems)
router.use('/get_all_order',kitchenController.getAllOrder)
router.use('/',kitchenController.index)

module.exports = router