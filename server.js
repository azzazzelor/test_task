// initialize DB
const sqlite3 = require("sqlite3").verbose();
let dbSchema = `CREATE TABLE IF NOT EXISTS Users (
    user_id integer PRIMARY KEY,
    passw text NOT NULL,
    email text NOT NULL 
);`

const DB_PATH = ':memory:';
const DB = new sqlite3.Database(DB_PATH, function(error){
    if (error) {
        console.log(error)
    }
});

DB.exec(dbSchema, function(error){
    if (error) {
        console.log(error)
    }
});
// registerUser('1111', 'l.wadik@dd.net')


// // helper function for register user in db
// function registerUser ( passw, email) {
//     let sql = "INSERT INTO Users ( passw, email) "
//     sql += "VALUES (?, ?) "

//     DB.run(sql, [passw, email], function(error) {
//         if (error) {
//             console.log(error)
//         }
//     });
// };
// end of DB initialize 

const zmq = require("zeromq/v5-compat");
let pubPort = process.argv[2];
let subPort = process.argv[3];

let sockPublisher = zmq.socket("pub");
let sockSubscriber = zmq.socket("sub");
 
sockPublisher.bind(`tcp://127.0.0.1:${pubPort}`);
sockSubscriber.connect(`tcp://127.0.0.1:${subPort}`);

sockSubscriber.subscribe("api_in");
sockSubscriber.on("message", (arg, obj)=>{
    let userObj = JSON.parse(obj);

    if(userObj.type === 'login') {
        findUserByEmail_sendRes(userObj)
    }

})

function findUserByEmail_sendRes({email, passw, msg_id}) {
    var sql = 'SELECT * ' 
    sql += 'FROM Users '
    sql += 'WHERE email = ? '
    
    DB.get(sql, email, function(err,row) {
        if (err) {
            console.log(err)
        }
        
        if(!row){
            let errorObj = {
                msg_id: msg_id,
                status: "error",
                error:  "No data in db"
            }
            let errorMessage = JSON.stringify(errorObj);
            sockPublisher.send(["api_out", errorMessage ])
        }else{
            if(row.passw === passw ) {
                let resObject = {
                        msg_id:  msg_id,  
                        user_id: row.user_id,   
                        status:  "ok"
                    }
                let jsonResObl = JSON.stringify(resObject)  
                sockPublisher.send(["api_out", jsonResObl ])
            }else{
                let errorObj = {
                    msg_id: msg_id,
                    status: "error",
                    error:  "Wrong password"
                }
                let errorMessage = JSON.stringify(errorObj);
                sockPublisher.send(["api_out", errorMessage ])
            }
        }
        
    });
}

