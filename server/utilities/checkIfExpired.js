const checkDateIfExpired = (param) => {
    let expDate = new Date(param);
    let date = new Date();

    if(expDate < date){
        return true;
    } else{
        return false;
    }
}

module.exports = checkDateIfExpired;