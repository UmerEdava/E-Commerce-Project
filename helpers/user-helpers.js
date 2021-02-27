var db = require('../config/connection');
var collections = require('../config/collections');
var objectId = require('mongodb').ObjectID;
const moment = require('moment')
const Razorpay = require('razorpay')
var instance = new Razorpay({
    key_id: 'rzp_test_pq8S6HNUCPVXHT',
    key_secret: 'UYHO1TeyMC1Jf5mem4p2hqh2',
});

var paypal = require('paypal-rest-sdk');
paypal.configure({
    'mode': 'sandbox', //sandbox or live 
    'client_id': 'AaMe_nfrAkCyqpIwm2kbokqaA8c3yx0oUdoRnqxgF6qfegourFbXA9PGKtTwpIpOVEc8f_FRa3C3uEz6', // please provide your client id here 
    'client_secret': 'ELE3myMiYsLvsZE4eV9E5GNChhSG7o2bdas70geHg-3q8P6reKklbdqc10swkSpB2sZIVqcmZz_yaL7s' // provide your client secret here 
});

const bcrypt = require('bcrypt');
const {
    response
} = require('express');

module.exports = {
    otpRegisterCheck: (userData) => {

        return new Promise(async (resolve, reject) => {
            let emailExists = await db.get().collection(collections.USER_COLLECTION).findOne({
                email: userData.email
            })

            let phoneExists = await db.get().collection(collections.USER_COLLECTION).findOne({
                phone: userData.phone
            })

            if (!emailExists && !phoneExists) {
                resolve()
            } else {
                reject()
            }
        })
    },
    doRegister: (userData) => {
        return new Promise(async (resolve, reject) => {
            userData.password = await bcrypt.hash(userData.password, 10)
            db.get().collection(collections.USER_COLLECTION).insertOne(userData).then((data) => {
                resolve(data.ops[0])
            })
        })
    },
    doLogin: (userData) => {
        let loginStatus = false
        let response = {}

        return new Promise(async (resolve, reject) => {

            let user = await db.get().collection(collections.USER_COLLECTION).findOne({
                email: userData.email
            })
            if (user) {
                bcrypt.compare(userData.password, user.password).then((status) => {
                    if (status) {

                        let blocked = user.blocked

                        if (!blocked) {
                            response.user = user
                            response.status = true
                            resolve(response)
                        } else {
                            console.log('blocked user');
                            reject()
                        }


                    } else {
                        console.log('login failed');
                        resolve({
                            status: false
                        })
                    }
                })
            } else {
                console.log('not a user');
                resolve({
                    status: false
                })
            }


        })
    },
    otpLogin: (mobileNumber) => {
        let loginStatus = false
        let response = {}

        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collections.USER_COLLECTION).findOne({
                phone: mobileNumber
            })
            response.user = user
            response.status = true

            resolve(response)
        })
    },
    getAllUsers: () => {
        return new Promise(async (resolve, reject) => {
            let users = await db.get().collection(collections.USER_COLLECTION).find().toArray()
            resolve(users)
        })
    },
    removeUser: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.USER_COLLECTION).removeOne({
                _id: objectId(userId)
            }).then((response) => {
                resolve(response)
            })
        })
    },
    getUserDetails: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.USER_COLLECTION).findOne({
                _id: objectId(userId)
            }).then((user) => {
                resolve(user)
            })
        })
    },
    getUserAddress: (userId) => {
        console.log('queriyil id vanne..', userId);
        return new Promise(async (resolve, reject) => {
            console.log('idyee', userId);

            let address = await db.get().collection(collections.USER_COLLECTION).findOne({
                _id: objectId(userId)
            })


            resolve(address.address)


        })
    },
    getUserDetailsByPhone: (phone) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.USER_COLLECTION).findOne({
                phone: objectId(phone)
            }).then((user) => {
                resolve(user)
            })
        })
    },
    updateUser: (userId, userDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.USER_COLLECTION).updateOne({
                _id: objectId(userId)
            }, {
                $set: {
                    firstName: userDetails.firstName,
                    lastName: userDetails.lastName,
                    phone: userDetails.phone,
                    email: userDetails.email,
                    gender: userDetails.gender,
                    age: userDetails.age
                }
            }).then((response) => {
                resolve()
            })
        })
    },
    addToCart: (proId, userId) => {
        let proObj = {
            item: objectId(proId),
            quantity: 1
        }

        return new Promise(async (resolve, reject) => {

            let userCart = await db.get().collection(collections.CART_COLLECTION).findOne({
                user: objectId(userId)
            })

            console.log(proId);
            console.log((userId));

            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item == proId)
                console.log(proExist);
                if (proExist != -1) {
                    db.get().collection(collections.CART_COLLECTION).updateOne({
                        user: objectId(userId),
                        'products.item': objectId(proId)
                    }, {
                        $inc: {
                            'products.$.quantity': 1
                        }
                    }).then(() => {
                        resolve()
                    })
                } else {
                    console.log('existing cart');
                    db.get().collection(collections.CART_COLLECTION).updateOne({
                        user: objectId(userId)
                    }, {
                        $push: {
                            products: proObj
                        }
                    }).then((response) => {
                        resolve()
                    })
                }
            } else {
                let cartObj = {
                    user: objectId(userId),
                    products: [proObj]
                }

                db.get().collection(collections.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })
    },
    addToLogoutCart: (proId) => {
        console.log(proId, 'arrived here ***');
        let proObj = {
            item: objectId(proId),
            quantity: 1
        }

        return new Promise((resolve, reject) => {

            db.get().collection(collections.CART_COLLECTION).updateOne({
                for: 'logoutCart'
            }, {
                $push: {
                    products: proObj
                }
            }).then((response) => {
                resolve()
            })
        })
    },
    transferLogoutCartProductsToUserCart: (userId) => {

        let logoutCart = db.get().collection(collections.CART_COLLECTION).find({
            for: 'logoutCart'
        }).toArray()
        console.log(logoutCart, 'what i have missed');

    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collections.CART_COLLECTION).aggregate([{
                    $match: {
                        user: objectId(userId)
                    }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collections.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'productDetails'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: {
                            $arrayElemAt: ['$productDetails', 0]
                        },
                        subTotal: {$multiply:[{$arrayElemAt:["$productDetails.price",0]},"$quantity"]}
                    }
                }
            ]).toArray()

            console.log(cartItems);

            resolve(cartItems)
        })
    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            console.log(userId, 'user id called');
            let count = 0
            let cart = await db.get().collection(collections.CART_COLLECTION).findOne({
                user: objectId(userId)
            })

            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },
    changeProQty: (details) => {
        count = parseInt(details.count)
        quantity = parseInt(details.quantity)
        return new Promise((resolve, reject) => {
            if (count == -1 && quantity == 1) {
                db.get().collection(collections.CART_COLLECTION).updateOne({
                    _id: objectId(details.cart)
                }, {
                    $pull: {
                        products: {
                            item: objectId(details.product)
                        }
                    }
                }).then((response) => {
                    resolve({
                        removeProduct: true
                    })
                })
            } else {
                db.get().collection(collections.CART_COLLECTION).updateOne({
                    _id: objectId(details.cart),
                    'products.item': objectId(details.product)
                }, {
                    $inc: {
                        'products.$.quantity': count
                    }
                }).then((response) => {
                    resolve({
                        status: true
                    })
                })
            }

        })
    },
    clearCart: (userId) => {
        console.log(userId, 'arrived in query');
        return new Promise((resolve, reject) => {
            db.get().collection(collections.CART_COLLECTION).deleteOne({
                user: objectId(userId.userId)
            })
            resolve()
        })
    },
    removeProductFromCart: (productDetails) => {
        console.log(productDetails, 'hari arrived in query');
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.CART_COLLECTION).updateOne({
                _id: objectId(productDetails.cart)
            }, {
                $pull: {
                    products: {
                        item: objectId(productDetails.product)
                    }
                }
            })
    
            console.log('over');
    
            resolve()
        })
        
    },
    signupOtpRequest: (number, email) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collections.USER_COLLECTION).findOne({
                phone: number,
                email: email
            })

            if (user) {
                resolve(user.phone)
            } else {
                reject()
            }
        })
    },
    loginOtpRequest: (number) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collections.USER_COLLECTION).findOne({
                phone: number
            })

            

            console.log(user);

            if(!user.blocked){
                if (user) {
                    resolve(user.phone)
                } else {
                    reject()
                }
            }else{
                resolve('blocked')
            }

            
        })
    },
    getCartTotal: (userId) => {
        console.log(userId, 'user id in getcarttotal');
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collections.CART_COLLECTION).aggregate([{
                    $match: {
                        user: objectId(userId)
                    }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collections.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'productDetails'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: {
                            $arrayElemAt: ['$productDetails', 0]
                        }
                    }
                },
                {
                    $project: {
                        quantity: {
                            $toInt: '$quantity'
                        },
                        unitPrice: {
                            $toInt: '$product.price'
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: {
                                $multiply: ['$quantity', '$unitPrice']
                            }
                        }
                    }
                }
            ]).toArray()
            
            if(total.length>0){
                resolve(total[0].total)
            }else{
                total = 0
                resolve(total)
            }
            
        })
    },
    getSubTotal: (userId) => {
        console.log(userId, 'user id in getcarttotal');
        return new Promise(async (resolve, reject) => {
            let subTotal = await db.get().collection(collections.CART_COLLECTION).aggregate([{
                    $match: {
                        user: objectId(userId)
                    }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collections.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'productDetails'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: {
                            $arrayElemAt: ['$productDetails', 0]
                        }
                    }
                },
                {
                    $project: {
                        quantity: {
                            $toInt: '$quantity'
                        },
                        unitPrice: {
                            $toInt: '$product.price'
                        }
                    }
                },
                {
                    $project: {
                        _id: null,
                        subTotal: {
                            $sum: {$multiply:['$quantity','$unitPrice']}
                        }
                    }
                },
                
            ]).toArray()
            
            if(subTotal.length>0){
                resolve(subTotal[0].subTotal)
            }else{
                subTotal = 0
                resolve(subTotal)
            }
            
        })
    },
    getSubtotal: (userId) => {
        console.log('userIduserId', userId);

        return new Promise(async (resolve, reject) => {
            let subTotal = await db.get().collection(collections.CART_COLLECTION).aggregate([{
                    $match: {
                        user: objectId(userId)
                    }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collections.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'productDetails'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: {
                            $arrayElemAt: ['$productDetails', 0]
                        }
                    }
                },
                {
                    $project: {
                        quantity: {
                            $toInt: '$quantity'
                        },
                        unitPrice: {
                            $toInt: '$product.price'
                        }
                    }
                },
                {
                    $project: {
                        subTotal: {
                            $multiply: ["$unitPrice", "$quantity"]

                        }
                    }

                }

            ]).toArray()
            console.log('cart total', subTotal);
            resolve(subTotal)
        })
    },
    placeOrder: (order, products, total) => {
        return new Promise((resolve, reject) => {
            console.log(order, products, total);
            let status = order['payment-method'] === 'COD' ? 'placed' : 'pending'
            let orderObj = {
                deliveryDetails: {
                    firstName: order.firstName,
                    lastName: order.lastName,
                    phone: order.phone,
                    address: order.address,
                    pincode: order.pin
                },
                userId: objectId(order.userId),
                
                paymentMethod: order['payment-method'],
                products: products,
                totalAmount: total,
                status: status,
                date: moment(new Date()).format('L')
            }

            let fullAddress = {
                firstName: order.firstName,
                lastName: order.lastName,
                company: order.company,
                country: order.country,
                state: order.state,
                streetAddress: order.address,
                pin: order.pin,
                town: order.town,
                email: order.email,
                phone: order.phone
            }

            console.log('address', fullAddress);

            db.get().collection(collections.USER_COLLECTION).updateOne({
                _id: objectId(order.userId)
            }, {
                $push: {
                    address: fullAddress
                }
            })

            db.get().collection(collections.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                db.get().collection(collections.CART_COLLECTION).removeOne({
                    user: objectId(order.userId)
                })
                resolve(response.ops[0]._id)
            })
        })
    },
    getCartProductsList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collections.CART_COLLECTION).findOne({
                user: objectId(userId)
            })
            resolve(cart.products)
        })
    },
    getUserOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collections.ORDER_COLLECTION)
                .find({
                    userId: objectId(userId)
                }).toArray()
            resolve(orders)
        })
    },
    getOrderProducts: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collections.ORDER_COLLECTION).aggregate([{
                    $match: {
                        _id: objectId(orderId)
                    }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collections.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'productDetails'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: {
                            $arrayElemAt: ['$productDetails', 0]
                        }
                    }
                }
            ]).toArray()

            console.log(cartItems);
            resolve(cartItems)
        })
    },
    generateRazorpay: (orderId, total) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: total * 100, // amount in the smallest currency unit
                currency: "INR",
                receipt: '' + orderId
            };
            instance.orders.create(options, function (err, order) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('new order', order);
                    resolve(order);
                }
            });
        })
    },
    generatePaypal: (orderId, total) => {
        return new Promise((resolve, reject) => {
            // create payment object 
            var payment = {
                "intent": "authorize",
                "payer": {
                    "payment_method": "paypal"
                },
                "redirect_urls": {
                    "return_url": "http://127.0.0.1:3000/success",
                    "cancel_url": "http://127.0.0.1:3000/err"
                },
                "transactions": [{
                    "amount": {
                        "total": total,
                        "currency": "INR"
                    },
                    "description": " a book on mean stack "
                }]
            }

            // call the create Pay method 
            createPay(payment)
                .then((transaction) => {
                    var id = transaction.id;
                    var links = transaction.links;
                    var counter = links.length;
                    while (counter--) {
                        if (links[counter].method == 'REDIRECT') {
                            // redirect to paypal where user approves the transaction 
                            return res.redirect(links[counter].href)
                        }
                    }
                })
                .catch((err) => {
                    console.log(err);
                    res.redirect('/err');
                });
        })
    },
    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto');
            var hmac = crypto.createHmac('sha256', 'UYHO1TeyMC1Jf5mem4p2hqh2');

            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]']);
            hmac = hmac.digest('hex')
            if (hmac == details['payment[razorpay_signature]']) {
                resolve()
            } else {
                reject()
            }
        })
    },
    changePaymentStatus: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.ORDER_COLLECTION).updateOne({
                _id: objectId(orderId)
            }, {
                $set: {
                    status: 'placed'
                }
            }).then(() => {
                resolve()
            })
        })
    },
    blockUser: (userId) => {
        console.log('queriyil', userId);
        return new Promise((resolve, reject) => {
            db.get().collection(collections.USER_COLLECTION).updateOne({
                _id: objectId(userId)
            }, {
                $set: {
                    blocked: true
                }
            })
            resolve()
        })
    },
    unblockUser: (userId) => {
        console.log('queriyil', userId);
        return new Promise((resolve, reject) => {
            db.get().collection(collections.USER_COLLECTION).updateOne({
                _id: objectId(userId)
            }, {
                $set: {
                    blocked: false
                }
            })
            resolve()
        })
    },
    totalUsers: () => {
        return new Promise(async (resolve, reject) => {
            var count
            var users = await db.get().collection(collections.USER_COLLECTION).find().toArray()
            count = users.length
            console.log('mmm', count);
            resolve(count)
        })
    }
}