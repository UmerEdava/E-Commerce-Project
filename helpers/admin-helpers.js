var db = require('../config/connection');
var collection = require('../config/collections');
var objectId = require('mongodb').ObjectID;

module.exports={
    doLogin:(adminData)=>{
        let loginStatus=false
        let response={}
    
        return new Promise(async(resolve,reject)=>{
            let adminDefined={email:'umeredava@gmail.com',password:'123'}
            if(adminData.email==adminDefined.email&&adminData.password==adminDefined.password){
                response.admin=adminDefined
                response.status=true
                resolve(response)
            }else{
                resolve({status:false})
            }
        })
    }
}
