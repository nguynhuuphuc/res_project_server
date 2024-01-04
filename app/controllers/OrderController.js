const { query, text, response } = require('express');
const pool = require('../../config/db')
const { format } = require('date-fns');

// Get the current date and time
var currentDate = new Date();
// Format the date to match your desired format
var formattedDate = format(currentDate, 'yyyy-MM-dd HH:mm:ss');

class OrderController{
    index(req,res){
        const {orderItemModels,user_uid} = req.body
        
       console.log(orderItemModels,user_uid)
    }

    splitOrderTable(req,res){
        const {order_id,table_id,orderItemModels,user_uid} = req.body
        
        let countSplItems = 0;

        orderItemModels.forEach(e => {
            if(e.isEnableSplit){
                countSplItems++
            }
        });


        const tableChecking = `
            SELECT * FROM is_table_occupied(${table_id})
        `
        pool.query(tableChecking)
        .then((result)=>{
            if(result.rows[0].is_table_occupied){ 
                // Tồn tại đơn hàng trong bàn. Tách đơn rồi gộp chung đơn
                orderItemModels.forEach(e => {
                    if(e.isEnableSplit){
                        const queryOrderId = `
                            SELECT order_id
                            from orders
                            Where table_id = '${table_id}'
                        `
                        pool.query(queryOrderId)
                        .then((result)=>{
                            orderItemModels.forEach(e => {
                                if(e.isEnableSplit){
                                    const newOrderId = result.rows[0].order_id
                                    countSplItems--
                                    InsertUpdateSplitOrderItems(e,order_id,newOrderId,user_uid,countSplItems,res)
                                }
                            })
                        })
                        .catch((err)=> console.log("Err get order id: ",err))
                    }
                });
            
            }else{ 
                //Không tồn tại đơn hàng. Tạo mới cho đơn tách
                createOrderForSplit(user_uid,table_id)
                .then((newOrderId) =>{ 
                    orderItemModels.forEach(e => {
                        if(e.isEnableSplit){
                            countSplItems--
                            InsertUpdateSplitOrderItems(e,order_id,newOrderId,user_uid,countSplItems,res)
                        }
                    })
                })
                .catch((err) => console.log("Err (SplitOrder) create new order: ",err))
                
            }
        })
        .catch((err)=>{
            console.log("Err cheking table: ",err)
        })


    }

    joinOrderTable(req,res){
        const {order1_id,order2_id,orderItemModels,user_uid} = req.body //Gộp tới order2_id xóa order1_id

        let countSplItems = orderItemModels.length

        orderItemModels.forEach(e => {
            e.quantitySplit = e.quantity
            const newOrderId = order2_id
            const order_id = order1_id
            const status = "join"
            countSplItems--
            console.log(countSplItems)
            InsertUpdateSplitOrderItems(e,order_id,newOrderId,user_uid,countSplItems,res,status)
            
        })
    }

    changeTable(req,res){
        const {order_id,table_id} = req.body

        const text = `
        WITH old_table_id AS (
            SELECT table_id AS old_table_id
            FROM orders
            WHERE order_id = '${order_id}'
            LIMIT 1
        )
        UPDATE orders
        SET table_id = '${table_id}'
        FROM old_table_id
        WHERE orders.order_id = '${order_id}'
        RETURNING old_table_id, orders.table_id AS new_table_id, order_id;
        `
        pool.query(text)
        .then((result)=>{
            getChangeTables(result.rows[0],res)
        })
        .catch((err)=>{
            console.log("Err change table: ",err)
        })


    }

    updatePaidOrder(req,res){
        const {order_id,is_paid,payment_method_id} = req.body        
        const text = `
            UPDATE orders
            SET is_paid = '${is_paid}',
                payment_method_id = '${payment_method_id}'
            WHERE order_id = '${order_id}'
        `
        pool.query(text)
        .then(()=>{
            
            console.log("success update paid")
            return res.json({message : "Update paid order success"})
        })
        .catch((err)=>{
            console.log("Error update order paid: " , err)
        })

    }

    getOrderItemsHistory(req,res){
        const {order_id} = req.body

        const text = `
            SELECT *
            FROM orderitems_history
            WHERE order_id = '${order_id}'
            ORDER BY timestamp DESC
        `

        pool.query(text)
        .then((result)=>{
            return res.json(result.rows)
        })
        .catch((err)=>{
            console.log("Error get OrderItemsHistory: ",err)
        })

    }


