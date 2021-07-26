const checkDateIfExpired = (param) => {
    let expDate = new Date(param);
    let date = new Date();

    console.log(expDate);

    if(expDate < date){
        return true;
    } else{
        return false;
    }
}

module.exports = checkDateIfExpired;