const { text } = require('express');
const pool = require('../../config/db')

class BookingController{
    index(req,res){
        return res.send('BOoking')
    }

    dishesAndTable(req,res){
        const {orderItemModels,reservation_id,table_id,total_amount,date,quantity_people,created_time} = req.body

        console.log(reservation_id)
        var orderItemModelList = new OrderItemModelList;
        orderItemModelList = orderItemModels;
        const text = `
        INSERT INTO orders (table_id,total_amount,order_date)
        VALUES (${table_id},${total_amount},'${date}')
        RETURNING order_id
        `
        pool.query(text)
        .then(async(result)=>{
            const order_id = result.rows[0].order_id;
            const text = `
                UPDATE reservations
                SET reservation_time = '${date}',
                    table_id = ${table_id},
                    quantity_people = ${quantity_people},
                    status = 'Chờ xác nhận',
                    order_id = ${order_id},
                    created_time = '${created_time}'::timestamp
                WHERE id = ${reservation_id}
            `
            try {
                await pool.query(text)
            } catch (error) {
                console.log(" reservations err: ",error)
            }
           
            
            const text2 = `
                    INSERT INTO orderitems (order_id,menu_item_id,quantity,item_price,discount_amount,discount_percentage,note,changed_by,order_time)
                    VALUES ('${order_id}',$1,$2,$3,$4,$5,$6,$7,'${date}')
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
                        null
                    ]

                    pool.query(text2,array)
                        .then(()=>{
                            // console.log('Order item inserted successfully');
                            if(item == orderItemModelList[orderItemModelList.length - 1]){

                                return res.json({message:'Booking success'})
                            }

                        })
                        .catch((error) => {
                            console.error('Error inserting order item:', error);
                        })
                });

        })
        .catch((err)=>{
            console.log("new orders err: ",err)
        })
    }

    dishesOnly(req,res){
        const {orderItemModels,customer_id,table_id,total_amount,date,quantity_people} = req.body

        var orderItemModelList = new OrderItemModelList;
        orderItemModelList = orderItemModels;
        const text = `
        INSERT INTO orders (table_id,total_amount,order_date)
        VALUES (${table_id},${total_amount},'${date}')
        RETURNING order_id
        `
        pool.query(text)
        .then(async(result)=>{
            const order_id = result.rows[0].order_id;
            const text = `
                INSERT INTO reservations(customer_id,reservation_time,table_id,quantity_people,status,order_id)
                VALUES (${customer_id},'${date}',${table_id},${quantity_people},'Chờ xác nhận',${order_id})
                RETURNING id
            `
            let reservation_id = -1;
            try {
                const result = await pool.query(text)
                reservation_id = result.rows[0].id
            } catch (error) {
                console.log("new reservations err: ",error)
            }
           
            
            const text2 = `
                    INSERT INTO orderitems (order_id,menu_item_id,quantity,item_price,discount_amount,discount_percentage,note,changed_by,order_time)
                    VALUES ('${order_id}',$1,$2,$3,$4,$5,$6,$7,'${date}')
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
                        null
                    ]

                    pool.query(text2,array)
                        .then(()=>{
                            // console.log('Order item inserted successfully');
                            if(item == orderItemModelList[orderItemModelList.length - 1]){

                                return res.json({message:'Booking success', reservation_id: reservation_id})
                            }

                        })
                        .catch((error) => {
                            console.error('Error inserting order item:', error);
                        })
                });

        })
        .catch((err)=>{
            console.log("new orders err: ",err)
        })
        
    
    }

    reservationInProgressRelease(req,res){
        const {reservation_id} = req.body
        console.log(reservation_id)
        const text =`
            UPDATE reservations
            SET in_progress = false
            WHERE id = ${reservation_id}
        `
        pool.query(text)
        .then(()=>{
            return res.json({message: "Release Reservation Success"})
        })
        .catch((err)=>console.log("err reservation In Progress Release: ",err))
    }

    reservationInProgress(req,res){
        const {customer_id,table_id,date} = req.body
        console.log(date)
        const text =`
            INSERT INTO reservations(table_id,customer_id,in_progress,created_time)
            VALUES (${table_id},${customer_id},'true','${date}')
            RETURNING id
        `
        pool.query(text)
        .then((result)=>{
            console.log(result.rows[0])
            return res.json(result.rows[0])
        })
        .catch((err)=>console.log("err reservation In Progress: ",err))
    }
    updateReservationStatus(req,res){
        const {reservation_id,status,update_time} = req.body;
        console.log(update_time)
        const text = `
            UPDATE reservations
            SET status = '${status}',
                update_time = '${update_time}'
            WHERE id = ${reservation_id}
        `
        pool.query(text)
        .then(()=>{
            return res.json({message:"Update success"})
        })
        .catch((err)=>console.log("update reservation status :",err))
    }

    tableBooking(req,res){
        const {created_time,table_id,date,quantity_people,reservation_id} = req.body
        console.log(created_time)
        console.log(reservation_id)
        const text = `
            UPDATE reservations
            SET reservation_time = '${date}',
                table_id = ${table_id},
                quantity_people = ${quantity_people},
                status = 'Chờ xác nhận',
                created_time = '${created_time}'::timestamp
            WHERE id = ${reservation_id}
        `
        pool.query(text)
        .then((result)=>{
            return res.json({message: "Booking success", reservation_id : reservation_id})
        })
        .catch((err)=>console.log("err booking table : ",err))
    }

    getReservationByDay2(req,res){
        const {day} = req.body;
        const text = `
            select r.*, c.full_name as customer_name,total_amount
            from reservations r
            left join customers c on r.customer_id = c.customer_id
            left join orders o on r.order_id = o.order_id
            where DATE(reservation_time) = '${day}'::DATE 
            order by  CASE 
                WHEN status = 'Chờ xác nhận' THEN 0
                WHEN status = 'Đã xác nhận' THEN 1
                ELSE 2
                END,
                update_time ASC;
        `
        pool.query(text)
        .then((result)=>{
            console.log(result.rows)
            return res.json(result.rows)
        })
        .catch((err)=> console.log("err get reservation table day: ",err))
    }

    getReservationByDay(req,res){
        const {day,table_id} = req.body;
        const text = `
            select *
            from reservations
            where DATE(reservation_time) = '${day}'::DATE 
            AND table_id = '${table_id}'
            order by reservation_time
        `
        pool.query(text)
        .then((result)=>{
            console.log(result.rows)
            return res.json(result.rows)
        })
        .catch((err)=> console.log("err get reservation table day: ",err))
    }

    getReservations(req,res){
        const text = `
            SELECT *
            from reservations
            where reservation_time >= CURRENT_DATE
        `
        pool.query(text)
        .then((result)=>{
            return res.json(result.rows)
        })
        .catch((err)=> console.log("err get reservations ",err))
    }

    getTables(req,res){
        const text = `
            select table_id,capacity,location_id,table_name
            from tables
            order by table_id
        `
        pool.query(text)
        .then((result)=>{
            return res.json(result.rows)
        })
        .catch((err)=> console.log("err booking get tables: ",err))
    }

    getTableByDay(req,res){
        const {day} = req.body;
        const text =`
            With not_available_tables as(
                SELECT table_id
                FROM reservations
                Where date_trunc('day',reservation_time) = '${day}'
                GROUP BY table_id
                HAVING COUNT(DISTINCT reservation_time) > 1)
            Select t.*,in_progress
            from tables t
            left join not_available_tables nat on nat.table_id = t.table_id
            left join reservations r on r.table_id = t.table_id 
                and (
                    CASE
                        WHEN reservation_time is not null THEN date_trunc('day',r.reservation_time) = '${day}'
                         ELSE date_trunc('day',r.created_time) = '${day}'
                    END)
            where nat is null 
                and (after_available < '22:30:00' or after_available is null)
                and t.table_id <> -1 and (in_progress is null or in_progress = false)
            order by t.table_id
        `
        pool.query(text)
        .then((result)=>{
            console.log(result.rows)
            return res.json(result.rows)
        })
        .catch((err)=>console.log("get table booking err: ",err))

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

module.exports = new BookingController;