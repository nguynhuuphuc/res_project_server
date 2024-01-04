const pool = require("../../config/db")
const WebSocket = require('ws')



class KitChenController{
    index(req,res){
        return res.send("Kitchen")
    }

    changeOrderItemQuantity(req,res){
        const {orderItemModel} = req.body;
        const text = `
            UPDATE kitchen_checklist
            SET quantity = ${orderItemModel.quantity}
            WHERE order_item_id = '${orderItemModel.id}'
        `
        pool.query(text)
        .then(()=>{
            return res.json({message: "Change sucess"})
        })
        .catch((err)=>console.log("delete kitchen order err: ",err))
    }

    deleteOrderItem(req,res){
        const {orderItemModel,orderKitchenModel} = req.body;
        console.log(req.body)
        const text = `
            UPDATE kitchen_checklist
            SET is_delete = true
            WHERE 
                order_item_id = '${orderItemModel.id}' AND
                date_trunc('second', notify_time) = '${orderKitchenModel.notify_time}'
        `
        pool.query(text)
        .then(()=>{
            return res.json({message: "Delete sucess"})
        })
        .catch((err)=>console.log("delete kitchen order err: ",err))
    }


    deleteOrder(req,res){
        const {orderKitchenModel} = req.body
        console.log(orderKitchenModel)
        //get orderitems id
        const text = `
            UPDATE kitchen_checklist
            SET is_delete = true
            WHERE date_trunc('second', notify_time) = '${orderKitchenModel.notify_time}'
        `
        pool.query(text)
        .then(()=>{
            return res.json({message: "Delete sucess"})
        })
        .catch((err)=>console.log("delete kitchen order err: ",err))
    }

    getOrderItems(req,res){
        const {status_id,order_id,notify_time} = req.body;

        console.log(status_id,order_id,notify_time)
        const text = `
            select 
                oi.id,
                oi.order_id,
                oi.order_time,
                oi.menu_item_id,
                oi.item_price,
                oi.note, 
                ks.status, 
                kc.status_id, 
                kc.notify_time,
                kc.quantity as quantity
            from kitchen_checklist kc
            join orderitems oi on oi.id = kc.order_item_id
            join kitchen_status ks on ks.id = kc.status_id
            where kc.order_id = '${order_id}' and date_trunc('second', kc.notify_time) = '${notify_time}'
            and status_id = '${status_id}'
        `
        pool.query(text)
        .then((result)=>{
            console.log(result.rows)
            return res.json(result.rows)
        })
        .catch((err)=>{console.log("err kitchen getOrderItem ",err)})

    }

    getOrderCheckList(req,res){
        const text = `
        SELECT
		o.order_id,
		status_id,
		ks.status,
		t.table_id,
		t.table_name,
		SUM(kc.quantity) as quantity,
		date_trunc('second', kc.notify_time) AS notify_time,
		date_trunc('second', kc.confirm_time) AS confirm_time,
		date_trunc('second', kc.serv_time) AS serv_time
	FROM
		kitchen_checklist kc
	JOIN
		kitchen_status ks ON ks.id = kc.status_id
	JOIN
		orders o ON o.order_id = kc.order_id
	JOIN
		tables t ON t.table_id = o.table_id
	GROUP BY
		o.order_id,
		status_id,
		ks.status,
		t.table_id,
		date_trunc('second', kc.notify_time),
		date_trunc('second', kc.confirm_time),
		date_trunc('second', kc.serv_time)
	ORDER BY
		date_trunc('second', kc.serv_time) DESC,status_id DESC, date_trunc('second', kc.notify_time);
        `
        pool.query(text)
        .then((result)=>{
            res.json(result.rows)
        })
        .catch((err)=>{console.log("err getOrderCheckList: ",err)})
    }
    servOrderItemsInCheckList(req,res){
        const {orderItemModels} = req.body
        const lastPosition = orderItemModels.length  - 1;

        console.log(orderItemModels)

        orderItemModels.forEach(async (item) => {
            console.log(item.notify_time)

            try {
                const query = `
                    UPDATE  orderitems
                    SET quantity_serv = quantity_serv + '${item.quantity}'
                    WHERE menu_item_id = '${item.menu_item_id}' AND 
                        order_time = '${item.order_time}' AND
                        order_id = '${item.order_id}'
                `
                await pool.query(query)

                const queryUpdate = `
                    UPDATE kitchen_checklist
                    SET status_id = 3,
                        serv_time = now()
                    WHERE order_id = '${item.order_id}' and date_trunc('second', notify_time) = '${item.notify_time}'
                    and status_id = '${item.status_id}'
                `
        
                await pool.query(queryUpdate)


                if(item == orderItemModels[lastPosition]){
                    const querySelect = `
                    select 
                        oi.id,
                        oi.order_id,
                        oi.order_time,
                        oi.menu_item_id,
                        oi.item_price,
                        oi.note, 
                        ks.status, 
                        kc.status_id, 
                        kc.notify_time,
                        kc.quantity as quantity
                    from kitchen_checklist kc
                    join orderitems oi on oi.id = kc.order_item_id
                    join kitchen_status ks on ks.id = kc.status_id
                    where kc.order_id = '${item.order_id}' and date_trunc('second', kc.notify_time) = '${item.notify_time}'
                    and status_id = 3
                    `
                    const result  = await pool.query(querySelect)

                    console.log(result.rows)
                    return res.json(result.rows)
                }

            } catch (error) {
                console.log("err serv items order checkList ",error, item.order_id)
            }
        });

    }

