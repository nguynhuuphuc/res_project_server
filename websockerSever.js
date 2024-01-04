const WebSocket = require('ws')
const pool = require('./config/db')
const http = require('http')
const ipv4Address = require('./ipv4Address')
const setDefaultJson = require('./setDefault-jsonfile')
const { customerFunction } = require('./customerFunction')





function webSocketServer(app,port) {
  const server = http.createServer(app)
  const wss = new WebSocket.Server({ noServer: true })

  server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  const clients = new Set()

    wss.on('connection',  (ws) => {
      console.log('Client connected');
      clients.add(ws)

      ws.on('message', async (message) => {
      // Xử lý các sự kiện từ ứng dụng khách ở đây
      console.log(message+"")
        try {
          let is_send = false;
          const jsonObject = JSON.parse(message);
          let notifyMessage
          let data
          if(jsonObject.tableInProgress != undefined ){
            is_send = true
            Object.assign(jsonObject,{for_customer: true})
            console.log(jsonObject)
            broadcast(JSON.stringify(jsonObject))
          }else{
            data = await insertToNotifyTable(jsonObject)//Lưu vào bản notifications
            notifyMessage = JSON.parse(data.message)
          }
          
          if(jsonObject.isCustomer != undefined && jsonObject.isCustomer){
            Object.assign(data,await customerFunction(jsonObject))
             
          }else{
            if(jsonObject.to != undefined ){
              console.log(jsonObject.to)
              await updateQuantityNotifyOrderItem(data)
              if(jsonObject.to == "kitchen"){
                Object.assign(notifyMessage, {
                  updateKitchenCheckList : await getUpdateKitchenCheckList(notifyMessage.order_id)
                });
              }
            }
            if(jsonObject.position != undefined && jsonObject.position == "B"){
              Object.assign(notifyMessage, {
                updateKitchenCheckList : await getUpdateKitchenCheckList(notifyMessage.order_id)
              });
              console.log("KITCHEN: ",notifyMessage.order_id)

              if(jsonObject.action != undefined && jsonObject.action == "DELETE_ORDER_ITEMS"){
                Object.assign(notifyMessage, {
                  updateTables : await getTableReCalculateOrder(notifyMessage.order_id)
                });

              }
              data.message = JSON.stringify(notifyMessage)
              const jsonString = JSON.stringify(data, 1, 2)              
              // clients.forEach(client =>{
              //   if(client != ws)
              //     client.send(jsonString)
              // })
              is_send = true;
              broadcast(jsonString)
            }else{

                try {
                   Object.assign(notifyMessage, {
                  updateTables : await getTableChanged(notifyMessage.old_table_id,notifyMessage.new_table_id)
                });
                } catch (error) {}
              }
          }
            if(!is_send){
              data.message = JSON.stringify(notifyMessage)
              const jsonString = JSON.stringify(data) ;
              console.log("OUTSIDE IF:",jsonString)  
              broadcast(jsonString)
            }
           
          
      
          
        } catch (error) {
          console.log("Error: ",error)
        }

      });
        
      ws.on('close', () => {
        clients.delete(ws);
        console.log('Client disconnected');
      });

      function broadcast(message) {
        console.log(message)
        clients.forEach((client) => {
          client.send(message);
        });
      }

    });
    setDefaultJson(ipv4Address())
    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    })
  
    async function getUpdateKitchenCheckList(order_id){
      const text = queryKitchenCheckList(order_id)

      try {
        const result = await pool.query(text)
        return result.rows
        
      } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
      }

    }

    async function getTableReCalculateOrder(order_id){
      const calculate = `
        SELECT calculate_order_total(${order_id})
      `
      const text =`
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
          WHERE orders.order_id = ${order_id}
      `

      try {
        await pool.query(calculate)
        const result = await pool.query(text)
        return result.rows
      } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
      }
      
    }

    async function getTableChanged(old_table_id,new_table_id){
        let conditionOldTable = "";
        if(old_table_id != undefined ){
          conditionOldTable = `
            OR tables.table_id = '${old_table_id}'
          `
        }
        const text = `
          With orders_filter as(
            SELECT o.*
            FROM orders o
            LEFT JOIN reservations r ON o.order_id = r.order_id
            WHERE r.order_id IS NULL
        )	
        SELECT tables.table_id, 
                tables.is_occupied, 
                tables.location_id, 
                tables.table_name, 
                o.order_date,
                o.total_amount,
                o.order_id
              FROM tables
                LEFT JOIN orders_filter o ON tables.table_id = o.table_id
                WHERE tables.table_id = '${new_table_id}'       
      ` + conditionOldTable

      try {
        const result = await pool.query(text)
        return result.rows
      } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
      }

    }

    async function insertToNotifyTable(jsonObject){
      const notifyMessage = JSON.stringify(jsonObject.message)
      let text
      
      if(jsonObject.position != undefined && jsonObject.position == "B"){
        text = `
        INSERT INTO notifications (message, created_by,position_id,action) VALUES
        ('${notifyMessage}', '${jsonObject.from}','B','${jsonObject.action}')
        RETURNING *
      `
      }else{
        text = `
        INSERT INTO notifications (message, created_by,action) VALUES
        ('${notifyMessage}', '${jsonObject.from}','${jsonObject.action}')
        RETURNING *
      `
      }

      
      try {
        const result = await pool.query(text)
        return result.rows[0]
      } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
      }
    }

    async function updateQuantityNotifyOrderItem(data){
      const messageObject = JSON.parse(data.message)

      
      const textUpdate = `
        UPDATE orderitems
        SET quantity_notify = quantity
        WHERE order_id = '${messageObject.order_id}'
        RETURNiNG *
      `
      try {
        const orderItems = await pool.query(`SELECT * FROM orderitems WHERE order_id = '${messageObject.order_id}'`)
        orderItems.rows.forEach(async (item )=>{
          const quantity_noti = item.quantity - item.quantity_notify
          if(quantity_noti > 0){
            const text = `
              INSERT INTO kitchen_checklist(order_item_id,quantity,status_id,order_id)
              VALUES ('${item.id}','${quantity_noti}',1,'${item.order_id}')
            `
            await pool.query(text)
          }
        })

        const result =  await pool.query(textUpdate)
        console.log(result.rows)
      
      } catch (error) {
        console.error('Error updateQuantityNotifyOrderItem:', error);
        throw error;
      }

    }
    function queryKitchenCheckList(order_id){
      return `
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
    WHERE o.order_id = '${order_id}'
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
    }
}


module.exports = webSocketServer