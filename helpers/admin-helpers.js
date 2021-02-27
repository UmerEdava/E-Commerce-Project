var db = require('../config/connection');
var collection = require('../config/collections');
var objectId = require('mongodb').ObjectID;
var moment = require('moment');
var voucher_codes = require('voucher-code-generator');

module.exports = {
    doLogin: (adminData) => {
        let loginStatus = false
        let response = {}

        return new Promise(async (resolve, reject) => {
            let adminDefined = {
                email: 'umeredava@gmail.com',
                password: '123'
            }
            if (adminData.email == adminDefined.email && adminData.password == adminDefined.password) {
                response.admin = adminDefined
                response.status = true
                resolve(response)
            } else {
                resolve({
                    status: false
                })
            }
        })
    },
    addOfferForProduct: (offerDetails) => {
        return new Promise((resolve, reject) => {

            console.log('this is start date******', offerDetails.startDate);

            var proId = offerDetails.proId
            var offerPercentage = offerDetails.offerPercentage
            var startDate = moment(offerDetails.startDate).format("L")
            var lastDate = moment(offerDetails.lastDate).format("L")

            console.log("date kaananoo", startDate, lastDate);

            console.log(offerPercentage);

            var offerPrice
            var actualPrice

            db.get().collection(collection.PRODUCT_COLLECTION).findOne({
                _id: objectId(proId)
            }).then((product) => {

                offerPrice = product.price - (product.price * offerPercentage / 100)
                actualPrice = product.price

                db.get().collection(collection.PRODUCT_COLLECTION).updateOne({
                    _id: objectId(proId)
                }, {

                    $set: {
                        price: offerPrice,
                        actualPrice: actualPrice,
                        offerPercentage: offerPercentage,
                        startDate: startDate,
                        lastDate: lastDate
                    }
                })
            })

            resolve()

        })
    },
    removeOfferForProduct: (proId) => {
        return new Promise((resolve, reject) => {
            let product = db.get().collection(collection.PRODUCT_COLLECTION).findOne({
                _id: objectId(proId)
            })
            console.log(product);
            var actualPrice = product.actualPrice
            var offerPrice = product.price
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({
                _id: objectId(proId)
            }, {
                $set: {
                    price: actualPrice
                },
                $unset: {
                    startDate: 1,
                    lastDate: 1,
                    offerPercentage: 1,
                    actualPrice: 1
                }
            })
            resolve()
        })
    },
    editOfferForProduct: (offerEditedDetails) => {
        console.log('functionil vannu', offerEditedDetails);
        return new Promise((resolve, reject) => {
            var proId = offerEditedDetails.proId
            var offerPercentage = offerEditedDetails.offerPercentage
            var startDate = moment(offerEditedDetails.startDate).format("L")
            var lastDate = moment(offerEditedDetails.lastDate).format("L")
            var actualPrice
            var offerPrice

            db.get().collection(collection.PRODUCT_COLLECTION).findOne({
                _id: objectId(proId)
            }).then((product) => {

                console.log(product);

                offerPrice = product.actualPrice - (product.actualPrice * offerPercentage / 100)
                actualPrice = product.actualPrice

                console.log(offerPrice);
                console.log(actualPrice);

                db.get().collection(collection.PRODUCT_COLLECTION).updateOne({
                    _id: objectId(proId)
                }, {

                    $set: {
                        price: offerPrice,
                        actualPrice: actualPrice,
                        offerPercentage: offerPercentage,
                        startDate: startDate,
                        lastDate: lastDate
                    }
                })

                console.log('new', offerPercentage,
                    startDate,
                    lastDate,
                    actualPrice,
                    offerPrice);

                resolve()
            })

        })

    },
    addOfferForCategory: (offerDetails) => {
        return new Promise(async (resolve, reject) => {
            
            var startDate = moment(offerDetails.startDate).format("L")
            var lastDate = moment(offerDetails.lastDate).format("L")
            var actualPrice
            var offerPrice
            console.log('functionil', offerDetails);

            var percentage = offerDetails.offerPercentage

            console.log(percentage);

            db.get().collection(collection.PRODUCT_COLLECTION).find({
                for: offerDetails.category
            }).toArray().then((products) => {

                var length = products.length
                var products = products

                for (i = 0; i < length; i++) {
                    db.get().collection(collection.PRODUCT_COLLECTION).updateOne({
                        _id: products[i]._id
                    }, {
                        $set: {
                            actualPrice: products[i].price,
                            price: products[i].price - products[i].price * percentage / 100,
                            categoryOfferPercentage: percentage,
                            startDate: startDate,
                            lastDate: lastDate
                        }
                    })
                }
            })

            resolve()

        })
    },
    removeCategoryOffer: (category) => {
        console.log('why not string',category);
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).find({
                for: category
            }).toArray().then((products) => {
    
                var length = products.length
                var products = products
    
                console.log(products);
    
                for (i = 0; i < length; i++) {
                    db.get().collection(collection.PRODUCT_COLLECTION).updateOne({
                        _id: products[i]._id
                    }, {
                        $set: {
                            price: products[i].actualPrice,
                        },
                        $unset: {
                            categoryOfferPercentage:1,
                            actualPrice:1,
                            startDate:1,
                            lastDate:1,
                        }
                    })
                }
            })

            resolve()

        })
        
    },
    getProductDetailsForCategory: (category)=>{
        console.log('ethiyo',category);
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({
                for: category
            }).then((product) => {
                console.log('vannedea',product);
                resolve(product)
            })
        })
    },
    editOfferForCategory: () => {

    },
    saveCoupon: (couponDetails, couponCode) => {
        console.log(couponDetails);
        return new Promise((resolve, reject) => {
            db.get().collection(collection.COUPON_COLLECTION).insertOne({
                startDate: couponDetails.startDate,
                lastDate: couponDetails.lastDate,
                amount: couponDetails.amount,
                code: couponCode
            })
        })
    },
    getAllCoupons: () => {
        return new Promise((resolve, reject) => {
            let coupons = db.get().collection(collection.COUPON_COLLECTION).find().toArray()

            resolve(coupons)

        })
    },
    verifyCoupon: (enteredValue) => {
        return new Promise(async (resolve, reject) => {
            console.log("function 1", enteredValue.couponCode);
            var orderTotal
            var discountAmount
            let coupon = await db.get().collection(collection.COUPON_COLLECTION).findOne({
                code: enteredValue.couponCode
            })
            console.log(coupon);
            resolve(coupon)
        })
    },
    deleteCoupon: (couponId) => {
        return new Promise((resolve, reject) => {
            console.log('funcitonil', couponId);

            db.get().collection(collection.COUPON_COLLECTION).findOne({
                _id: objectId(couponId)
            }).then(() => {
                resolve()
            })
        })
    },
    getMenOffer: () => {
        return new Promise(async (resolve, reject) => {
            let categoryOfferExist = db.get().collection(collection.PRODUCT_COLLECTION).findOne({
                for: 'men'
            }, {
                categoryOffer: 'true'
            })

            console.log(categoryOfferExist, 'athengane');

            if (!categoryOfferExist) {
                let menProducts = await db.get().collection(collection.PRODUCT_COLLECTION).find({
                    for: 'Men'
                }).toArray()
                console.log('aanungalude', menProducts);
                console.log('vanna rekshapettu', menProducts[0].offerPercentage);
                var percentage = menProducts[0].offerPercentage
                resolve(percentage)
            } else {
                console.log('ok');
            }


        })
    },
    getAllOrders: () => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION)
                .find({}).toArray()
            console.log('orders', orders);
            resolve(orders)
        })
    },
    getPendingOrdersCount: () => {
        return new Promise(async(resolve,reject)=>{
            let pendingOrders = await db.get().collection(collection.ORDER_COLLECTION).find({
                status:'pending'
            }).toArray()

            console.log(pendingOrders);

            var count = pendingOrders.length

            console.log(count);

            resolve(count)
        })
    },
    getDeliveredOrdersCount: () => {
        return new Promise(async(resolve,reject)=>{
            let deliveredOrders = await db.get().collection(collection.ORDER_COLLECTION).find({
                status:'delivered'
            }).toArray()

            console.log(deliveredOrders);

            var count = deliveredOrders.length

            console.log(count);

            resolve(count)
        })
    },
    getPlacedOrdersCount: () => {
        return new Promise(async(resolve,reject)=>{
            let placedOrders = await db.get().collection(collection.ORDER_COLLECTION).find({
                status:'placed'
            }).toArray()

            console.log(placedOrders);

            var count = placedOrders.length

            console.log(count);

            resolve(count)
        })
    },
    getShippedOrdersCount: () => {
        return new Promise(async(resolve,reject)=>{
            let shippedOrders = await db.get().collection(collection.ORDER_COLLECTION).find({
                status:'shipped'
            }).toArray()

            console.log(shippedOrders);

            var count = shippedOrders.length

            console.log(count);

            resolve(count)
        })
    },
    getCancelledOrdersCount: () => {
        return new Promise(async(resolve,reject)=>{
            let cancelledOrders = await db.get().collection(collection.ORDER_COLLECTION).find({
                status:'cancelled'
            }).toArray()

            console.log(cancelledOrders);

            var count = cancelledOrders.length

            console.log(count);

            resolve(count)
        })
    },
    getOrdersCount: () => {
        return new Promise(async(resolve,reject)=>{
            let allOrders = await db.get().collection(collection.ORDER_COLLECTION).find().toArray()

            console.log(allOrders);

            var count = allOrders.length

            console.log(count);

            resolve(count)
        })
    },
    confirmOrder: (orderId) => {
        console.log('queriyil ethiye..',orderId);
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(orderId)},{
                $set:{
                    status:'confirmed'
                }
            })
            resolve()
        })
    },
    cancelOrder: (orderId) => {
        console.log('queriyil ethiye..',orderId);
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(orderId)},{
                $set:{
                    status:'cancelled'
                }
            })
            resolve()
        })
    },
    shipOrder: (orderId) => {
        console.log('queriyil ethiye..',orderId);
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(orderId)},{
                $set:{
                    status:'shipped'
                }
            })
            resolve()
        })
    },
    deliveredOrder: (orderId) => {
        console.log('queriyil ethiye..',orderId);
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(orderId)},{
                $set:{
                    status:'delivered'
                }
            })
            resolve()
        })
    },
    salesRevenue: () => {
        return new Promise(async(resolve,reject)=>{
            // let deliveredOrders = await db.get().collection(collection.ORDER_COLLECTION).find({status:'delivered'}).toArray()
            // console.log(deliveredOrders);

            // let amount = deliveredOrders[0].totalAmount

            // console.log(amount);

            let totalRevenue =await db.get().collection(collection.ORDER_COLLECTION).aggregate([{
                $group: {
                 _id: null,
                 total: { $sum: "$totalAmount" }
                }
              }]).toArray()

              console.log(totalRevenue);

              resolve(totalRevenue)

             
        })

    },
    reportOfSales: (firstDate,lastDate) => {
        console.log(firstDate,lastDate);
        return new Promise(async(resolve,reject)=>{
            let salesReport =await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{
                        date:{
                            $gte:firstDate,$lte:lastDate
                        }
                    }
                },
                {
                    $project:{
                        totalAmount:1,
                        paymentMethod:1,
                        status:1,
                        date:1,
                        deliveryDetails:1
                    }
                }
            ]).toArray()
            resolve(salesReport)
        })
    }
}