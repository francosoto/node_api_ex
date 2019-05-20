# AddUser:
curl -X POST --header "Content-Type: application/json;charset=UTF-8" --data "{username:'usuario1',password:'password',email:'email@email.com'}" http://127.0.0.1:3001/users

# deactivate
curl -X DELETE --header "Content-Type: application/json;charset=UTF-8" http://127.0.0.1:3001/users?username=usuario1

# activate
curl -X PUT --header "Content-Type: application/json;charset=UTF-8" http://127.0.0.1:3001/users?username=usuario1

# get
curl --header "Content-Type: application/json;charset=UTF-8" http://127.0.0.1:3001/users?username=usuario1
