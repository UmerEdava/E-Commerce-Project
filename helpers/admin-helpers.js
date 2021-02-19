var db = require('../config/connection');
var collection = require('../config/collections');
var objectId = require('mongodb').ObjectID;
var moment = require('moment');
const collections = require('../config/collections');

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
    removeOfferForProduct: () => {

    }
}