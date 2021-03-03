var db = require('../config/connection')
var collections = require('../config/collections')
var objectId = require('mongodb').ObjectID
const {
    ObjectID
} = require('mongodb')
const {
    response
} = require('express')

module.exports = {
    addProduct: (product, callback) => {
        
        console.log(product);
        product.price = parseInt(product.price)

        db.get().collection('product').insertOne(product).then((data) => {
            callback(data.ops[0]._id)

            console.log(data.ops[0]._id);

            if (product.for == 'Men') {
                db.get().collection(collections.MEN_COLLECTION).updateOne({
                    category: product.category
                }, {
                    $push: {
                        products: objectId(data.ops[0]._id)
                    }
                })
            } else if (product.for == 'Women') {
                db.get().collection(collections.WOMEN_COLLECTION).updateOne({
                    category: product.category
                }, {
                    $push: {
                        products: objectId(data.ops[0]._id)
                    }
                })
            } else if (product.for == 'Boys') {
                db.get().collection(collections.BOYS_COLLECTION).updateOne({
                    category: product.category
                }, {
                    $push: {
                        products: objectId(data.ops[0]._id)
                    }
                })
            } else if (product.for == 'Girls') {
                db.get().collection(collections.GIRLS_COLLECTION).updateOne({
                    category: product.category
                }, {
                    $push: {
                        products: objectId(data.ops[0]._id)
                    }
                })
            }

        })
    },
    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            console.log("called");
            let products = await db.get().collection(collections.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    deleteProduct: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCT_COLLECTION).removeOne({
                _id: objectId(proId)
            }).then((response) => {
                resolve(response)
            })
        })
    },
    getProductDetails: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCT_COLLECTION).findOne({
                _id: objectId(proId)
            }).then((product) => {
                resolve(product)
            })
        })
    },
    editProduct: (proId, productDetails) => {
        
        var intPrice = productDetails.price

        console.log(intPrice);
        var convertedPrice = parseInt(intPrice)
        console.log(convertedPrice);

        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCT_COLLECTION).updateOne({
                _id: objectId(proId)
            }, {
                $set: {
                    name: productDetails.name,
                    for: productDetails.for,
                    category: productDetails.category,
                    price: convertedPrice,
                    stock: productDetails.shortDescription,
                    description: productDetails.description
                }
            }).then((response) => {
                resolve()
            })
        })
    },
    addMenCategory: (category) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.MEN_COLLECTION).insertOne(category).then(() => {
                resolve()
            })
        })
    },
    addWomenCategory: (category) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.WOMEN_COLLECTION).insertOne(category).then(() => {
                resolve()
            })
        })
    },
    addBoysCategory: (category) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.BOYS_COLLECTION).insertOne(category).then(() => {
                resolve()
            })
        })
    },
    addGirlsCategory: (category) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.GIRLS_COLLECTION).insertOne(category).then(() => {
                resolve()
            })
        })
    },
    getMenCategoryProducts: () => {
        return new Promise(async (resolve, reject) => {
            let menCategory = await db.get().collection(collections.MEN_COLLECTION).aggregate([{
                $project: {
                    products: '$products'
                }
            }])
            console.log(menCategory);
            resolve(menCategory)
        })
    },
    getWomenCategories: () => {
        return new Promise((resolve, reject) => {
            let womenCategory = db.get().collection(collections.WOMEN_COLLECTION).find()

            resolve(womenCategory)
        })
    },
    getBoysCategories: () => {
        return new Promise((resolve, reject) => {
            let boysCategory = db.get().collection(collections.BOYS_COLLECTION).find()

            resolve(boysCategory)
        })
    },
    getGirlsCategories: () => {
        return new Promise((resolve, reject) => {
            let girlsCategory = db.get().collection(collections.GIRLS_COLLECTION).find()

            resolve(girlsCategory)
        })
    },
    getMenCategoryList: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.MEN_COLLECTION).find().toArray().then((menCategories) => {
                console.log(menCategories);
                resolve(menCategories)
            })
        })
    },
    getWomenCategoryList: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.WOMEN_COLLECTION).find().toArray().then((womenCategories) => {
                console.log(womenCategories);
                resolve(womenCategories)
            })
        })
    },
    getBoysCategoryList: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.BOYS_COLLECTION).find().toArray().then((boysCategories) => {
                console.log(boysCategories);
                resolve(boysCategories)
            })
        })
    },
    getGirlsCategoryList: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.GIRLS_COLLECTION).find().toArray().then((girlsCategories) => {
                console.log(girlsCategories);
                resolve(girlsCategories)
            })
        })
    },
    getMenCollection: () => {
        return new Promise(async (resolve, reject) => {
            console.log('called function');
            let men = await db.get().collection(collections.PRODUCT_COLLECTION).find({
                for: 'Men'
            }).toArray()
            console.log(men)
            resolve(men)
        })
    },
    getWomenCollection: () => {
        return new Promise(async (resolve, reject) => {
            let women = await db.get().collection(collections.PRODUCT_COLLECTION).find({
                for: 'Women'
            }).toArray()
            console.log(women)
            resolve(women)
        })
    },
    getGirlsCollection: () => {
        return new Promise(async (resolve, reject) => {
            let girls = await db.get().collection(collections.PRODUCT_COLLECTION).find({
                for: 'girls'
            }).toArray()
            console.log(girls)
            resolve(girls)
        })
    },
    getBoysCollection: () => {
        return new Promise(async (resolve, reject) => {
            let boys = await db.get().collection(collections.PRODUCT_COLLECTION).find({
                for: 'Boys'
            }).toArray()
            console.log(boys)
            resolve(boys)
        })
    },
    clearMenCollection: () => {
        db.get().collection(collections.PRODUCT_COLLECTION).deleteMany({
            for: 'men'
        })
    },
    clearWomenCollection: () => {
        db.get().collection(collections.PRODUCT_COLLECTION).deleteMany({
            for: 'women'
        })
    },
    clearBoysCollection: () => {
        db.get().collection(collections.PRODUCT_COLLECTION).deleteMany({
            for: 'boys'
        })
    },
    clearGirlsCollection: () => {
        db.get().collection(collections.PRODUCT_COLLECTION).deleteMany({
            for: 'girls'
        })
    },
    countOfProducts: () => {
        
        return new Promise(async(resolve, reject) => {
            var count

            var products = await db.get().collection(collections.PRODUCT_COLLECTION).find().toArray()

            count = products.length

            resolve(count)
        })
    },getSubCategory: (subCategory) => {
        return new Promise(async (resolve, reject) => {
            let subCategory = await db.get().collection(collections.PRODUCT_COLLECTION).find({
                category: subCategory
            }).toArray()
            console.log(subCategory)
            resolve(subCategory)
        })
    }
}