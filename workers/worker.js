const {  parentPort,  workerData, isMainThread} = require("worker_threads");
console.log("worker: ", workerData.index, "start create")
let listSlaves;
const config = require("../config");
const redis = require("redis");
let subscriber = redis.createClient();
let publisher  = redis.createClient();
let slaves = [];
newCount  =0;
let storage = {
    index: false,
    isMaster: false
};

if(!isMainThread) {
    storage = workerData
}
console.log('create worker')
subscriber.subscribe("worker");

subscriber.on("message", function(channel, msg) {
    msg = JSON.parse(msg)




  //  console.log("msg",msg)




    switch (msg.event){
        case "getIndex":



            if(!storage.isMaster){



                publisher.publish("worker", JSON.stringify({event : "setIndex", index: storage.index, count: msg.count}));
            }
            else{

                slaves = [];
            }
            break;

        case "setIndex":
            if(storage.isMaster){



                if(msg.count) {
                    storage.workersCount = msg.count;
                }



                if(slaves.indexOf(msg.index) == -1){


                    slaves.push(msg.index)

                }
                if(slaves.length == storage.workersCount-1){
                    console.log(slaves)
                    console.log(storage)
                    sendNumsToSlaves()

                    parentPort.postMessage({index: storage.index, isMaster: storage.isMaster, } );
                }

            }


            break;

        case "setMaster":


           // console.log(storage)

            if(storage.index == msg.index){

                storage.workersCount = msg.count;
                setMaster();
                getSlaves();

            }
            else{
             storage.isMaster =false;
        }

            break;

        case "addWorker":



            if(storage.isMaster){



                slaves = [];

                storage.workersCount = msg.count;

                parentPort.postMessage({index: storage.index, isMaster: storage.isMaster, } );

                getSlaves();

            }
            break;
        case "setNumber":
            if(msg.index == storage.index){
               // console.log("slave :",  msg.index, "get num:", msg.num)

                parentPort.postMessage({index: storage.index, isMaster: storage.isMaster, } );
            }
            break;




    }






});

// слушатели редис мастера


// storage.index = workerData.index;
//storage.isMaster =  workerData.isMaster;

function random (min, max){
    return Math.floor(Math.random() * Math.floor(max));
}




// по событиям сокета
function setMaster(){


    storage.isMaster = true;
}
function getSlaves(msg){


    msg= msg || {};

    publisher.publish("worker", JSON.stringify({event : "getIndex", index: storage.index, count:msg.count}));
}

// из главного потока:
parentPort.on("message", (msg, data) => {

  //  console.log(msg)
    switch(msg.event){
        case "WM_setMaster":


            storage.isMaster = false;

          //  console.log("master", storage)

            publisher.publish("worker", JSON.stringify({event: "setMaster",index: msg.index, count:msg.count}));



            break;



        case "WM_removeWorker":

            storage.isMaster = false;



            //  removeWorker(msg.index);


            break;

        case "WM_addWorker":
        //    console.log(storage)
            publisher.publish("worker", JSON.stringify({event: "addWorker", count:msg.count}));



            break;

        case "WM_getSlaves":


            getSlaves(msg);
            break;

    }
})
function removeWorker(index){



    publisher.publish("worker", JSON.stringify({event: "removeWorker",index: index}));

}



function sendNumsToSlaves(){


    for(let index of slaves){
        let num = parseInt(random(1, 100));
      //  console.log("send", num  , "to slave" ,index) ;


        publisher.publish("worker", JSON.stringify({event: "setNumber",index, num}));

    }
}

/*
Тест проверки события от воркера в основной поток
let redisTest = require("redis"), subscriberTest =  redisTest.createClient(), publisherTest  =  redisTest.createClient();
subscriberTest.subscribe("test1");
subscriberTest.on("message", function(channel, message) {
    console.log("worker get messge: ", storage.index, message)
});
publisherTest.publish("test1", "worker")
 */



//console.log("worker: ", storage.index, " created");

publisher.publish("controller", "readyWorker");


// событие мастеру что созданы
//parentPort.postMessage("created");