    updateOrder(req,res){
        const {orderModel} = req.body
        orderModel.discount_percentage = (orderModel.discount_percentage !== undefined) ? orderModel.discount_percentage : 0
        const text = `
            UPDATE orders
            SET discount_amount = '${orderModel.discount_amount}',
                discount_percentage = '${orderModel.discount_percentage}'
            WHERE order_id = '${orderModel.order_id}'
            AND  (discount_amount, discount_percentage) IS DISTINCT 
            FROM ( '${orderModel.discount_amount}', '${orderModel.discount_percentage}')
            RETURNING *
        
        `
        pool.query(text)
        .then((result)=>{
            console.log(result.rows[0])
            return res.json({message: "Update orders success"})
        }).catch((err)=>{
            console.log("Err update orders",err)
        })
    }

    updateOrderItems(req,res){
        const {orderItemModels,total_amount,user_uid} = req.body
        var orderItemModelList = new OrderItemModelList;
        orderItemModelList = orderItemModels;

        orderItemModelList.forEach(e => {
            
            e.order_time = (e.order_time !== undefined) ? e.order_time : formattedDate

            console.log(e.order_id)

            const array = [
                e.menu_item_id,
                e.quantity,
                e.item_price,
                e.discount_amount,
                e.discount_percentage,
                e.note,
            ]
            var text = `
                INSERT INTO orderitems (order_id,order_time,menu_item_id,quantity,item_price,discount_amount,discount_percentage,note,changed_by)
                VALUES ('${e.order_id}','${e.order_time}',$1,$2,$3,$4,$5,$6,'${user_uid}')
                ON CONFLICT (order_id,order_time,menu_item_id) DO
                UPDATE
                SET 
                    discount_amount = CASE
                        WHEN excluded.discount_amount IS DISTINCT FROM orderitems.discount_amount 
                            THEN excluded.discount_amount
                            ELSE orderitems.discount_amount
                    END,
                    discount_percentage = CASE
                        WHEN excluded.discount_percentage IS DISTINCT FROM orderitems.discount_percentage 
                            THEN excluded.discount_percentage
                            ELSE orderitems.discount_percentage
                    END,
                    note = CASE
                        WHEN excluded.note IS DISTINCT FROM orderitems.note 
                            THEN excluded.note
                            ELSE orderitems.note
                    END,
                    quantity = CASE
                    WHEN excluded.quantity IS DISTINCT FROM orderitems.quantity 
                        THEN excluded.quantity
                        ELSE orderitems.quantity
                    END
            `
            pool.query(text,array)
            .then((result)=>{
            })
            .catch((err)=>{
                console.log("Error updateOrderItems: ", err)
            })

            if(e == orderItemModelList[orderItemModelList.length - 1]){
                var text = `
                    UPDATE orders
                    SET total_amount = '${total_amount}'
                    WHERE order_id = '${e.order_id}' 
                
                `
                pool.query(text)
                .then(()=>{
                    return res.json({message: "update Success"})
                })
                .catch((err)=>{
                    console.log("Err upate orders: ",err)
                })}
        });
        
    }

    getOrderItems(req,res){
        const {order_id} = req.body

        const text = `
            SELECT *
            FROM orderitems
            WHERE order_id = '${order_id}'
            Order by id DESC 
        `
        pool.query(text)
        .then((result)=>{
            console.log(result.rows)
            return res.json(result.rows)
        })
        .catch((err)=>{
            console.log("Error getOrderItems: ", err)
        })

    }

    getOrderById(req,res){
        const {order_id} = req.body

        const text = `
            SELECT *
            FROM orders
            Where order_id = '${order_id}'
        `
        pool.query(text)
        .then((result)=>{
            return res.json(result.rows[0])
        })
        .catch((err)=>{
            console.log("Error getOrderById: ", err)
        })

    }

    getAllOrders(req,res){
        const text = `
            SELECT *
            FROM orders
        `
        pool.query(text)
        .then((result)=>{
            return res.json(result.rows)
        })
        .catch((err)=>{
            console.log("Error getAllOrder: ", err)
        })
    }

    getOrderByTableId(req,res){
        const {table_id} = req.body

        const text = ` 
            SELECT *
            FROM orders
            WHERE table_id = '${table_id}'
        `
        pool.query(text)
        .then((result)=>{
            if(result.rowCount != 0)
                return res.json(result.rows[0])
            else
                return res.status(401).json({ error: 'Không tồn tại đơn hàng' });
        })
        .catch((err)=>{
            console.log("Error getOrder: ", err)
        })

    }

