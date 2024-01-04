const pool = require('./config/db')

async function customerFunction(jsonObject) {
    console.log('Event handled with data:', jsonObject);

    const message = jsonObject.message;
    console.log(message.reservation_id);
    let response = {
        toCustomer: jsonObject.to,
    }
    console.log(response)


    switch (jsonObject.action) {
        case 'ACCEPT_BOOKING':
            Object.assign(response,
                {activity: 'Reservation'},
                {reservation : await getReservationById(message.reservation_id)}) 
            return response;
        case 'BOOKING_TABLE':
            Object.assign(response,
                {activity: 'Reservation'},
                {reservation : await getReservationById(message.reservation_id)})
            if(response.toCustomer == undefined){
                response.toCustomer = response.reservation.customer_id
            }
            console.log(response)
            return response;

        case 'CONVERSATION':
            if(jsonObject.customer != undefined){
                const customer = JSON.parse(jsonObject.customer)
                const result = await savingMessage(customer,jsonObject.content)
                console.log("Customer send: ",result)
                Object.assign(response,
                    {activity: 'Message'},
                    {conversationMessage : result}) 
                return response;
            }
            if(jsonObject.employee != undefined){
                console.log("Employee Respinse")
                const employee = JSON.parse(jsonObject.employee)
                const result = await savingMessage2(jsonObject.conversation_id,
                    employee,jsonObject.content)
                console.log("Employee send: ",result)
                Object.assign(response,
                    {activity: 'Message'},
                    {conversationMessage : result}) 
                return response;
            }

            break;

        default:
            break;
    }
}

async function savingMessage2(conversation_id, employee,content){
    console.log(conversation_id)
    const text =`
        INSERT INTO messages (sender_id, conversation_id, content)
        VALUES (${employee.employee_id}, ${conversation_id}, '${content}')
        RETURNING *
    `
    try {
        const messageId = (await pool.query(text)).rows[0].id

        const queryGet = `
            select 
                msf.id, 
                msf.conversation_id, 
                msf.sender_id,
                msf.receiver_id,
                content,
                timestamp,
                msf.is_read,
                ct.*,
                cs.employee_id
            from messages msf
            left join conversations cs on msf.conversation_id = cs.id
            left join customers ct on cs.customer_id = ct.customer_id
            where msf.id = ${messageId}
        `
        const result =  await pool.query(queryGet);
        return result.rows[0]

    } catch (error) {
        console.error('Error fetching data CONVERSATION 2:', error);
        throw error;
    }
}

async function savingMessage(customer,content){
    const text =`
        INSERT INTO messages (sender_id, conversation_id, content)
        VALUES (${customer.customer_id}, ${customer.customer_id}, '${content}')
        RETURNING id
    `
    try {
        const messageId = (await pool.query(text)).rows[0].id

        const queryGet = `
            select 
                msf.id, 
                msf.conversation_id, 
                msf.sender_id,
                msf.receiver_id,
                content,
                timestamp,
                msf.is_read,
                ct.*,
                cs.employee_id
            from messages msf
            left join conversations cs on msf.conversation_id = cs.id
            left join customers ct on cs.customer_id = ct.customer_id
            where msf.id = ${messageId}
        `
        const result =  await pool.query(queryGet);
        return result.rows[0]

    } catch (error) {
        console.error('Error fetching data CONVERSATION:', error);
        throw error;
    }
}

async function getReservationById(reservation_id){
    const text = `
        SELECT r.*,c.full_name as customer_name, t.table_name
        FROM reservations r
        JOIN customers c on r.customer_id = c.customer_id
        JOIN tables t on r.table_id = t.table_id
        WHERE id = ${reservation_id}
    `
    try {
        const result = await pool.query(text)
        console.log(result.rows[0])
        return result.rows[0]
        
    } catch (error) {
        console.error('Error fetching data ACCEPT_BOOKING:', error);
        throw error;
    }
}

// Xuất hàm để có thể sử dụng từ các file khác
module.exports = { customerFunction };