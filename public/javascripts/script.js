function addToCart(proId){
    console.log('arrived in ajax');
    $.ajax({
        url:'/add_to_cart/'+proId,
        method:'get',
        success:(response)=>{
            if(response.status){
                alert('Added to cart')
                let count=$('#cartCount').html()
                count=parseInt(count)+1
                $('#cartCount').html(count)
            }            
        }
    })
}