# SERVER BACK END DOCUMENTATION

## Registering new user

To trigger registering user yo should use `/api/user/register` path with the method `POST`. The following code will send a request to the server and will try to create new user in the database. Users registered this way will be regular users.

```javascript
const result = await fetch(url + '/api/user/register', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        name: "Jan Kowalski",
        email: "j.kowalski@yahoo.com",
        password: "ExamplePass123#@!",
        passwordConfirm: "ExamplePass123#@!" // This property is optional
    })
})
.then(response => response.json())
.then(result => console.log(result))
```

The `result` variable will contain response data as following

```JSON
{
    "success": true,
    "data": {
        "id": 45,
        "name": "Jan Kowalski",
        "email": "j.kowalski@yahoo.com",
        "userTypeId": 2
    }
}
```

## Logging to app

To trigger logging user you should use `/api/user/login` path with the method `POST`. The following code will send request to the server and will try to log in to the system.

```javascript
const result = await fetch(url + '/api/user/login', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        email: "j.kowalski@yahoo.com",
        password: "ExamplePass123#@!",
    })
})
.then(response => response.json())
.then(result => console.log(result))
```
As the response you will receive the web token which you must store locally on the device. You will need that token to operate with further app functions. Result would be following:

```JSON
    {
    "success": true,
    "message": "Logged in successfully",
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDUsImVtYWlsIjoiai5rb3dhbHNraUB5YWhvby5jb20iLCJ1c2VyVHlwZSI6MiwiaWF0IjoxNjI2MDE4ODM0fQ.PUrQUR6SgSWhRnEQ4hPSGfBK1LNpabqP_ZlWHMnMFo4"
    }
}
```

## GARDENS SECTION

### Displaying all gardens

That function is available for admins only. Using the path `/api/garden/all` with `GET` method you are able to fetch all created gardens. That path contains additional filtering parameters like:
* `name` - displays all gardens containing garden's name provided in this variable
* `userName` - displays all gardens containing user's name provided in this variable
* `userEmail` - displays all gardens containing user's email provided in this variable

`name` and `userName` properties can be combined

Example of code:
```javascript
const result = await fetch(url + '/api/garden/all?name=The Garden&userName=Kowalski', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'auth-token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDMsImVtYWlsIjoibHVrYXN6LmxvcGF0YTk2QGdtYWlsLmNvbSIsInVZXJUeXBlIjoxLCJpYXQiOjE2MjYwMTIxMzF9.EBqAfoPk4u7-s-aZXaSoPGzlCPsiqgzrRx4VxSkGh28'
                },
            })
            .then(response => response.json())
            .then(result => console.log(result))
            .catch(err => console.log(err))
```
may return:
```json
[
    {
        "id": 8,
        "name": "The Garden",
        "user": {
            "userId": 45,
            "userName": "Jan Kowalski",
            "userEmail": "j.kowalski@yahoo.com",
            "userType": {
                "userTypeId": 2,
                "userTypeName": "User",
                "userTypeDesc": "Normal user"
            }
        }
    },
    {
        "id": 9,
        "name": "The Garden 2",
        "user": {
            "userId": 45,
            "userName": "Jan Kowalski",
            "userEmail": "j.kowalski@yahoo.com",
            "userType": {
                "userTypeId": 2,
                "userTypeName": "User",
                "userTypeDesc": "Normal user"
            }
        }
    }
]
```


### Creating new garden

To create new garden of logged user you need to use `/api/garden/create` path with POST method and also header `auth-token` for user's authentication. Following code will create garden attached to logged user based on the web `token`:

```javascript
const result = await fetch(url + '/api/garden/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'auth-token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDUsImVtYWlsIjoiai5rb3dhbHNraUB5YWhvby5jb20iLCJ1c2VyVHlwZSI6MiwiaWF0IjoxNjI2MDE4ODM0fQ.PUrQUR6SgSWhRnEQ4hPSGfBK1LNpabqP_ZlWHMnMFo4'
                },
                body: JSON.stringify({
                    name: "Garden number 1"
                })
            })
            .then(response => response.json())
            .then(result => console.log(result))
```
The code may return following results:
```JSON
{
    "succes": true,
    "data": {
        "id": 7,
        "name": "Garden number 1",
        "user_id": 45
    }
}
```

### Updating Garden

To update garden you need to use path of `/api/garden/edit/:id` where `:id` is garden's id we want to update. To do that you have to use `PUT` request type while fetching a request. You need to use `auth-token` header to make that request. Example of code:

```javascript
const result = await fetch(url + '/api/garden/edit/10', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'auth-token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDUsImVtYWlsIjoiai5rb3dhbHNraUB5YWhvby5jb20iLCJ1c2VyVHlwZSI6MiwiaWF0IjoxNjI2MDM1OTU5fQ.2of-darT2Tkpfv872pudY9qNfTgTiMq_k1iB1mnoWQk'
                },
                body: JSON.stringify({
                    name: "Updated Garden"
                })
            })
            .then(response => response.json())
            .then(result => console.log(result))
```
May return: 
```json
{
    "success": true,
    "message": "Updated successfully",
    "data": {
        "id": 10,
        "name": "Updated Garden",
        "user_id": 45
    },
    "dataBefore": {
        "id": 10,
        "name": "My Garden",
        "user_id": 45
    }
}
```

### Deleting garden

To delete garden you need to use path of `/api/garden/delete/:id` where `:id` is garden's id we want to deelte. To do that you have to use `DELETE` request type while fetching a request. You need to use `auth-token` header to make that request. Example of code:

```javascript
const result = await fetch(url + '/api/garden/delete/10', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'auth-token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDUsImVtYWlsIjoiai5rb3dhbHNraUB5YWhvby5jb20iLCJ1c2VyVHlwZSI6MiwiaWF0IjoxNjI2MDM1OTU5fQ.2of-darT2Tkpfv872pudY9qNfTgTiMq_k1iB1mnoWQk'
                }
            })
            .then(response => response.json())
            .then(result => console.log(result))
```
May return: 
```json
{
    "success": true,
    "message": "Garden has been deleted successfully"
}
```

## Category section

Functions in this section are available for admins only. Remember that you have to include header called `auth-token` to every request that you make. You are familiar with making requests now. So the only thing you need to now are paths and request type:

* `/api/category/create` - `POST` - create new category
* `/api/category/edit/:id` - `POST` - edit category with `id`
* `/api/category/delete/:id` - `POST` - delete category with `id`
* `/api/category/all` - `POST` - display all categories - can be filtered by query param called `name`