    servOrderItems(req,res){
        const {orderItemModels} = req.body
        const lastPosition = orderItemModels.length  - 1;

        console.log(lastPosition)
        
        

        orderItemModels.forEach(async (item) => {
            try {
                const query = `
                    UPDATE  orderitems
                    SET quantity_serv = '${item.quantity_confirm}'
                    WHERE menu_item_id = '${item.menu_item_id}' AND 
                        order_time = '${item.order_time}' AND
                        order_id = '${item.order_id}'
                `
                await pool.query(query)

                const queryUpdate = `
                    UPDATE kitchen_checklist
                    SET status_id = 3,
                        serv_time = now()
                    WHERE order_item_id = '${item.id}'
                `
    
                await pool.query(queryUpdate)

                if(item == orderItemModels[lastPosition]){
                    const text = `
                    SELECT 
                    CASE WHEN COUNT(*) > 0 AND COUNT(*) = SUM(CAST(quantity_serv = quantity_confirm AS INT)) 
                        THEN true 
                        ELSE false 
                    END AS is_servDish
                    FROM orderitems
                    WHERE order_id = '${item.order_id}';
                    `
                    const result = await pool.query(text)
                    console.log(result.rows[0])
                    return res.json(result.rows[0])
                }

            } catch (error) {
                console.log("err confirm items order ",error, item.order_id)
            }
        });

    }
    

    confirmOrderItemsInCheckList(req,res){
        const {orderItemModels} = req.body
        const lastPosition = orderItemModels.length  - 1;

        
        console.log(orderItemModels)

        orderItemModels.forEach(async (item) => {
            try {
                const query = `
                    UPDATE  orderitems
                    SET quantity_confirm = quantity_confirm + '${item.quantity}'
                    WHERE menu_item_id = '${item.menu_item_id}' AND 
                        order_time = '${item.order_time}' AND
                        order_id = '${item.order_id}'
                `
                await pool.query(query)

                const queryUpdate = `
                    UPDATE kitchen_checklist
                    SET status_id = 2,
                        confirm_time = now()
                    WHERE order_id = '${item.order_id}' and date_trunc('second', notify_time) = '${item.notify_time}'
                    and status_id = '${item.status_id}'
                `
            
                await pool.query(queryUpdate)
                if(item == orderItemModels[lastPosition]){
                    const querySelect = `
                    select oi.id,
                        oi.order_id,
                        oi.order_time,
                        oi.menu_item_id,
                        oi.item_price,
                        oi.note, 
                        ks.status, 
                        kc.status_id, 
                        kc.notify_time,
                        kc.quantity as quantity
                    from kitchen_checklist kc
                    join orderitems oi on oi.id = kc.order_item_id
                    join kitchen_status ks on ks.id = kc.status_id
                    where kc.order_id = '${item.order_id}' and date_trunc('second', kc.notify_time) = '${item.notify_time}'
                    and status_id = 2
                    `
                    const result  = await pool.query(querySelect)
                    return res.json(result.rows)
                }
            } catch (error) {
                console.log("err confirm items order checkList ",error, item.order_id)
            }
        });

    }

    confirmOrderItems(req,res){
        const {orderItemModels} = req.body
        const lastPosition = orderItemModels.length  - 1;

        
        console.log(orderItemModels)

        orderItemModels.forEach(async (item) => {
            try {
                const query = `
                    UPDATE  orderitems
                    SET quantity_confirm = '${item.quantity}'
                    WHERE menu_item_id = '${item.menu_item_id}' AND 
                        order_time = '${item.order_time}' AND
                        order_id = '${item.order_id}'
                `
                await pool.query(query)

                const queryUpdate = `
                    UPDATE kitchen_checklist
                    SET status_id = 2,
                        confirm_time = now()
                    WHERE order_item_id = '${item.id}'
                `
    
                await pool.query(queryUpdate)

                if(item == orderItemModels[lastPosition]){
                    const text = `
                    SELECT 
                    CASE WHEN COUNT(*) > 0 AND COUNT(*) = SUM(CAST(quantity = quantity_confirm AS INT)) 
                        THEN true 
                        ELSE false 
                    END AS is_confirm
                    FROM orderitems
                    WHERE order_id = '${item.order_id}';
                    `
                    const result = await pool.query(text)
                    


                    return res.json(result.rows[0])
                }

            } catch (error) {
                console.log("err confirm items order ",error, item.order_id)
            }
        });

    }
    getAllOrder(req,res){
        const query = `
        SELECT tables.table_id, 
            tables.is_occupied, 
            tables.location_id, 
            tables.table_name, 
            orders.order_date,
            orders.total_amount,
            orders.order_id
        FROM tables
        LEFT JOIN orders ON tables.table_id = orders.table_id
        Order by table_id ASC 
    `
    pool.query(query,[],(err,result)=>{
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'An error occurred.' });
            return;
        }
        return res.json(result.rows)
    })
    }
}

module.exports = new KitChenController