    addNewOrder(req,res){
        const {orderItemModels,user_uid,table_id,total_amount} = req.body
        
        console.log(total_amount)
        var orderItemModelList = new OrderItemModelList;
        orderItemModelList = orderItemModels;

        const text = `
            INSERT INTO orders (created_by,table_id,total_amount)
            VALUES ($1,$2,$3)
            RETURNING order_id
        `
        
        pool.query(text,[user_uid,table_id,total_amount])
            .then((result)=>{
                const order_id = result.rows[0].order_id
                const text = `
                    INSERT INTO orderitems (order_id,menu_item_id,quantity,item_price,discount_amount,discount_percentage,note,changed_by)
                    VALUES ('${order_id}',$1,$2,$3,$4,$5,$6,$7)
                `
                orderItemModelList.forEach(item => {
                    if(item.note != null && item.note == "")
                        item.note = null

                    const array = [
                        item.menu_item_id,
                        item.quantity,
                        item.item_price,
                        item.discount_amount,
                        item.discount_percentage,
                        item.note,
                        user_uid
                    ]

                    pool.query(text,array)
                        .then(()=>{
                            // console.log('Order item inserted successfully');
                            if(item == orderItemModelList[orderItemModelList.length - 1]){
                                const textUpdate = `
                                    WITH updated_tables AS (
                                        UPDATE tables
                                        SET is_occupied = true
                                        WHERE table_id = '${table_id}'
                                        RETURNING *
                                    )
                                    SELECT 
                                        updated_tables.table_id, 
                                        updated_tables.is_occupied, 
                                        updated_tables.location_id, 
                                        updated_tables.table_name, 
                                        orders.order_date,
                                        orders.total_amount,
                                        orders.order_id
                                    FROM updated_tables
                                    LEFT JOIN orders ON updated_tables.table_id = orders.table_id
                                    WHERE orders.order_id = ${order_id}
                                `
                                pool.query(textUpdate)
                                .then((result)=>{
                                    // console.log(result.rows[0]);
                                    return res.json(result.rows[0])
                                })
                                .catch((error) => {
                                    console.error('Error update tables is_occupied:', error);
                                })
                            }

                        })
                        .catch((error) => {
                            console.error('Error inserting order item:', error);
                        })
                });
                

                
            })
            .catch((error) => {
                console.error('Error inserting order:', error);
            })
    }
}



