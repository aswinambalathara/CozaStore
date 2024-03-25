const { ObjectId } = require("mongodb");
const productSchema = require("../models/productModel");

module.exports.filterHelp = async (userTypes,colors,sort,price,category) => {
    let sortFilter;
    let priceFilter;
    if(sort === 'ascendingOrder'){
      sortFilter = { productName : 1}
    }else if(sort === 'descendingOrder'){
      sortFilter = { productName : -1}
    }else if(sort === 'newArrivals'){
      sortFilter = { createdAt : -1}
    }else if(sort ==='lowToHigh'){
      sortFilter = { price : 1}
    }else if(sort === 'highToLow'){
      sortFilter = { price : -1}
    }
    
    if(price === 'allPrices'){
      priceFilter = {$gt : 0}
    }else if (price === 'priceBelow500'){
      priceFilter = {$gt:0 , $lte: 500}
    }else if(price === 'priceRange500_2000'){
      priceFilter = {$gt:500 , $lte: 2000}
    }else if(price === 'priceRange2000_5000'){
      priceFilter = {$gt:2000 , $lte: 5000}
    }else if(price === 'priceAbove5000'){
      priceFilter = {$gt : 5000}
    }

  const products = await productSchema.aggregate([
    {$lookup:{
        from : "categories",
        localField : "category",
        foreignField : "_id",
        as : "category"
    }},
    {
      $match: {
        $and: [
            {"category.categoryName":category? category:{$exists:true}},
            {price: priceFilter}
        ],
        $or: [ 
            {userType : {$in : userTypes}},
            {color : {$in : colors }},
        ],
      },
    },
    {$sort:sortFilter}
  ]);

  return products;
};

module.exports.defaultFilterHelp = async (sort,price,category) =>{

    let sortFilter;
    let priceFilter;
    if(sort === 'ascendingOrder'){
      sortFilter = { productName : 1}
    }else if(sort === 'descendingOrder'){
      sortFilter = { productName : -1} 
    }else if(sort === 'newArrivals'){
      sortFilter = { createdAt : -1}
    }else if(sort ==='lowToHigh'){
      sortFilter = { price : 1}
    }else if(sort === 'highToLow'){
      sortFilter = { price : -1}
    }
    
    if(price === 'allPrices'){
      priceFilter = {$gt : 0}
    }else if (price === 'priceBelow500'){
      priceFilter = {$gt:0 , $lte: 500}
    }else if(price === 'priceRange500_2000'){
      priceFilter = {$gt:500 , $lte: 2000}
    }else if(price === 'priceRange2000_5000'){
      priceFilter = {$gt:2000 , $lte: 5000}
    }else if(price === 'priceAbove5000'){
      priceFilter = {$gt : 5000}
    } 

    const products = await productSchema.aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $match: {
          $and: [
            {"category.categoryName":category? category:{$exists:true}},
            {price: priceFilter}
        ],
        },
      },
      { $sort: sortFilter },
    ]);

      return products;
}
