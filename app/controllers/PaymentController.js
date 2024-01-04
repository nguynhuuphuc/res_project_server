const pool = require('../../config/db')
const VietQR = require('vietqr').VietQR
const moment = require('moment');
const puppeteer = require('puppeteer')

class PaymentController{

    getAllPaymentMethod(req,res){
        const text = `
            select *
            from paymentmethod
            order by payment_method_id
        `
        pool.query(text)
        .then((result)=>{
            return res.json(result.rows)
        })
        .catch((err)=>{
            console.log('Err get all payment method: ',err)
        })


    }

    vnpay_return(req,res){
        let vnp_Params = req.query;

        let secureHash = vnp_Params['vnp_SecureHash'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = sortObject(vnp_Params);

        let config = require('config');
        let tmnCode = config.get('vnp_TmnCode');
        let secretKey = config.get('vnp_HashSecret');

        let querystring = require('qs');
        let signData = querystring.stringify(vnp_Params, { encode: false });
        let crypto = require("crypto");     
        let hmac = crypto.createHmac("sha512", secretKey);
        let signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex");     

        if(secureHash === signed){
            //Kiem tra xem du lieu trong db co hop le hay khong va thong bao ket qua

        //    return res.json({ result: 'success', code: vnp_Params['vnp_ResponseCode']})

            console.log("vnp_Params")
            if(vnp_Params['vnp_ResponseCode'] == "00"){
                return res.redirect("result://?success.sdk.merchantbackapp")
            }else if(vnp_Params['vnp_ResponseCode'] == "24"){
                return res.redirect("result://?cancel.sdk.merchantbackapp")
            }
            return res.redirect("result://?fail.sdk.merchantbackapp")
        } else{
            return res.json({ result: 'success',code: '97'})
        }
    }

    create_payment_url(req,res){

        const{orderModel} = req.body;

        process.env.TZ = 'Asia/Ho_Chi_Minh';
    
        let date = new Date();
        let createDate = moment(date).format('YYYYMMDDHHmmss');
        
        let ipAddr = req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;
        ipAddr = "::ffff:192.168.1.3"
        console.log("ipAddr")
        console.log(ipAddr)

        let config = require('config');
        
        let tmnCode = config.get('vnp_TmnCode');
        let secretKey = config.get('vnp_HashSecret');
        let vnpUrl = config.get('vnp_Url');
        let returnUrl = config.get('vnp_ReturnUrl');
        let orderId = moment(date).format('DDHHmmss');

        if(orderModel.discount_amount != 0){
            orderModel.total_amount = orderModel.total_amount - orderModel.discount_amount
        }else if(orderModel.discount_percent != 0){
            orderModel.total_amount = orderModel.total_amount*(100-orderModel.discount_percent)/100
        }
        let amount = orderModel.total_amount;
        let bankCode = null;
        
        let locale = null;
        if(locale === null || locale === ''){
            locale = 'vn';
        }
        let currCode = 'VND';
        let vnp_Params = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = tmnCode;
        vnp_Params['vnp_Locale'] = locale;
        vnp_Params['vnp_CurrCode'] = currCode;
        vnp_Params['vnp_TxnRef'] = orderId;
        vnp_Params['vnp_OrderInfo'] = 'Thanh toan cho ma GD:' + orderId;
        vnp_Params['vnp_OrderType'] = 'other';
        vnp_Params['vnp_Amount'] = amount * 100;
        vnp_Params['vnp_ReturnUrl'] = returnUrl;
        vnp_Params['vnp_IpAddr'] = ipAddr;
        vnp_Params['vnp_CreateDate'] = createDate;
        if(bankCode !== null && bankCode !== ''){
            vnp_Params['vnp_BankCode'] = bankCode;
        }

        vnp_Params = sortObject(vnp_Params);

        let querystring = require('qs');
        let signData = querystring.stringify(vnp_Params, { encode: false });

        console.log("signData: " + signData)

        let crypto = require("crypto");     
        let hmac = crypto.createHmac("sha512", secretKey);
        let signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex"); 

        console.log("signed: " + signed)
        vnp_Params['vnp_SecureHash'] = signed;
        vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

        console.log(vnpUrl)
        return res.json(vnpUrl)    
    }

    exchange(req,res){
        const {orderModel} = req.body;
        let vietQR = new VietQR({
            clientID: '27900968-e477-4c9d-9949-87acfae3b754',
            apiKey: '44be2ae9-0f19-4e44-b72c-f7ca5389fd86',
        })
        console.log(orderModel)
        if(orderModel.discount_amount != 0){
            orderModel.total_amount = orderModel.total_amount - orderModel.discount_amount
        }else if(orderModel.discount_percent != 0){
            orderModel.total_amount = orderModel.total_amount*(100-orderModel.discount_percent)/100
        }
        // list banks are supported create QR code by Vietqr
        let link = vietQR.genQuickLink({
            bank: '970418',
            accountName: 'NGUYEN HUU PHUC',
            accountNumber: '6503392980',
            amount: orderModel.total_amount,
            memo: 'Thanh toan hoa don',
            template: 'print', 
            media: '.jpg' 
        });
        return res.json(link)
    
    }
}
function sortObject(obj) {
	let sorted = {};
	let str = [];
	let key;
	for (key in obj){
		if (obj.hasOwnProperty(key)) {
		str.push(encodeURIComponent(key));
		}
	}
	str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}

module.exports = new PaymentController