class OrderItemModel {
    constructor(order_id, menu_item_id, quantity, item_price, discount_amount, discount_percentage, note) {
      this.order_id = order_id;
      this.menu_item_id = menu_item_id;
      this.quantity = quantity;
      this.item_price = item_price;
      this.order_time = new Date();
      this.discount_amount = discount_amount;
      this.discount_percentage = discount_percentage;
      this.note = note;
    }
  }

  class OrderItemModelList {
    constructor() {
      this.items = []; // An array to store OrderItemModel instances
    }
  
    // Method to add an OrderItemModel to the list
    addItem(orderItem) {
      this.items.push(orderItem);
    }
  
    // Method to get all OrderItemModel instances
    getAllItems() {
      return this.items;
    }
  }
  function InsertUpdateSplitOrderItems(e,order_id,newOrderId,user_uid,countSplItems,res,status){
            console.log(newOrderId, e.menu_item_id)
            console.log("ORderItem ID: ",e.id)
            const array = [
                e.menu_item_id,
                e.quantitySplit,
                e.item_price,
                e.discount_amount,
                e.discount_percentage,
                e.note,
            ]
            var text = `
                INSERT INTO orderitems (id,order_id,order_time,menu_item_id,quantity,item_price,discount_amount,discount_percentage,note,changed_by,quantity_confirm,quantity_serv)
                VALUES ('${e.id}','${newOrderId}','${e.order_time}',$1,$2,$3,$4,$5,$6,'${user_uid}','${e.quantity_confirm}','${e.quantity_serv}')
                ON CONFLICT (order_id,order_time,menu_item_id) DO
                UPDATE
                SET 
                    discount_amount = CASE
                        WHEN excluded.discount_amount IS DISTINCT FROM orderitems.discount_amount 
                            THEN excluded.discount_amount
                            ELSE orderitems.discount_amount
                    END,
                    discount_percentage = CASE
                        WHEN excluded.discount_percentage IS DISTINCT FROM orderitems.discount_percentage 
                            THEN excluded.discount_percentage
                            ELSE orderitems.discount_percentage
                    END,
                    note = CASE
                        WHEN excluded.note IS DISTINCT FROM orderitems.note 
                            THEN excluded.note
                            ELSE orderitems.note
                    END,
                    quantity = CASE
                    WHEN excluded.quantity IS DISTINCT FROM orderitems.quantity 
                        THEN excluded.quantity
                        ELSE orderitems.quantity
                    END
            `
            pool.query(text,array)
            .then((result)=>{
                UpdateQuantitySplitOrderItem(e,order_id,newOrderId,countSplItems,res,status)
            })
            .catch((err)=>{
                console.log("Error updateOrderItems: ", err)
            })
  }
  function UpdateQuantitySplitOrderItem(e,order_id,newOrderId,countSplItems,res,status){
    const quantity = e.quantity - e.quantitySplit;
    const text = `
        UPDATE orderitems
        SET quantity = '${quantity}'
        WHERE 
            order_id = '${e.order_id}' AND
            menu_item_id = '${e.menu_item_id}' AND
            order_time = '${e.order_time}'
    `
    pool.query(text)
    .then((result)=>{
        if(countSplItems == 0){
            responseSplitOrderTables(res,order_id,newOrderId,status)
        }
        
    })
    .catch((err)=>{
        console.log("Err update quantity order items: ",err)
    })
  }

  function responseSplitOrderTables(res,order_id,newOrderId,status){
    let deleteText = "";
    if(status != null && status == 'join'){
        deleteText = `
            DELETE FROM orders
            WHERE order_id = '${order_id}'
            RETURNING table_id;
        `
    }
    const text =  `
        UPDATE orders o
        SET total_amount = (
            SELECT
                COALESCE(SUM(oi.item_price * oi.quantity - calculate_discount(oi.item_price, oi.quantity, oi.discount_percentage, oi.discount_amount)), 0)
            FROM
                orderitems oi
            WHERE
                oi.order_id = o.order_id
            GROUP BY
                oi.order_id
        )
        WHERE order_id = '${newOrderId}' or order_id = '${order_id}';
    ` 
    pool.query(text)
    .then((result)=>{
        let row ={}
        if(deleteText != ""){
            pool.query(deleteText)
            .then((result)=>{
                row = {
                    old_table_id : result.rows[0].table_id,
                    new_order_id : newOrderId
                }
                getChangeTables(row,res)
            })
            .catch((err)=>console.log("Err delete status join: ",err))
        }else{
         row = {
            order_id : order_id,
            new_order_id : newOrderId
        }
        getChangeTables(row,res)
       }
    })
    .catch((err)=> console.log("Err get split order table: ", err))
  }


  function getChangeTables(row,res){
    let text
    if(row.old_table_id != null && row.new_table_id != null){
        text =`
        SELECT 
            tables.table_id, 
            tables.is_occupied, 
            tables.location_id, 
            tables.table_name, 
            orders.order_date,
            orders.total_amount,
            orders.order_id
        FROM tables
        LEFT JOIN orders ON tables.table_id = orders.table_id
        WHERE tables.table_id = '${row.old_table_id}' OR tables.table_id = '${row.new_table_id}'
        `
    } else if(row.old_table_id != null && row.new_order_id != null){
        text =`
        SELECT 
            tables.table_id, 
            tables.is_occupied, 
            tables.location_id, 
            tables.table_name, 
            orders.order_date,
            orders.total_amount,
            orders.order_id
        FROM tables
        LEFT JOIN orders ON tables.table_id = orders.table_id
        WHERE tables.table_id = '${row.old_table_id}' OR orders.order_id = '${row.new_order_id}'
        `
    }
    else{
        text = `
            SELECT 
                tables.table_id, 
                tables.is_occupied, 
                tables.location_id, 
                tables.table_name, 
                orders.order_date,
                orders.total_amount,
                orders.order_id
            FROM tables
            LEFT JOIN orders ON tables.table_id = orders.table_id
            WHERE orders.order_id = '${row.order_id}' OR orders.order_id = '${row.new_order_id}'
        `
    }
    pool.query(text)
    .then((result)=>{
        console.log(result.rows)
        return res.json(result.rows)
    })
    .catch((err)=>{
        console.log("Err get change order table: ", err)
    })
  }

  // Hàm thực hiện giao dịch
async function createOrderForSplit(user_uid,table_id) {
    const client = await pool.connect();
  
    try {
      // Bắt đầu giao dịch
      await client.query('BEGIN');
  
      // Thêm dữ liệu vào bảng orders và trả về order_id
      const text = `
        INSERT INTO orders (created_by,table_id,total_amount)
        VALUES ('${user_uid}',${table_id},0)
        RETURNING order_id
      `

      const result = await client.query(text);
  
      // Lấy order_id từ kết quả trả về
      const newOrderId = result.rows[0].order_id;
      console.log(newOrderId)

  
      // Cập nhật bản ghi trong bảng tables
      await client.query('UPDATE tables SET is_occupied = true WHERE table_id = $1', [table_id]);
  
      // Kết thúc giao dịch
      await client.query('COMMIT');
  
      // Trả về order_id
      return newOrderId;
    } catch (error) {
      // Rollback giao dịch nếu có lỗi
      await client.query('ROLLBACK');
      throw error;
    } finally {
      // Giải phóng kết nối
      client.release();
    }
  }

module.exports = new OrderController