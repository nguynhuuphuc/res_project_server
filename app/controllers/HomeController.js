const pool = require('../../config/db')

class HomeController{
    index(req,res){
        return res.send("Home")
    }

    readMessages(req,res){
        const {conversation_id} = req.body;
        const text = `
            UPDATE messages
            SET is_read = true
            WHERE is_read = false and conversation_id = ${conversation_id}
        `
        pool.query(text)
        .then(()=>{
            console.log("Read Messages SUCCESS")
        })
        .catch((err)=>console.log("Err read messages:",err))
    }

    getConversation(req,res){
        const {date,conversation_id} = req.body;
        console.log(date,conversation_id)
        const text = `
            with messages_filter as(
                select * from messages 
                where 
                    date_trunc('minute',timestamp) <= date_trunc('minute','${date}'::timestamp) AND
                    conversation_id = ${conversation_id}
                order by timestamp desc limit 30
            )
            select 
                msf.id, 
                msf.conversation_id, 
                msf.sender_id,
                msf.receiver_id,
                content,
                timestamp,
                ct.*,
                cs.employee_id
            from messages_filter msf
            left join conversations cs on msf.conversation_id = cs.id
            left join customers ct on cs.customer_id = ct.customer_id
            order by timestamp 
        `

        pool.query(text)
        .then((result)=>{
            console.log(result.rows)
            return res.json(result.rows)
        })
        .catch((err)=>console.log("get conversation err: ",err))
    }

    getConversations(req,res){
        const text =  `
            with un_read_messages as(
                SELECT COUNT(*) AS unread_count,conversation_id
                FROM messages
                WHERE is_read = false
                group by conversation_id
            )
            select cs.id, ct.customer_id, ct.full_name, ct.avatar, mes.sender_id, mes.receiver_id, content as last_message, timestamp,COALESCE(unread_count,0) as un_read
            from conversations cs
            join customers ct on cs.customer_id = ct.customer_id
            join messages mes on cs.last_message_id = mes.id
            left join un_read_messages urm on cs.id = urm.conversation_id
            order by timestamp desc
        `

        pool.query(text)
        .then((result)=>{
            console.log(result.rows)
            return res.json(result.rows)
        })
        .catch((err)=>console.log("get conservations err : ",err))


    }

    get_table_by_id(req,res){
        const {table_id} = req.body

        const text = `
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
            WHERE tables.table_id = '${table_id}'
        `
        pool.query(text)
        .then((result)=>{
            return res.json(result.rows[0])
        })
        .catch((err)=>{
            console.log("Error get table by id", err)
        })

    }


    get_all_tables(req,res){
        const{user_uid} = req.body
        getAllTables(res)

        // pool.query('SELECT * FROM employees WHERE user_uid = $1',[user_uid] ,(err, result) => {
        //     if (err) {
        //       console.error(err);
        //       res.status(500).json({ error: 'An error occurred.' });
        //       return;
        //     }
        //     if(result.rowCount == 1){
        //         getAllTables(res)
        //     }
    
        // })
    }
    get_locations(req,res){
        const{user_uid} = req.body
        getLocations(res)
         
    }

    
}

function getAllTables(res){
    const query = `
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
            Order by tables.table_id ASC
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

function getLocations(res){
    const query = `
        Select *
        From locations
        Order by location_id ASC 
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

module.exports = new HomeController;