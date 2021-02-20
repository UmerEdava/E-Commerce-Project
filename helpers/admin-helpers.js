var db = require('../config/connection');
var collection = require('../config/collections');
var objectId = require('mongodb').ObjectID;
var moment = require('moment');
const collections = require('../config/collections');
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

                console.log(product);

                offerPrice = product.price - (product.price * offerPercentage / 100)
                actualPrice = product.price

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
    addOfferForCategory: (allCategories) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).find({
                for: 'men'
            }).then((men) => {
                console.log(men);
            })

            db.get().collection(collection.PRODUCT_COLLECTION).find({
                for: 'women'
            }).then((women) => {
                console.log(women);
            })

            db.get().collection(collection.PRODUCT_COLLECTION).find({
                for: 'boys'
            }).then((boys) => {
                console.log(boys);
            })

            db.get().collection(collection.PRODUCT_COLLECTION).find({
                for: 'girls'
            }).then((girls) => {
                console.log(girls);
            })

            resolve()
        })
    },
    removeOfferForCategory: () => {

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
        return new Promise(async(resolve, reject) => {
            console.log("function 1",enteredValue);
            var orderTotal
            var discountAmount
            let coupon =await db.get().collection(collection.COUPON_COLLECTION).findOne({code: enteredValue})
            console.log(coupon);
            
        })
    }
}