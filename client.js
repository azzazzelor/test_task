const zmq = require("zeromq/v5-compat");
const inquirer = require('inquirer');

const DB_PATH = ":memory:";

let pubPort = process.argv[2];
let subPort = process.argv[3];

let sockPublisher = zmq.socket("pub");
let sockSubscriber = zmq.socket("sub");
 
sockPublisher.bind(`tcp://127.0.0.1:${pubPort}`);
sockSubscriber.connect(`tcp://127.0.0.1:${subPort}`);

sockSubscriber.subscribe("api_out");

sockSubscriber.on("message", (arg, obj)=>{
    let newResobj = JSON.parse(obj)
    if(newResobj.status === 'error'){
        console.log('error')
    }else{
        console.log('ok')
    }
})

let questions = [
    {
        message: "Enter your email?",
        type: "input",
        name: "email"
    },
    { 
        message: "Enter your password?",
        type: "input",
        name: "passw"
    }
];

inquirer
    .prompt(questions)
    .then(answers => {
    answers.type = "login";
    answers.msg_id = Math.random().toString(36).substring(7);
        let answerJSON = JSON.stringify(answers);
        sockPublisher.send(["api_in", answerJSON])
    })
    .catch(err =>{
        console.log(err)
    })
