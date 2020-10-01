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
    class Worker{
        constructor(workerData) {
            this.storage = workerData || {
                index: false,
                isMaster: false
            };
            this.slavedexes = [];

            this.redisSudscrable(this);



            parentPort.on("message", (msg, data) => {

                //  console.log(msg)
                switch(msg.event){
                    case "WM_setMaster":


                        storage.isMaster = false;

                        //  console.log("master", storage)

                        publisher.publish("worker", JSON.stringify({event: "RM_setMaster",index: msg.index, count:msg.count}));



                        break;



                    case "WM_removeWorker":

                        storage.isMaster = false;






                        break;

                    case "WM_addWorker":

                        publisher.publish("worker", JSON.stringify({event: "RM_addWorker", count:msg.count}));
                        break;

                    case "WM_getSlaves":


                        getSlaveIndexes(msg);
                        break;

                }


            })


        }
        setMaster() {
            storage.isMaster = true;
        }
        redisSudscrable(that){
            subscriber.subscribe("worker");
            subscriber.on("message", function(channel, msg) {
                msg = JSON.parse(msg)

                switch (msg.event){
                    case "RM_getSlaveIndex":



                        if(!storage.isMaster){



                            publisher.publish("worker", JSON.stringify({event : "RM_addIndex", index: storage.index, count: msg.count}));
                        }
                        else{

                            slaves = [];
                        }
                        break;
                    case "RM_addIndex":
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

                    case "RM_setMaster":


                        // console.log(storage)

                        if(storage.index == msg.index){
                            console.log(this)

                            storage.workersCount = msg.count;

                            that.setMaster();
                            getSlaveIndexes();

                        }
                        else{
                            storage.isMaster =false;
                        }

                        break;

                    case "RM_addWorker":



                        if(storage.isMaster){



                            slaves = [];

                            storage.workersCount = msg.count;

                            parentPort.postMessage({index: storage.index, isMaster: storage.isMaster, } );

                            getSlaveIndexes();

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
        }
    }
    new Worker();
    console.log('create worker')
}




// слушатели редис мастера


// storage.index = workerData.index;
//storage.isMaster =  workerData.isMaster;

function random (min, max){
    return Math.floor(Math.random() * Math.floor(max));
}




// по событиям сокета

function getSlaveIndexes(msg){


    msg= msg || {};

    publisher.publish("worker", JSON.stringify({event : "RM_getSlaveIndex", index: storage.index, count:msg.count}));
}

// из главного потока:

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