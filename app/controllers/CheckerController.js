const pool = require('../../config/db')

class CheckerController{
    index(req,res){
        res.send("checker")
    }

    async isNotifyOrder(req,res){
        const {order_id} = req.body
        const text = `
                SELECT 
                CASE WHEN SUM(quantity_serv) = SUM(quantity) AND SUM(quantity_serv) > 0
                THEN true
                ELSE false
                END as is_servdish
            FROM orderitems
            WHERE order_id = '${order_id}'
            `
            try{
                const result = await pool.query(text);

                return res.json(result.rows[0])

            }catch (error){
                console.log("checker is notify order ", error)
            }

    }

    async isServOrder(req,res){
        const {order_id} = req.body
        try {
            const text = `
                SELECT 
                CASE WHEN COUNT(*) > 0 AND COUNT(*) = SUM(CAST(quantity_serv = quantity_confirm AS INT))
                    AND quantity_serv <> 0 
                    THEN true 
                    ELSE false 
                END AS is_servdish
                FROM orderitems
                WHERE order_id = '${order_id}'
                GROUP BY quantity_serv;
            `
            const result = await pool.query(text)

            return res.json(result.rows[0])
            
        } catch (error) {
            console.log("checker is confirm order ", error)
        }
        

    }

    async isConfirmOrder(req,res){
        const {order_id} = req.body
        try {
            const text = `
                SELECT 
                CASE WHEN COUNT(*) > 0 AND COUNT(*) = SUM(CAST(quantity = quantity_confirm AS INT)) 
                    THEN true 
                    ELSE false 
                END AS is_confirm
                FROM orderitems
                WHERE order_id = '${order_id}';
            `
            const result = await pool.query(text)

            return res.json(result.rows[0])
            
        } catch (error) {
            console.log("checker is confirm order ", error)
        }
        

    }

    isTableOccupied(req,res){
        const {table_id} = req.body

        const text = `
            SELECT is_occupied
            FROM tables
            WHERE table_id = '${table_id}'
        `
        pool.query(text)
        .then((result)=>{
            console.log(result.rows[0])
            return res.json(result.rows[0])
        })
        .catch((err)=>{
            console.log("Err is table occupied: ", err)
        })
    }
}


module.exports = new CheckerController