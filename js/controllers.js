/*jshint esversion: 6 */
var verson = "1.3.5";
// Firebase Key
var config = {
    apiKey: "AIzaSyDOFKfb0GTeIYj-lvq8NRn3S3RrJQbZM_I",
    authDomain: "co-writing-test.firebaseapp.com",
    databaseURL: "https://co-writing-test.firebaseio.com",
    projectId: "co-writing-test",
    storageBucket: "co-writing-test.appspot.com",
    messagingSenderId: "894137377703",
    appId: "1:894137377703:web:d5584a32c2b21322e98c82"
};
firebase.initializeApp(config);
var perf = firebase.performance();
// 解密fun
function pasw(code) {
    var key = ['V','T','C','J','G','A','Y','K','F','P'];
    // 驗證 - 是否七碼
    if (code.length!=7) {
        return 'ER'
    }
    // 驗證 - 安全碼是否正確
    else if (key.indexOf(code.substr(0,1))+key.indexOf(code.substr(6,1))!=9 || key.indexOf(code.substr(3,1))+key.indexOf(code.substr(4,1))!=9){
        return 'ER'
    }
    else {
        var a = ''+key.indexOf(code.substr(1,1))+key.indexOf(code.substr(2,1))+key.indexOf(code.substr(5,1));
        return parseInt(a)
    }
}
// 加密fun
function paswLock(code) {
    code = code.toString();
    var key = ['V','T','C','J','G','A','Y','K','F','P'];
    // 產生兩組安全碼
    var a = Math.floor(Math.random()*9)+0;
    var b = 9-a;
    var c = Math.floor(Math.random()*9)+0;
    var d = 9-c;
    // 判斷數字
    var e,f,g;
    if (code<10) {
        e = 0;
        f = 0
        g = code.substr(0,1);
    } else if (code<100) {
        e = 0;
        f = code.substr(0,1);
        g = code.substr(1,1);
    } else {
        e = code.substr(0,1);
        f = code.substr(1,1);
        g = code.substr(2,1);
    }
    return ''+key[a]+key[e]+key[f]+key[c]+key[d]+key[g]+key[b]
}
angular.module('app.controllers', ['ngImgCrop','angular-bind-html-compile'])
// ----------------------------------------登入頁面----------------------------------------
.controller('loginCtrl', ['$scope', '$stateParams', '$ionicPopup', '$state', '$ionicLoading',
function ($scope, $stateParams, $ionicPopup, $state, $ionicLoading) {
    // 登入
    $scope.loginSmtBtn = function() {
        $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner><p>登入中...</p>'});
        firebase.auth().signInWithEmailAndPassword(accountL.value+"@nkust.edu.tw", pwdL.value).then(function(){
            console.log("登入成功");
            var StuID = accountL.value.toUpperCase();

            accountL.value="";
            pwdL.value="";
            $ionicLoading.hide();
            // 判斷教師版
            if (StuID=="ROOT") {
                $state.go("rootmenu.root_pbl",{StuID:StuID});
            } else {
                $state.go("choose_class",{StuID:StuID});
            }
        }).catch(function(error) {
            var errorCode = error.code;
            var errorMessage = error.message;
            console.log("登入失敗：",errorMessage);
            $ionicLoading.hide();
            switch(errorCode){
                case 'auth/user-not-found':
                    var alertPopup = $ionicPopup.alert({
                        title: '登入失敗',
                        template: '查無此帳號。'
                    });
                        alertPopup.then(function(res) {
                        accountL.value="";
                        pwdL.value="";
                    });
                    break;
                case 'auth/invalid-email':
                    var alertPopup = $ionicPopup.alert({
                        title: '登入失敗',
                        template: '格式有誤。'
                    });
                        alertPopup.then(function(res) {
                        accountL.value="";
                    });
                    break;
                case 'auth/wrong-password':
                    var alertPopup = $ionicPopup.alert({
                        title: '登入失敗',
                        template: '密碼錯誤。'
                    });
                        alertPopup.then(function(res) {
                        pwdL.value="";
                    });
                    break;
            }
        });
    };

    // 忘記密碼
    $scope.forgetBtn = function() {
        $scope.data = {};
        $ionicPopup.show({
            title: '忘記密碼',
            subTitle: '請輸入學號，重設信件將寄送至nkust信箱',
            template: 
                '<input type="text" ng-model="data.forgetInput" placeholder="ex:C107193000">',
            scope: $scope,
            buttons: [{
                text: '取消',
                type: 'button-default',
                onTap: function(e) {
                    console.log('選擇取消');
                }
            }, {
                text: '送出',
                type: 'button-chanry1',
                onTap: function(e) {
                    console.log('選擇送出');
                    firebase.auth().sendPasswordResetEmail($scope.data.forgetInput+"@nkust.edu.tw").then(function() {
                        console.log("寄送密碼重置信成功");
                        var alertPopup = $ionicPopup.alert({
                            title: '成功',
                            template: '寄送密碼重置信成功，請至 '+$scope.data.forgetInput+"@nkust.edu.tw"+" 收信"
                        });
                    }).catch(function(error) {
                        console.log("寄送密碼重置信失敗");
                        switch(error.code){
                            case 'auth/user-not-found':
                                var alertPopup = $ionicPopup.alert({
                                    title: '寄信失敗',
                                    template: '查無此帳號。'
                                });
                                break;
                        }
                    });
                }
            }]
        });
    };

}])

// ----------------------------------------選擇課程頁面----------------------------------------
.controller('choose_classCtrl', ['$scope', '$stateParams', '$state', '$ionicLoading', '$timeout',
function ($scope, $stateParams, $state, $ionicLoading, $timeout) {
    // 判斷是否空降or按到上一頁
    if ($stateParams.StuID!=null) {
        $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner><p>載入課程中...</p>'});
        var a = [];
        var db = firebase.firestore();
        db.collection("課程").where("ClassStu", "array-contains", $stateParams.StuID)
        .get().then(function (querySnapshot) {
            querySnapshot.forEach(function (doc) {
                a.push(doc.data());
                $scope.items = a;
                $scope.$apply(); //重新監聽view
            });
        });

        // 定時重整
        // $scope.onTimeout = function(){
        //     $state.go($state.current, {}, {reload: true}); //重新載入view
        //     mytimeout = $timeout($scope.onTimeout,2000);
        //     console.log("重整");
        // };
        // var mytimeout = $timeout($scope.onTimeout,2000);

        $ionicLoading.hide();

        // 按下課程
        $scope.choose_class = function(ClassID,ClassName) {
            // 系統紀錄 - 登入紀錄
            db.collection("系統記錄").doc(ClassID).collection("登入紀錄")
            .add({
                StuID: $stateParams.StuID,
                time: new Date()
            })
            .then(function(data) {
                console.log("系統紀錄 - 登入紀錄成功");
            })
            .catch(function(error) {
                console.error("系統紀錄 - 登入紀錄失敗：", error);
            });
            // $timeout.cancel(mytimeout);//停止計時器
            localStorage.setItem("ClassID",ClassID);
            localStorage.setItem("ClassName",ClassName);
            $state.go("menu.pbl");
        };
    } else {
        console.log("錯誤方式");
        $state.go("login");
        // window.location.reload();
    }
}])

// ----------------------------------------留言版頁面----------------------------------------
.controller('chatroomCtrl', ['$scope', '$stateParams', '$state', '$ionicLoading', '$ionicScrollDelegate',
function ($scope, $stateParams, $state, $ionicLoading, $ionicScrollDelegate) {
    var db = firebase.firestore();
    // 驗證登入
    firebase.auth().onAuthStateChanged((user) => {
        if (user) { //登入成功，取得使用者
            console.log("已登入狀態");
            var StuID = user.email.substring(0,user.email.indexOf("@")).toUpperCase();
            var ClassID = localStorage.getItem("ClassID");
            var StuName = localStorage.getItem("StuName");

            $scope.messages = [];
            // 監聽 - 留言版內容
            db.collection("留言版").doc(ClassID).collection("messages").orderBy("time","asc")
            .onSnapshot(function(querySnapshot) {
                querySnapshot.docChanges().forEach(function(change) {
                    if (change.type === "added") {
                        // 查詢圖片檔名
                        db.collection("帳號").doc(change.doc.data().StuID)
                        .get().then(function(results) {
                            var storage = firebase.storage();
                            var storageRef = storage.ref();
                            storageRef.child('members/'+results.data().Img).getDownloadURL().then(function(url) {
                                // 放入留言版內容
                                $scope.messages.push({
                                    messageName:change.doc.data().StuID + ' ' + change.doc.data().StuName,
                                    messageImg:url,
                                    messageContent:change.doc.data().content,
                                    time:change.doc.data().time
                                });

                                $scope.$apply(); //重新監聽view
                                $ionicScrollDelegate.scrollBottom(); //滑到最下面
                                $ionicScrollDelegate.resize(); //重新取得範圍
                            })
                        }).catch(function(error) { 
                            console.log("查詢圖片檔名發生錯誤：", error); 
                        });
                    }
                    if (change.type === "modified") {
                        console.log("修改: ", change.doc.data());
                    }
                    if (change.type === "removed") {
                        console.log("刪除: ", change.doc.data());
                    }
                });
            });

            // 新增留言
            $scope.addMessage = function() {
                $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner><p>新增中...</p>'});
                if ($scope.inputMessage!=undefined && $scope.inputMessage!="") {
                    db.collection("留言版").doc(ClassID).collection("messages")
                    .add({
                        StuID: StuID,
                        StuName: StuName,
                        content: $scope.inputMessage,
                        time: new Date()
                    })
                    .then(function(data) {
                        console.log("新增留言成功");
                    })
                    .catch(function(error) {
                        console.error("新增留言失敗：", error);
                    });
                    $scope.inputMessage = "";
                }
                $ionicLoading.hide();
            };


        }else{
            console.log("尚未登入");
            $state.go("login");
            // window.location.reload();
        }
    });
}])

// ----------------------------------------匿名留言版頁面----------------------------------------
.controller('chatroom2Ctrl', ['$scope', '$stateParams', '$state', '$ionicLoading', '$ionicScrollDelegate',
function ($scope, $stateParams, $state, $ionicLoading, $ionicScrollDelegate) {
    var db = firebase.firestore();
    // 驗證登入
    firebase.auth().onAuthStateChanged((user) => {
        if (user) { //登入成功，取得使用者
            console.log("已登入狀態");
            var StuID = user.email.substring(0,user.email.indexOf("@")).toUpperCase();
            var ClassID = localStorage.getItem("ClassID");
            var StuName = localStorage.getItem("StuName");

            $scope.messages = [];
            // 監聽 - 留言版內容
            db.collection("匿名留言版").doc(ClassID).collection("messages").orderBy("time","asc")
            .onSnapshot(function(querySnapshot) {
                querySnapshot.docChanges().forEach(function(change) {
                    if (change.type === "added") {
                        // 查詢圖片檔名
                        db.collection("帳號").doc(change.doc.data().StuID)
                        .get().then(function(results) {
                            var storage = firebase.storage();
                            var storageRef = storage.ref();
                            storageRef.child('members/'+results.data().Img).getDownloadURL().then(function(url) {
                                var messageName = "匿名";
                                var messageImg = "https://firebasestorage.googleapis.com/v0/b/co-writing-test.appspot.com/o/members%2Fdefault?alt=media&token=e511b185-cd79-47e2-b501-e026fd8da387";
                                // 判斷是否是老師
                                if (change.doc.data().StuID=="ROOT") {
                                    messageName = change.doc.data().StuID + ' ' + change.doc.data().StuName;
                                    messageImg = url;
                                }
                                // 放入留言版內容
                                $scope.messages.push({
                                    messageName:messageName,
                                    messageImg:messageImg,
                                    messageContent:change.doc.data().content,
                                    time:change.doc.data().time
                                });

                                $scope.$apply(); //重新監聽view
                                $ionicScrollDelegate.scrollBottom(); //滑到最下面
                                $ionicScrollDelegate.resize(); //重新取得範圍
                            });
                        }).catch(function(error) { 
                            console.log("查詢圖片檔名發生錯誤：", error); 
                        });
                    }
                    if (change.type === "modified") {
                        console.log("修改: ", change.doc.data());
                    }
                    if (change.type === "removed") {
                        console.log("刪除: ", change.doc.data());
                    }
                });
            });

            // 新增留言
            $scope.addMessage = function() {
                $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner><p>新增中...</p>'});
                if ($scope.inputMessage!=undefined && $scope.inputMessage!="") {
                    db.collection("匿名留言版").doc(ClassID).collection("messages")
                    .add({
                        StuID: StuID,
                        StuName: StuName,
                        content: $scope.inputMessage,
                        time: new Date()
                    })
                    .then(function(data) {
                        console.log("新增留言成功");
                    })
                    .catch(function(error) {
                        console.error("新增留言失敗：", error);
                    });
                    $scope.inputMessage = "";
                }
                $ionicLoading.hide();
            };


        }else{
            console.log("尚未登入");
            $state.go("login");
            // window.location.reload();
        }
    });
}])

// ----------------------------------------主頁面----------------------------------------
.controller('pblCtrl', ['$scope', '$stateParams', '$state', '$ionicPopup', '$ionicLoading', '$sce',
function ($scope, $stateParams, $state, $ionicPopup, $ionicLoading, $sce) {
    var db = firebase.firestore();
    // 驗證登入
    firebase.auth().onAuthStateChanged((user) => {
        if (user) { //登入成功，取得使用者
            console.log("已登入狀態");
            var StuID = user.email.substring(0,user.email.indexOf("@")).toUpperCase();
            var ClassID = localStorage.getItem("ClassID");
          
            // 移轉
            // db.collection("帳號")
            // .get().then(function(results) {
            //     if(!results.empty) {
            //         results.forEach(function (doc) {
            //             var Stu = doc.id;
            //             db.collection("帳號").doc(Stu).collection("點數歷程記錄")
            //             .get().then(function(results) {
            //                 if(!results.empty) {
            //                     results.forEach(function (doc) {
            //                         console.log(doc.data());
            //                         db.collection("點數").doc(ClassID).collection(Stu).doc("點數歷程記錄").collection("點數歷程記錄").doc(doc.id)
            //                         .set({
            //                             check: doc.data().check,
            //                             content: doc.data().content,
            //                             point: doc.data().point,
            //                             time: doc.data().time
            //                         })
            //                         .then(function(data) {
            //                             console.log(Stu,"!!!!!!!!!成功");
            //                         })
            //                         .catch(function(error) {
            //                             console.error(Stu,"!!!!!!!!!!失敗：", error);
            //                         });
            //                     });
            //                 }
            //             }).catch(function(error) { 
            //                 console.log("取得未分組名單發生錯誤：", error); 
            //             });
            //         });
            //     }
            // }).catch(function(error) { 
            //     console.log("取帳號錯誤：", error); 
            // });
            // 刪除
            // db.collection("帳號")
            // .get().then(function(results) {
            //     if(!results.empty) {
            //         results.forEach(function (doc) {
            //             var Stu = doc.id;
            //             db.collection("帳號").doc(Stu).collection("點數歷程記錄")
            //             .get().then(function(results) {
            //                 if(!results.empty) {
            //                     results.forEach(function (doc) {
            //                         db.collection("帳號").doc(Stu).collection("點數歷程記錄").doc(doc.id)
            //                         .delete()
            //                         .then(function(data) {
            //                             console.log("刪除成功");
            //                         })
            //                         .catch(function(error) {
            //                             console.error("刪除失敗：", error);
            //                         });
            //                     });
            //                 }
            //             }).catch(function(error) { 
            //                 console.log("刪除發生錯誤：", error); 
            //             });
            //         });
            //     }
            // }).catch(function(error) { 
            //     console.log("取帳號錯誤：", error); 
            // });
            

            // 監聽 - 公告內容
            db.collection("課程").doc(ClassID)
            .onSnapshot(function(doc) {
                $scope.items = [{
                    ClassName:doc.data().ClassName,
                    ClassContent:$sce.trustAsHtml(doc.data().ClassContent),
                    lock:doc.data().lock
                }];
                $scope.$apply(); //重新監聽view
                // 如果課程鎖定 跳回登入頁面
                if (doc.data().lock==true) {
                    console.log("課程鎖定");
                    $state.go("login");
                    // window.location.reload();
                }
            },function(error) {
                console.error("讀取課程發生錯誤：", error);
                $state.go("login");
                // window.location.reload();
            });

            // 監聽 - 點數排行榜
            db.collection("點數").doc(ClassID)
            .onSnapshot(function(doc) {
                $scope.PointTops = [];
                for (let index = 0; index < doc.data().top.length; index++) {
                    // 查詢帳號資料
                    db.collection("帳號").doc(doc.data().top[index].StuID)
                    .get().then(function(results) {
                        // 獲取大頭照
                        var storage = firebase.storage();
                        storage.ref().child('members/'+results.data().Img).getDownloadURL().then(function(url) {
                            $scope.PointTops.push({
                                Name:results.data().Name,
                                Img:url,
                                Point:doc.data().top[index].Point
                            });
                            $scope.$apply(); //重新監聽view
                        });
                    }).catch(function(error) { 
                        console.log("查詢帳號資料發生錯誤：", error); 
                    });
                }
            },function(error) {
                console.error("讀取點數排行榜發生錯誤：", error);
            });

            // 監聽 - 是否開放分組
            db.collection("課程").doc(ClassID)
            .onSnapshot(function(doc) {
                $scope.LockGroupShow = doc.data().inviteLock;
                $state.go($state.current, {}, {reload: true}); //重新載入view
                console.log("是否開放分組：",$scope.LockGroupShow);
            },function(error) {
                console.error("搜尋是否開放分組發生錯誤：", error);
            });
            
            // 監聽 - 搜尋是否已有小組
            var NowGroupID = "";
            db.collection("分組").doc(ClassID).collection("student").doc(StuID)
            .onSnapshot(function(doc) {
                if (doc.data().grouped === false) {//沒有小組
                    console.log("沒有小組",doc.data());
                    // 顯示創立組員按鈕
                    $scope.leaderGroupShow = false;
                    $scope.addGroupShow = true;
                    $scope.quitGroupShow = false;
                    // 清空組員列表
                    $scope.members = [];
                    // 設定小組ID
                    localStorage.setItem("GroupID","none");
                    $state.go($state.current, {}, {reload: true}); //重新載入view
                } else if (doc.data().grouped === true) {//有小組
                    console.log("有小組",doc.data());
                    // 隱藏創立組員按鈕
                    $scope.addGroupShow = false;
                    // 顯示解散按鈕(檢查是否為組長) 
                    db.collection("分組").doc(ClassID).collection("group").where("leader", "==", StuID)
                    .get().then(function(results) {
                        if(results.empty) {
                            console.log("你非組長"); 
                            $scope.quitGroupShow = true;
                            // 更新小任務進度
                            db.collection("點數").doc(ClassID).collection(StuID).doc("小任務進度").collection("小任務進度").doc("SmallTask8")
                            .set({
                                schedule: 0,
                                time: new Date()
                            })
                            .then(function(data) {
                                console.log("更新小任務進度成功");
                            })
                            .catch(function(error) {
                                console.error("更新小任務進度失敗：", error);
                            });
                            $scope.$apply(); //重新監聽view
                        } else {
                            console.log("你是組長");
                            results.forEach(function (doc) {
                                NowGroupID = doc.id;
                            });
                            $scope.leaderGroupShow = true;
                            // 更新小任務進度
                            db.collection("點數").doc(ClassID).collection(StuID).doc("小任務進度").collection("小任務進度").doc("SmallTask8")
                            .set({
                                schedule: 1,
                                time: new Date()
                            })
                            .then(function(data) {
                                console.log("更新小任務進度成功");
                            })
                            .catch(function(error) {
                                console.error("更新小任務進度失敗：", error);
                            });
                            $scope.$apply(); //重新監聽view
                        }
                    }).catch(function(error) { 
                        console.log("取得未分組名單發生錯誤：", error); 
                    });
                }
            },function(error) {
                console.log("搜尋是否已有小組發生錯誤：", error); 
            });

            // 監聽 - 小組狀態
            db.collection("分組").doc(ClassID).collection("group").where("members", "array-contains", StuID)
            .onSnapshot(function(querySnapshot) {
                querySnapshot.forEach(function (doc) {
                    // 設定小組ID
                    localStorage.setItem("GroupID",doc.id);

                    $scope.members = [];
                    console.log("小組狀態",doc.data().members);
                    for (let index = 0; index < doc.data().members.length; index++) {
                        // 查詢帳號資料
                        db.collection("帳號").doc(doc.data().members[index])
                        .get().then(function(results) {
                            // 第一位是組長
                            var leaderTrue = false;
                            if (index == 0) {
                                leaderTrue = true;
                            }
                            // 獲取組員大頭照
                            var storage = firebase.storage();
                            storage.ref().child('members/'+results.data().Img).getDownloadURL().then(function(url) {
                                $scope.members.push({memberID:doc.data().members[index],memberName:results.data().Name,memberImg:url,leader:leaderTrue});
                                $state.go($state.current, {}, {reload: true}); //重新載入view
                                console.log($scope.members);
                            })
                        }).catch(function(error) { 
                            console.log("查詢帳號資料發生錯誤：", error); 
                        });
                    }
                });
            },function(error) {
                console.log("檢查小組狀態發生錯誤：", error); 
            }); 

            // 創立小組 or 邀請小組
            $scope.addGroup = function(InviteOrAdd) {
                $scope.Stus = [];
                // 創立小組+邀請小組 - 取得未分組名單
                $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner><p>載入學生中...</p>'});
                db.collection("分組").doc(ClassID).collection("student").where("grouped", "==", false)
                .get().then(function(results) {
                    if(results.empty) {
                        console.log("全班都已分組");
                        $ionicLoading.hide();
                    } else {
                        results.forEach(function (doc) {
                            // 判斷不是自己才加入
                            if (doc.id!=StuID) {
                                var a = results.docs[results.docs.length-1].id;
                                // 查詢姓名
                                db.collection("帳號").doc(doc.id)
                                .get().then(function(results) {
                                    $scope.Stus.push({StuID:doc.id,Name:results.data().Name,Checked:false});
                                    $state.go($state.current, {}, {reload: true}); //重新載入view
                                    // 判斷倒數第一or第二筆 關閉轉圈圈
                                    if (doc.id==a) {
                                        $ionicLoading.hide();
                                    }
                                }).catch(function(error) { 
                                    console.log("查詢姓名發生錯誤：", error); 
                                });
                            }
                        });
                    }
                    console.log("取得未分組名單：", $scope.Stus); 
                    $state.go($state.current, {}, {reload: true}); //重新載入view
                }).catch(function(error) { 
                    console.log("取得未分組名單發生錯誤：", error); 
                });

                $scope.checkStus = [];
                // 取得課程組員上限
                db.collection("課程").doc(ClassID)
                .get().then(function(maxData) {
                    // 創立小組時 把自己算進去
                    var a = 0;
                    if ($scope.members.length==0) {
                        a = 1;
                    } else {
                        a = $scope.members.length;
                    }
                    // 顯示已選數 預載
                    $scope.maxMember = {now:a+$scope.checkStus.length,maxMember:maxData.data().maxMembers};

                    // 創立小組+邀請小組 - 偵測勾選
                    $scope.check = function(Stu) {
                        // 判斷有無在陣列中，無則增加、有則刪除
                        if ($scope.checkStus.indexOf(Stu) === -1) {
                            $scope.checkStus.push(Stu);
                        } else {
                            $scope.checkStus.splice($scope.checkStus.indexOf(Stu),1);
                        }
                        // 判斷是否超過組員上限
                        if (a+$scope.checkStus.length>maxData.data().maxMembers) {
                            console.log("超過上限");
                            // 刪回剛剛加的人
                            $scope.checkStus.splice($scope.checkStus.indexOf(Stu),1);
                            // 不讓此項打勾
                            var index = $.map($scope.Stus, function(item, index) {
                                return item.StuID;
                            }).indexOf(Stu);
                            $scope.Stus[index].Checked = false;
                        }
                        // 顯示已選數
                        $scope.maxMember = {now:a+$scope.checkStus.length,maxMember:maxData.data().maxMembers};
                        console.log($scope.checkStus);
                    };
                }).catch(function(error) { 
                    console.log("查詢組員上限發生錯誤：", error); 
                });

                // 判斷是跳出邀請泡泡還是創立泡泡
                if (InviteOrAdd == "invite") {
                    // 邀請小組 - 跳出泡泡
                    $ionicPopup.show({
                        title: '選擇組員',
                        subTitle: '邀請後需等待對方同意加入才會加入。',
                        template: 
                            '<div ng-model="maxMember">組員人數限制：{{maxMember.now}}/{{maxMember.maxMember}}</div>'+
                            '<div ng-repeat="Stu in Stus">'+
                            '<ion-checkbox ng-model="Stu.Checked" ng-click="check(Stu.StuID)">{{Stu.StuID}} {{Stu.Name}}</ion-checkbox>'+
                            '</div>',
                        scope: $scope,
                        buttons: [{
                            text: '取消',
                            type: 'button-default',
                            onTap: function(e) {
                                console.log('選擇取消');
                            }
                        }, {
                            text: '邀請',
                            type: 'button-chanry1',
                            onTap: function(e) {
                                console.log('選擇邀請');
                                // 判斷是否沒勾
                                if ($scope.checkStus.length == 0) {
                                    console.log("請勾選成員");
                                    var alertPopup = $ionicPopup.alert({
                                        title: '錯誤',
                                        template: '請選擇至少一名成員。'
                                    });
                                } else {
                                    // 邀請小組 - 更新小組邀請名單
                                    db.collection("分組").doc(ClassID).collection("group").doc(NowGroupID)
                                    .update({
                                        inviting: $scope.checkStus
                                    })
                                    .then(function() {
                                        console.log("更新小組邀請名單成功");
                                        // 邀請小組 - 傳送邀請通知
                                        for (let index = 0; index < $scope.checkStus.length; index++) {
                                            db.collection("分組").doc(ClassID).collection("student").doc($scope.checkStus[index]).collection("invite")
                                            .add({
                                                leader: StuID,
                                                groupID: NowGroupID,
                                                respond: false
                                            })
                                            .then(function() {
                                                console.log("傳送邀請通知成功");
                                            })
                                            .catch(function(error) {
                                                console.error("傳送邀請通知失敗：", error);
                                            });
                                        }
                                        
                                    })
                                    .catch(function(error) {
                                        console.error("更新小組邀請名單失敗：", error);
                                    });
                                }
                            }
                        }]
                    });
                } else {
                    // 創立小組 - 跳出泡泡
                    $ionicPopup.show({
                        title: '選擇組員',
                        subTitle: '創立後需等待對方同意加入才會加入。',
                        template: 
                            '<div ng-model="maxMember">組員人數限制：{{maxMember.now}}/{{maxMember.maxMember}}</div>'+
                            '<div ng-repeat="Stu in Stus">'+
                            '<ion-checkbox ng-model="Stu.Checked" ng-click="check(Stu.StuID)">{{Stu.StuID}} {{Stu.Name}}</ion-checkbox>'+
                            '</div>',
                        scope: $scope,
                        buttons: [{
                            text: '取消',
                            type: 'button-default',
                            onTap: function(e) {
                                console.log('選擇取消');
                            }
                        }, {
                            text: '創立',
                            type: 'button-chanry1',
                            onTap: function(e) {
                                console.log('選擇創立');
                                // 判斷是否沒勾
                                if ($scope.checkStus.length == 0) {
                                    console.log("請勾選成員");
                                    var alertPopup = $ionicPopup.alert({
                                        title: '錯誤',
                                        template: '請選擇至少一名成員。'
                                    });
                                } else {
                                    // 創立小組 - 新增小組名單
                                    db.collection("分組").doc(ClassID).collection("group")
                                    .add({
                                        leader: StuID,
                                        members: [StuID],
                                        inviting: $scope.checkStus
                                    })
                                    .then(function(data) {
                                        var groupID = data.id;
                                        console.log("新增小組成功");
                                        // 創立小組 - 更新入組狀態
                                        db.collection("分組").doc(ClassID).collection("student").doc(StuID)
                                        .update({
                                            grouped: true
                                        })
                                        .then(function(data) {
                                            console.log("更新入組狀態成功");
                                            // 創立小組 - 傳送邀請通知
                                            for (let index = 0; index < $scope.checkStus.length; index++) {
                                                db.collection("分組").doc(ClassID).collection("student").doc($scope.checkStus[index]).collection("invite")
                                                .add({
                                                    leader: StuID,
                                                    groupID: groupID,
                                                    respond: false
                                                })
                                                .then(function(data) {
                                                    console.log("傳送邀請通知成功");
                                                })
                                                .catch(function(error) {
                                                    console.error("傳送邀請通知失敗：", error);
                                                });
                                            }
                                        })
                                        .catch(function(error) {
                                            console.error("更新入組狀態失敗：", error);
                                        });
                                    })
                                    .catch(function(error) {
                                        console.error("新增小組失敗：", error);
                                    });
                                }
                            }
                        }]
                    });
                }
            };

            // 解散小組 or 退出小組
            $scope.delGroup = function(DelOrQuit) {
                if (DelOrQuit == "del") {
                    // 解散小組 - 跳出泡泡
                    $ionicPopup.confirm({
                        title: '解散小組',
                        template: '確定要解散小組嗎?',
                        subTitle: '注意：解散後會刪除所有小組資料，包括討論紀錄、上傳作業、分組評分...等。',
                        buttons: [{
                            text: '取消',
                            type: 'button-default',
                            onTap: function(e) {
                                console.log('選擇取消');
                            }
                        }, {
                            text: '解散',
                            type: 'button-chanry1',
                            onTap: function(e) {
                                console.log('選擇解散');

                                // 解散小組 - 刪除小組資料+收回邀請通知
                                db.collection("分組").doc(ClassID).collection("group").where("leader", "==", StuID)
                                .get().then(function(results) {
                                    if(results.empty) {
                                        console.log("解散小組錯誤：非組長"); 
                                    } else {
                                        results.forEach(function (doc) {
                                            // 跑邀請清單(邀請清單內無人則不會跑)
                                            for (let index = 0; index < doc.data().inviting.length; index++) {
                                                db.collection("分組").doc(ClassID).collection("student").doc(doc.data().inviting[index]).collection("invite").where("groupID", "==", doc.id)
                                                .get().then(function(results) {
                                                    if(results.empty) {
                                                        console.log("收回邀請通知錯誤：無須收回之通知"); 
                                                    } else {
                                                        results.forEach(function (doc2) {
                                                            // 收回邀請通知
                                                            db.collection("分組").doc(ClassID).collection("student").doc(doc.data().inviting[index]).collection("invite").doc(doc2.id)
                                                            .update({
                                                                respond: true
                                                            })
                                                            .then(function(data) {
                                                                console.log("收回邀請通知成功");
                                                            })
                                                            .catch(function(error) {
                                                                console.error("收回邀請通知失敗：", error);
                                                            });
                                                        });
                                                    }
                                                }).catch(function(error) { 
                                                    console.log("收回邀請通知錯誤：", error); 
                                                });
                                            }
                                            // 跑組員清單(組員清單內無人則不會跑)
                                            for (let index = 0; index < doc.data().members.length; index++) {
                                                // 更新入組狀態
                                                db.collection("分組").doc(ClassID).collection("student").doc(doc.data().members[index])
                                                .update({
                                                    grouped: false
                                                })
                                                .then(function(data) {
                                                    console.log("更新入組狀態成功");
                                                })
                                                .catch(function(error) {
                                                    console.error("更新入組狀態失敗：", error);
                                                });
                                            }
                                            // 刪除小組資料
                                            db.collection("分組").doc(ClassID).collection("group").doc(doc.id)
                                            .delete()
                                            .then(function(data) {
                                                console.log("解散小組成功");
                                                $scope.members = [];
                                                $state.go($state.current, {}, {reload: true}); //重新載入view
                                            })
                                            .catch(function(error) {
                                                console.error("解散小組失敗：", error);
                                            });
                                            
                                        });
                                    }
                                }).catch(function(error) { 
                                    console.log("解散小組錯誤：", error); 
                                });
                            }
                        }]
                    });
                } else if(DelOrQuit == "quit") {
                    // 退出小組 - 跳出泡泡
                    $ionicPopup.confirm({
                        title: '退出小組',
                        template: '確定要退出小組嗎?',
                        buttons: [{
                            text: '取消',
                            type: 'button-default',
                            onTap: function(e) {
                                console.log('選擇取消');
                            }
                        }, {
                            text: '退出',
                            type: 'button-chanry1',
                            onTap: function(e) {
                                console.log('選擇解散');
                                // 退出小組 - 刪除小組members資料
                                db.collection("分組").doc(ClassID).collection("group").where("members", "array-contains", StuID)
                                .get().then(function (querySnapshot) {
                                    querySnapshot.forEach(function (doc) {
                                        var groupID = doc.id;
                                        var members = doc.data().members;
                                        // 刪除自己
                                        members.splice(members.indexOf(StuID),1);
                                        // 更新members資料
                                        db.collection("分組").doc(ClassID).collection("group").doc(groupID)
                                        .update({
                                            members: members
                                        })
                                        .then(function(data) {
                                            console.log("更新members資料成功");
                                        })
                                        .catch(function(error) {
                                            console.error("更新members資料失敗：", error);
                                        });
                                    });
                                });
                                // 更新入組狀態
                                db.collection("分組").doc(ClassID).collection("student").doc(StuID)
                                .update({
                                    grouped: false
                                })
                                .then(function(data) {
                                    console.log("更新入組狀態成功");
                                })
                                .catch(function(error) {
                                    console.error("更新入組狀態失敗：", error);
                                });
                            }
                        }]
                    });
                }
                
            };

        }else{
            console.log("尚未登入");
            $state.go("login");
            // window.location.reload();
        }
    });
}])

// ----------------------------------------投票系統頁面----------------------------------------
.controller('voteCtrl', ['$scope', '$stateParams', '$ionicPopup', '$state',
function ($scope, $stateParams, $ionicPopup, $state) {
    var db = firebase.firestore();
    // 驗證登入
    firebase.auth().onAuthStateChanged((user) => {
        if (user) { //登入成功，取得使用者
            console.log("已登入狀態");
            var StuID = user.email.substring(0,user.email.indexOf("@")).toUpperCase();
            var ClassID = localStorage.getItem("ClassID");
            var GroupID = localStorage.getItem("GroupID");
            var StuName = localStorage.getItem("StuName");

            // 監聽 - 投票
            $scope.votes = []; // 宣告全域
            db.collection("投票").doc(ClassID).collection(GroupID)
            .onSnapshot(function(results) {
                if (results.empty) {
                    console.log("目前無投票");
                    $scope.votes = [];
                } else {
                    results.docChanges().forEach(function(change) {
                        // 新增
                        if (change.type === "added") {
                            // 初始化選擇
                            var voteChooseN = false;
                            var voteChooseY = false;
                            // 如果自己有在voteN裡面 or在voteY裡面
                            if (change.doc.data().voteN.indexOf(StuID)!=-1) {
                                voteChooseN = true;
                            } else if (change.doc.data().voteY.indexOf(StuID)!=-1) {
                                voteChooseY = true;
                            }
                            // 判斷是否結案
                            if (change.doc.data().solve == false) {
                                var type = "投票中";
                            } else {
                                var type = "已結案";                                
                            }

                            // 查詢圖片檔名
                            db.collection("帳號").doc(change.doc.data().StuID)
                            .get().then(function(results) {
                                var storage = firebase.storage();
                                var storageRef = storage.ref();
                                storageRef.child('members/'+results.data().Img).getDownloadURL().then(function(url) {
                                    var voteImg = url;

                                    // 放入投票內容
                                    $scope.votes.push({
                                        voteID:change.doc.id,
                                        voteStuID:change.doc.data().StuID,
                                        voteName:change.doc.data().StuID + ' ' + change.doc.data().StuName,
                                        voteImg:voteImg,
                                        title:change.doc.data().title,
                                        type:type,
                                        content:change.doc.data().content,
                                        voteN:change.doc.data().voteN,
                                        voteY:change.doc.data().voteY,
                                        voteChooseN:voteChooseN,
                                        voteChooseY:voteChooseY,
                                        time:change.doc.data().time
                                    });

                                    $scope.$apply(); //重新監聽view
                                    console.log("新增：", $scope.votes);
                                })
                            }).catch(function(error) { 
                                console.log("查詢圖片檔名發生錯誤：", error); 
                            });
                            
                        }
                        // 修改 - 更新票數 更新結案
                        if (change.type === "modified") {
                            // 初始化選擇
                            var voteChooseN = false;
                            var voteChooseY = false;
                            // 如果自己有在voteN裡面 or在voteY裡面
                            if (change.doc.data().voteN.indexOf(StuID)!=-1) {
                                voteChooseN = true;
                            } else if (change.doc.data().voteY.indexOf(StuID)!=-1) {
                                voteChooseY = true;
                            }
                            
                            // 用findIndex找出位置
                            var indexNum = $scope.votes.findIndex((element)=>{
                                return (element.voteID === change.doc.id);
                            });

                            // 更新票數
                            $scope.votes[indexNum].voteN = change.doc.data().voteN;
                            $scope.votes[indexNum].voteY = change.doc.data().voteY;
                            $scope.votes[indexNum].voteChooseN = voteChooseN;
                            $scope.votes[indexNum].voteChooseY = voteChooseY;

                            // 判斷是否結案
                            if (change.doc.data().solve == false) {
                                var type = "投票中";
                            } else {
                                var type = "已結案";                                
                            }
                            // 更新結案
                            $scope.votes[indexNum].type = type;

                            $scope.$apply(); //重新監聽view
                            console.log("修改：", change.doc.data());
                        }
                        // 刪除
                        if (change.type === "removed") {
                            // 用findIndex找出要刪除的位置
                            var indexNum = $scope.votes.findIndex((element)=>{
                                return (element.time.seconds === change.doc.data().time.seconds) & (element.time.nanoseconds === change.doc.data().time.nanoseconds);
                            });
                            // 刪除
                            if (indexNum!=-1) {
                                $scope.votes.splice(indexNum,1);
                                console.log("刪除列表成功");
                            }else{
                                console.log("刪除列表不成功");
                            }
                            $scope.$apply(); //重新監聽view
                            console.log("刪除：", change.doc.data());
                        }
                    });
                }
            },function(error) {
                console.log("取得建議發生錯誤：", error); 
            });

            // 點擊votebtn
            $scope.votebtn = function(NorY,voteID,voteStuID) {
                // 用findIndex找出位置
                var indexNum = $scope.votes.findIndex((element)=>{
                    return (element.voteID === voteID);
                });
                if (indexNum!=-1) {
                    // 判斷按鈕  
                    if (NorY=='N') {
                        // 判斷N是否投過
                        if ($scope.votes[indexNum].voteN.indexOf(StuID)!=-1) {
                            // 有投過 刪除自己
                            $scope.votes[indexNum].voteN.splice($scope.votes[indexNum].voteN.indexOf(StuID),1);
                            $scope.votes[indexNum].voteChooseN = false;
                        } else {
                            // 沒投過 新增自己
                            $scope.votes[indexNum].voteN.push(StuID);
                            $scope.votes[indexNum].voteChooseN = true;
                            // 如果Y有自己就刪除
                            if ($scope.votes[indexNum].voteY.indexOf(StuID)!=-1) {
                                // 清除Y的自己
                                $scope.votes[indexNum].voteY.splice($scope.votes[indexNum].voteY.indexOf(StuID),1);
                                $scope.votes[indexNum].voteChooseY = false;
                            }
                        }
                    } else if (NorY=='Y') {
                        // 判斷Y是否投過
                        if ($scope.votes[indexNum].voteY.indexOf(StuID)!=-1) {
                            // 有投過 刪除自己
                            $scope.votes[indexNum].voteY.splice($scope.votes[indexNum].voteY.indexOf(StuID),1);
                            $scope.votes[indexNum].voteChooseY = false;
                        } else {
                            // 沒投過 新增自己
                            $scope.votes[indexNum].voteY.push(StuID);
                            $scope.votes[indexNum].voteChooseY = true;
                            // 如果N有自己就刪除
                            if ($scope.votes[indexNum].voteN.indexOf(StuID)!=-1) {
                                // 清除N的自己
                                $scope.votes[indexNum].voteN.splice($scope.votes[indexNum].voteN.indexOf(StuID),1);
                                $scope.votes[indexNum].voteChooseN = false;
                            }
                        }
                    }

                    // 判斷是否過半數
                    // 取得組員人數
                    db.collection("分組").doc(ClassID).collection("group").doc(GroupID)
                    .get().then(function(doc) {
                        var membersLength = doc.data().members.length;
                        if ($scope.votes[indexNum].voteN.length > membersLength/2 || $scope.votes[indexNum].voteY.length > membersLength/2 || ($scope.votes[indexNum].voteN.length == $scope.votes[indexNum].voteY.length && $scope.votes[indexNum].voteY.length == membersLength/2)) {
                            console.log("關閉投票");
                            // 關閉投票
                            db.collection("投票").doc(ClassID).collection(GroupID).doc(voteID)
                            .update({
                                solve: true,
                            })
                            .then(function(data) {
                                console.log("關閉投票成功");
                                $scope.$apply(); //重新監聽view
                                // 將獎勵發給發起者
                                // 取得目前次數
                                db.collection("點數").doc(ClassID).collection(voteStuID).doc("小任務進度").collection("小任務進度").doc("SmallTask5")
                                .get().then(function(results) {
                                    if(!results.exists) {
                                        console.log("第一次結案");
                                        // 更新小任務進度
                                        db.collection("點數").doc(ClassID).collection(voteStuID).doc("小任務進度").collection("小任務進度").doc("SmallTask5")
                                        .set({
                                            schedule: 1,
                                            time: new Date()
                                        })
                                        .then(function(data) {
                                            console.log("更新小任務進度成功");
                                        })
                                        .catch(function(error) {
                                            console.error("更新小任務進度失敗：", error);
                                        });
                                    } else {
                                        console.log("增加結案次數");
                                        // 更新小任務進度
                                        db.collection("點數").doc(ClassID).collection(voteStuID).doc("小任務進度").collection("小任務進度").doc("SmallTask5")
                                        .update({
                                            schedule: results.data().schedule+1,
                                            time: new Date()
                                        })
                                        .then(function(data) {
                                            console.log("更新小任務進度成功");
                                        })
                                        .catch(function(error) {
                                            console.error("更新小任務進度失敗：", error);
                                        });
                                    }
                                }).catch(function(error) { 
                                    console.log("取得目前次數發生錯誤：", error); 
                                });
                                // 將獎勵發給參與者
                                // 相加兩陣列 不重複
                                var a = $scope.votes[indexNum].voteN.concat($scope.votes[indexNum].voteY).concat();//使用concat()再複製一份陣列，避免影響原陣列
                                for(var i=0; i<a.length; ++i) {
                                    for(var j=i+1; j<a.length; ++j) {
                                        if(a[i] === a[j])
                                            a.splice(j, 1);
                                    }
                                }
                                a.forEach(function (Stu) {
                                    // 取得目前次數
                                    db.collection("點數").doc(ClassID).collection(Stu).doc("小任務進度").collection("小任務進度").doc("SmallTask6")
                                    .get().then(function(results) {
                                        if(!results.exists) {
                                            console.log("第一次結案");
                                            // 更新小任務進度
                                            db.collection("點數").doc(ClassID).collection(Stu).doc("小任務進度").collection("小任務進度").doc("SmallTask6")
                                            .set({
                                                schedule: 1,
                                                time: new Date()
                                            })
                                            .then(function(data) {
                                                console.log("更新小任務進度成功");
                                            })
                                            .catch(function(error) {
                                                console.error("更新小任務進度失敗：", error);
                                            });
                                        } else {
                                            console.log("增加結案次數");
                                            // 更新小任務進度
                                            db.collection("點數").doc(ClassID).collection(Stu).doc("小任務進度").collection("小任務進度").doc("SmallTask6")
                                            .update({
                                                schedule: results.data().schedule+1,
                                                time: new Date()
                                            })
                                            .then(function(data) {
                                                console.log("更新小任務進度成功");
                                            })
                                            .catch(function(error) {
                                                console.error("更新小任務進度失敗：", error);
                                            });
                                        }
                                    }).catch(function(error) { 
                                        console.log("取得目前次數發生錯誤：", error); 
                                    });
                                });
                                
                            })
                            .catch(function(error) {
                                console.error("關閉投票失敗：", error);
                            });
                        }
                    }).catch(function(error) { 
                        console.log("取得組員人數發生錯誤：", error); 
                    });

                    // 更新伺服器
                    db.collection("投票").doc(ClassID).collection(GroupID).doc(voteID)
                    .update({
                        voteN: $scope.votes[indexNum].voteN,
                        voteY: $scope.votes[indexNum].voteY
                    })
                    .then(function(data) {
                        console.log("更新伺服器成功");
                    })
                    .catch(function(error) {
                        console.error("更新伺服器失敗：", error);
                    });

                }else{
                    console.log("取得該vote失敗");
                }
            };

            // 發起投票
            $scope.Addvote = function(){
                // 發起投票 - 跳出泡泡
                $scope.voteInput = [];
                $ionicPopup.show({
                    title: '發起投票',
                    template: 
                        '<input type="text" ng-model="voteInput.title" placeholder="輸入投票標題（限15字內）..." maxlength="15" style="margin-bottom:10px; padding:8px;">'+
                        '<textarea cols="50" rows="5" ng-model="voteInput.content" placeholder="輸入投票說明（限50字內）..." maxlength="50" style="margin-bottom:10px; padding:8px;"></textarea>',
                    scope: $scope,
                    buttons: [{
                        text: '取消',
                        type: 'button-default',
                        onTap: function(e) {
                            console.log('選擇取消');
                        }
                    }, {
                        text: '發起',
                        type: 'button-chanry1',
                        onTap: function(e) {
                            console.log('選擇發起');
                            // 判斷是否必填未填
                            if ($scope.voteInput.title==""||$scope.voteInput.title==undefined) {
                                console.log("請填寫投票標題");
                                $ionicPopup.alert({
                                    title: '錯誤',
                                    template: '請填寫投票標題。'
                                });
                            } else if($scope.voteInput.content==""||$scope.voteInput.content==undefined) {
                                console.log("請填寫投票說明");
                                $ionicPopup.alert({
                                    title: '錯誤',
                                    template: '請填寫投票說明。'
                                });
                            } else {
                                // 新增投票
                                db.collection("投票").doc(ClassID).collection(GroupID)
                                .add({
                                    StuID: StuID,
                                    StuName: StuName,
                                    title: $scope.voteInput.title,
                                    content: $scope.voteInput.content,
                                    solve: false,
                                    voteN: [],
                                    voteY: [StuID],
                                    time: new Date()
                                })
                                .then(function(data) {
                                    console.log("新增投票成功");
                                })
                                .catch(function(error) {
                                    console.error("新增投票失敗：", error);
                                });
                                // 更新教師主控台
                                db.collection("投票").doc(ClassID)
                                .set({
                                    update: new Date()
                                })
                                .then(function(data) {
                                    console.log("更新教師主控台成功");
                                })
                                .catch(function(error) {
                                    console.error("更新教師主控台失敗：", error);
                                });
                            }
                        }
                    }]
                });
            };

        }else{
            console.log("尚未登入");
            $state.go("login");
            // window.location.reload();
        }
    });
}])
   
// ----------------------------------------課程任務頁面----------------------------------------
.controller('missionCtrl', ['$scope', '$stateParams', '$sce', '$state', '$ionicPopup', '$ionicLoading', '$ionicScrollDelegate',
function ($scope, $stateParams, $sce, $state, $ionicPopup, $ionicLoading, $ionicScrollDelegate) {
    var db = firebase.firestore();
    // 驗證登入
    firebase.auth().onAuthStateChanged((user) => {
        if (user) { //登入成功，取得使用者
            console.log("已登入狀態");
            var StuID = user.email.substring(0,user.email.indexOf("@")).toUpperCase();
            var ClassID = localStorage.getItem("ClassID");
            var GroupID = localStorage.getItem("GroupID");

            // 判斷組長
            $scope.isLeader = false;
            $scope.members = [];
            db.collection("分組").doc(ClassID).collection("group").where("leader", "==", StuID)
            .get().then(function(results) {
                if(results.empty) {
                    console.log("你非組長"); 
                    $scope.isLeader = false;
                } else {
                    console.log("你是組長");
                    $scope.isLeader = true;
                    // 取得小組名單
                    db.collection("分組").doc(ClassID).collection("group").doc(GroupID)
                    .get().then(function(results) {
                        $scope.members = results.data().members;
                    }).catch(function(error) { 
                        console.log("取得小組名單發生錯誤：", error); 
                    });
                
                    // 分組學習單匯入
                    // db.collection("課程任務").doc(ClassID).collection("任務列表").doc("D9fRCoHuIRQov8hryz1K").collection("填答結果").where("StuID", "==", StuID)
                    // .get().then(function(results) {
                    //     if (results.empty) {
                    //         // 上次未送出
                    //         console.log("上次未送出");
                    //     } else {
                    //         // 取得上一版資料
                    //         console.log("取得上一版資料");
                    //         results.forEach(function (doc) {
                    //             if (doc.data().response.question1==undefined) {
                    //                 $scope.response.question1 = "";
                    //             } else {
                    //                 $scope.response.question1 = doc.data().response.question1;
                    //             }
                    //             if (doc.data().response.question2==undefined) {
                    //                 $scope.response.question2 = "";
                    //             } else {
                    //                 $scope.response.question2 = doc.data().response.question2;
                    //             }
                    //             if (doc.data().response.question3==undefined) {
                    //                 $scope.response.question3 = "";
                    //             } else {
                    //                 $scope.response.question3 = doc.data().response.question3;
                    //             }
                    //             if (doc.data().response.question4==undefined) {
                    //                 $scope.response.question4 = "";
                    //             } else {
                    //                 $scope.response.question4 = doc.data().response.question4;
                    //             }
                    //             if (doc.data().response.question5==undefined) {
                    //                 $scope.response.question5 = "";
                    //             } else {
                    //                 $scope.response.question5 = doc.data().response.question5;
                    //             }

                    //             $scope.checkProposals = doc.data().response.proposal;
                    //             $scope.chooseProposal = doc.data().response.proposal;
                    //         });
                    //     }
                    // }).catch(function(error) { 
                    //     console.log("分組學習單匯入發生錯誤：", error); 
                    // });
                }
                
                // 監聽 - 載入所有任務
                $scope.missions = [];
                db.collection("課程任務").doc(ClassID).collection("任務列表")
                .onSnapshot(function(querySnapshot) {
                    querySnapshot.docChanges().forEach(function(change) {
                        if (change.type === "added") {
                            // 判斷是否 關閉3 完成1 過期2
                            var lock = 0;
                            if (change.doc.data().lock == true){
                                lock = 3;
                            } else if (change.doc.data().finished.indexOf(StuID)!=-1){
                                lock = 1;
                            } else if (change.doc.data().TimeOut.toDate() < new Date()){
                                lock = 2;
                            } else if (change.doc.data().LeaderOnly && !$scope.isLeader) {
                                // 限組長填寫，且你不是組長
                                lock = 3;
                            }
                            // Month轉換格式為數字(Number) Date判斷補0(if) HTML轉換格式為HTML($sce)
                            var pushMonth = Number(change.doc.data().TimeOut.toDate().getMonth())+1;
                            if (pushMonth<=9) {
                                pushMonth = '0'+pushMonth;
                            }
                            var pushDate = change.doc.data().TimeOut.toDate().getDate();
                            if (pushDate<=9) {
                                pushDate = '0'+pushDate;
                            }
                            $scope.missions.push({
                                missionID:change.doc.id,
                                Name:change.doc.data().Name,
                                Content:change.doc.data().Content,
                                TimeOut:change.doc.data().TimeOut.toDate().getUTCFullYear()+'/'+
                                        pushMonth+'/'+
                                        pushDate,
                                LeaderOnly:change.doc.data().LeaderOnly,
                                type:change.doc.data().type,
                                Point:change.doc.data().Point,
                                finished:change.doc.data().finished,
                                HTML:$sce.trustAsHtml(change.doc.data().HTML),
                                time:change.doc.data().time,
                                lock:lock,
                                hide:!change.doc.data().hide,
                                show:false,
                                isIRS:change.doc.data().isIRS,
                                showMsg:'查看更多'
                            });
                            $scope.$apply(); //重新監聽view
                            console.log("新增: ", $scope.missions);
                        } else if (change.type === "modified") {
                            console.log("修改: ", change.doc.data());
                            // 用findIndex找出要修改的位置
                            var indexNum = $scope.missions.findIndex((element)=>{
                                return (element.time.seconds === change.doc.data().time.seconds) & (element.time.nanoseconds === change.doc.data().time.nanoseconds);
                            });
                            // 修改
                            if (indexNum!=-1) {
                                // 判斷是否 關閉3 完成1 過期2
                                var lock = 0;
                                if (change.doc.data().lock == true){
                                    lock = 3;
                                } else if (change.doc.data().finished.indexOf(StuID)!=-1){
                                    lock = 1;
                                } else if (change.doc.data().TimeOut.toDate() < new Date()){
                                    lock = 2;
                                } else if (change.doc.data().LeaderOnly && !$scope.isLeader) { 
                                    // 限組長填寫，且你不是組長
                                    lock = 3;
                                }
                                $scope.missions[indexNum].lock = lock;
                                console.log("修改任務成功");
                            }else{
                                console.log("修改任務不成功");
                            }
                            $scope.$apply(); //重新監聽view
                        } else if (change.type === "removed") {
                            console.log("刪除: ", change.doc.data());
                            // 用findIndex找出要刪除的位置
                            var indexNum = $scope.missions.findIndex((element)=>{
                                return (element.time.seconds === change.doc.data().time.seconds) & (element.time.nanoseconds === change.doc.data().time.nanoseconds);
                            });
                            // 刪除
                            if (indexNum!=-1) {
                                $scope.missions.splice(indexNum,1);
                                console.log("刪除任務成功");
                            }else{
                                console.log("刪除任務不成功");
                            }
                            $scope.$apply(); //重新監聽view
                        }
                    });
                });
            }).catch(function(error) { 
                console.log("判斷組長發生錯誤：", error); 
            });

            // 分組評分用 - 取得全部小組名單
            db.collection("分組").doc(ClassID).collection("group")
            .get().then(function(results) {
                $scope.groups = [];
                results.forEach(function (doc) {
                    // 排除掉管理員
                    if (doc.data().leader!="F107193102") {
                        var members = [];
                        for (let index = 0; index < doc.data().members.length; index++) {
                            // 查詢帳號資料
                            db.collection("帳號").doc(doc.data().members[index])
                            .get().then(function(results) {
                                // 第一位是組長
                                var leaderTrue = false;
                                if (index == 0) {
                                    leaderTrue = true;
                                }
                                // 獲取組員大頭照
                                var storage = firebase.storage();
                                storage.ref().child('members/'+results.data().Img).getDownloadURL().then(function(url) {
                                    members.push({
                                        memberID:doc.data().members[index],
                                        memberName:results.data().Name,
                                        memberImg:url,
                                        leader:leaderTrue
                                    });
                                    $scope.$apply(); //重新監聽view
                                });
                            }).catch(function(error) { 
                                console.log("查詢帳號資料發生錯誤：", error); 
                            });
                            // 判斷最後一筆
                            if (index==doc.data().members.length-1) {
                                $scope.groups.push({
                                    groupID:doc.id,
                                    members:members,
                                    show: false
                                });
                                console.log($scope.groups);
                            }
                        }
                    }
                });
            }).catch(function(error) { 
                console.log("評分用 - 取得全部小組名單發生錯誤：", error); 
            });

            // 分組評分用 - 小組收合
            $scope.groupShow = function(doc){
                // 用findIndex找出要修改的位置
                var indexNum = $scope.groups.findIndex((element)=>{
                    return (element.$$hashKey === doc.$$hashKey);
                });
                // 修改
                if (indexNum!=-1) {
                    if ($scope.groups[indexNum].show) {
                        $scope.groups[indexNum].show = false;
                    } else {
                        $scope.groups[indexNum].show = true;
                    }
                    console.log("修改顯示成功");
                }else{
                    console.log("修改顯示不成功");
                }
            };

            // 分組評分用 - 每次點選項，更新結果檔
            $scope.answerChange = function(missionID,answer,groupID){
                $scope.answer = answer;
                // 將小組底色變綠 表示已填 - 用findIndex找出位置
                var indexNum = $scope.groups.findIndex((element)=>{
                    return (element.groupID === groupID);
                });
                if (indexNum!=-1) {
                    $scope.groups[indexNum].finished = true;
                }

                // 判斷是否已有 - 用findIndex找出位置
                var indexNum = $scope.response.findIndex((element)=>{
                    return (element.missionID === missionID);
                });
                if (indexNum!=-1) {
                    // 已有則更新
                    $scope.response[indexNum].answer = answer;
                }else{
                    // 沒有則新增
                    $scope.response.push({
                        missionID:missionID,
                        answer:answer
                    });
                }
                console.log($scope.response);
            };

            // 組內評分用 - 取得自己小組名單
            // db.collection("分組").doc(ClassID).collection("group").doc("PQLRY7r7ioygwLB3vNaD")
            db.collection("分組").doc(ClassID).collection("group").doc(GroupID)
            .get().then(function(doc) {
                $scope.mission_members = [];
                var members = [];
                for (let index = 0; index < doc.data().members.length; index++) {
                    // 查詢帳號資料
                    db.collection("帳號").doc(doc.data().members[index])
                    .get().then(function(results) {
                        // 第一位是組長
                        var leaderTrue = false;
                        if (index == 0) {
                            leaderTrue = true;
                        }
                        // 判斷是不是自己
                        var memberName = "";
                        if (doc.data().members[index]==StuID) {
                            memberName = "我";
                        } else {
                            memberName = results.data().Name;                            
                        }
                        // 獲取組員大頭照
                        var storage = firebase.storage();
                        storage.ref().child('members/'+results.data().Img).getDownloadURL().then(function(url) {
                            members.push({
                                memberID:doc.data().members[index],
                                memberName:memberName,
                                memberImg:url,
                                show:false,
                                finished:false,
                                leader:leaderTrue
                            });
                            $scope.$apply(); //重新監聽view
                        });
                    }).catch(function(error) { 
                        console.log("查詢帳號資料發生錯誤：", error); 
                    });
                    // 判斷最後一筆
                    if (index==doc.data().members.length-1) {
                        $scope.mission_members = members;
                    }
                }
            }).catch(function(error) { 
                console.log("評分用 - 取得全部小組名單發生錯誤：", error); 
            });

            // 組內評分用 - 成員收合
            $scope.memberShow = function(doc){
                // 用findIndex找出要修改的位置
                var indexNum = $scope.mission_members.findIndex((element)=>{
                    return (element.$$hashKey === doc.$$hashKey);
                });
                // 修改
                if (indexNum!=-1) {
                    if ($scope.mission_members[indexNum].show) {
                        $scope.mission_members[indexNum].show = false;
                    } else {
                        $scope.mission_members[indexNum].show = true;
                        // 將其他隱藏
                        for (let index = 0; index < $scope.mission_members.length; index++) {
                            if (indexNum!=index) {
                                $scope.mission_members[index].show = false;
                            }
                        }
                    }
                    console.log("修改顯示成功");
                }else{
                    console.log("修改顯示不成功");
                }
            };

            // 組內評分用 - 每次點選項，更新結果檔
            $scope.answer3Change = function(missionID,answer,memberID){
                $scope.answer3 = answer;
                // 將小組底色變綠 表示已填 - 用findIndex找出位置
                var indexNum = $scope.mission_members.findIndex((element)=>{
                    return (element.memberID === memberID);
                });
                if (indexNum!=-1) {
                    $scope.mission_members[indexNum].finished = true;
                }

                // 判斷是否已有 - 用findIndex找出位置
                var indexNum = $scope.response.findIndex((element)=>{
                    return (element.missionID === missionID);
                });
                if (indexNum!=-1) {
                    // 已有則更新
                    $scope.response[indexNum].answer = answer;
                }else{
                    // 沒有則新增
                    $scope.response.push({
                        missionID:missionID,
                        answer:answer
                    });
                }
                console.log($scope.response);
            };

            // 檔案上傳用
            $scope.fileChanged = function(ele){
                var This_missionID = "ARuBqgDSkFJDMHH2UCFg";

                //  上傳檔案
                var storage = firebase.storage();
                var storageRef = storage.ref();
                var uploadTask = storageRef.child('mission/'+ClassID+'/'+This_missionID+'/'+GroupID).put(ele.files[0])
                .then(function(snapshot) {
                    // 取得檔案上傳狀態，並用數字顯示
                    var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    $ionicLoading.show({ // 開始跑圈圈
                        template: '已上傳 ' + progress + '%'
                    });
                    switch (snapshot.state) {
                        case firebase.storage.TaskState.PAUSED: 
                        console.log('上傳暫停');
                        break;
                        case firebase.storage.TaskState.RUNNING: 
                        console.log('上傳中');
                        break;
                    }
                    if (progress==100) {
                        console.log("上傳成功");
                        $ionicLoading.hide();
                    }
                }, function(error) {
                    console.log("上傳失敗");
                    $ionicLoading.hide();
                    console.log(error);
                    var alertPopup = $ionicPopup.alert({
                        title: '上傳失敗',
                        template: error
                    });
                });
                
                // 判斷是否已有 - 用findIndex找出位置
                var indexNum = $scope.response.findIndex((element)=>{
                    return (element.missionID === This_missionID);
                });
                if (indexNum!=-1) {
                    // 已有則更新
                    $scope.response[indexNum].answer = "已上傳檔案至伺服器";
                }else{
                    // 沒有則新增
                    $scope.response.push({
                        missionID:This_missionID,
                        answer:"已上傳檔案至伺服器"
                    });
                }
                console.log($scope.response);
            };

            // 其他任務用 - 每次點選項，更新結果檔
            $scope.answer2Change = function(missionID,answer){
                // 判斷是否已有 - 用findIndex找出位置
                var indexNum = $scope.response.findIndex((element)=>{
                    return (element.missionID === missionID);
                });
                if (indexNum!=-1) {
                    // 已有則更新
                    $scope.response[indexNum].answer = answer;
                }else{
                    // 沒有則新增
                    $scope.response.push({
                        missionID:missionID,
                        answer:answer
                    });
                }
                console.log($scope.response);
            };

            // 監聽 - 載入小任務進度
            db.collection("點數").doc(ClassID).collection(StuID).doc("小任務進度").collection("小任務進度")
            .onSnapshot(function(results) {
                $scope.SmallTask = [];
                $scope.SmallTask.SmallTask1_finished = false;
                $scope.SmallTask.SmallTask1_schedule = 0;
                $scope.SmallTask.SmallTask2_finished = false;
                $scope.SmallTask.SmallTask2_schedule = 0;
                $scope.SmallTask.SmallTask3_finished = false;
                $scope.SmallTask.SmallTask3_schedule = 0;
                $scope.SmallTask.SmallTask4_finished = false;
                $scope.SmallTask.SmallTask4_schedule = 0;
                $scope.SmallTask.SmallTask5_finished = false;
                $scope.SmallTask.SmallTask5_schedule = 0;
                $scope.SmallTask.SmallTask6_finished = false;
                $scope.SmallTask.SmallTask6_schedule = 0;
                $scope.SmallTask.SmallTask7_finished = false;
                $scope.SmallTask.SmallTask7_schedule = 0;
                $scope.SmallTask.SmallTask8_finished = false;
                $scope.SmallTask.SmallTask8_schedule = 0;
                // 確認是否有小任務
                if (results.empty == false) {
                    results.forEach(function (doc) {
                        var content,point;
                        // 判斷並放入資料(不聰明做法)
                        if (doc.id=="SmallTask1") {
                            // 判斷成功
                            if (doc.data().schedule>=1) {
                                $scope.SmallTask.SmallTask1_finished = true;
                                // 防作弊 - 檢查是否已加分
                                db.collection("點數").doc(ClassID).collection(StuID).doc("點數歷程記錄").collection("點數歷程記錄").where("check", "==", "SmallTask1")
                                .get().then(function(results) {
                                    if(results.empty) {
                                        console.log("尚未解完此小任務"); 
                                        // 加分 - 上傳伺服器
                                        db.collection("點數").doc(ClassID).collection(StuID).doc("點數歷程記錄").collection("點數歷程記錄")
                                        .add({
                                            content: '完成任務：擁有小組(1/1)',
                                            point: paswLock(15),
                                            check: 'SmallTask1',
                                            time: new Date()
                                        })
                                        .then(function(data) {
                                            console.log("加分 - 上傳伺服器成功");
                                        })
                                        .catch(function(error) {
                                            console.error("加分 - 上傳伺服器失敗：", error);
                                        });
                                    } else {
                                        console.log("已拿過此獎勵");
                                    }
                                }).catch(function(error) { 
                                    console.log("防作弊 - 檢查是否已加分發生錯誤：", error); 
                                });
                            } else {
                                $scope.SmallTask.SmallTask1_finished = false;
                            }
                            $scope.SmallTask.SmallTask1_schedule = doc.data().schedule;
                        } else if (doc.id=="SmallTask2_3") {
                            // 判斷成功
                            if (doc.data().schedule>=5) {
                                $scope.SmallTask.SmallTask2_finished = true;
                                // 防作弊 - 檢查是否已加分
                                db.collection("點數").doc(ClassID).collection(StuID).doc("點數歷程記錄").collection("點數歷程記錄").where("check", "==", "SmallTask2")
                                .get().then(function(results) {
                                    if(results.empty) {
                                        console.log("尚未解完此小任務"); 
                                        // 加分 - 上傳伺服器
                                        db.collection("點數").doc(ClassID).collection(StuID).doc("點數歷程記錄").collection("點數歷程記錄")
                                        .add({
                                            content: '完成任務：參與腦力激盪討論(5/5)',
                                            point: paswLock(10),
                                            check: 'SmallTask2',
                                            time: new Date()
                                        })
                                        .then(function(data) {
                                            console.log("加分 - 上傳伺服器成功");
                                        })
                                        .catch(function(error) {
                                            console.error("加分 - 上傳伺服器失敗：", error);
                                        });
                                    } else {
                                        console.log("已拿過此獎勵");
                                    }
                                }).catch(function(error) { 
                                    console.log("防作弊 - 檢查是否已加分發生錯誤：", error); 
                                });
                            } else {
                                $scope.SmallTask.SmallTask2_finished = false;
                            }
                            $scope.SmallTask.SmallTask2_schedule = doc.data().schedule;

                            // 判斷成功
                            if (doc.data().schedule>=20) {
                                $scope.SmallTask.SmallTask3_finished = true;
                                // 防作弊 - 檢查是否已加分
                                db.collection("點數").doc(ClassID).collection(StuID).doc("點數歷程記錄").collection("點數歷程記錄").where("check", "==", "SmallTask3")
                                .get().then(function(results) {
                                    if(results.empty) {
                                        console.log("尚未解完此小任務"); 
                                        // 加分 - 上傳伺服器
                                        db.collection("點數").doc(ClassID).collection(StuID).doc("點數歷程記錄").collection("點數歷程記錄")
                                        .add({
                                            content: '完成任務：參與腦力激盪討論(20/20)',
                                            point: paswLock(20),
                                            check: 'SmallTask3',
                                            time: new Date()
                                        })
                                        .then(function(data) {
                                            console.log("加分 - 上傳伺服器成功");
                                        })
                                        .catch(function(error) {
                                            console.error("加分 - 上傳伺服器失敗：", error);
                                        });
                                    } else {
                                        console.log("已拿過此獎勵");
                                    }
                                }).catch(function(error) { 
                                    console.log("防作弊 - 檢查是否已加分發生錯誤：", error); 
                                });
                            } else {
                                $scope.SmallTask.SmallTask3_finished = false;
                            }
                            $scope.SmallTask.SmallTask3_schedule = doc.data().schedule;
                        } else if (doc.id=="SmallTask4") {
                            // 判斷成功
                            if (doc.data().schedule>=10) {
                                $scope.SmallTask.SmallTask4_finished = true;
                                // 防作弊 - 檢查是否已加分
                                db.collection("點數").doc(ClassID).collection(StuID).doc("點數歷程記錄").collection("點數歷程記錄").where("check", "==", "SmallTask4")
                                .get().then(function(results) {
                                    if(results.empty) {
                                        console.log("尚未解完此小任務"); 
                                        // 加分 - 上傳伺服器
                                        db.collection("點數").doc(ClassID).collection(StuID).doc("點數歷程記錄").collection("點數歷程記錄")
                                        .add({
                                            content: '完成任務：按讚腦力激盪(10/10)',
                                            point: paswLock(10),
                                            check: 'SmallTask4',
                                            time: new Date()
                                        })
                                        .then(function(data) {
                                            console.log("加分 - 上傳伺服器成功");
                                        })
                                        .catch(function(error) {
                                            console.error("加分 - 上傳伺服器失敗：", error);
                                        });
                                    } else {
                                        console.log("已拿過此獎勵");
                                    }
                                }).catch(function(error) { 
                                    console.log("防作弊 - 檢查是否已加分發生錯誤：", error); 
                                });
                            } else {
                                $scope.SmallTask.SmallTask4_finished = false;
                            }
                            $scope.SmallTask.SmallTask4_schedule = doc.data().schedule;
                        } else if (doc.id=="SmallTask5") {
                            // 判斷成功
                            if (doc.data().schedule>=1) {
                                $scope.SmallTask.SmallTask5_finished = true;
                                // 防作弊 - 檢查是否已加分
                                db.collection("點數").doc(ClassID).collection(StuID).doc("點數歷程記錄").collection("點數歷程記錄").where("check", "==", "SmallTask5")
                                .get().then(function(results) {
                                    if(results.empty) {
                                        console.log("尚未解完此小任務"); 
                                        // 加分 - 上傳伺服器
                                        db.collection("點數").doc(ClassID).collection(StuID).doc("點數歷程記錄").collection("點數歷程記錄")
                                        .add({
                                            content: '完成任務：發起投票且結案(投票系統) (1/1)',
                                            point: paswLock(15),
                                            check: 'SmallTask5',
                                            time: new Date()
                                        })
                                        .then(function(data) {
                                            console.log("加分 - 上傳伺服器成功");
                                        })
                                        .catch(function(error) {
                                            console.error("加分 - 上傳伺服器失敗：", error);
                                        });
                                    } else {
                                        console.log("已拿過此獎勵");
                                    }
                                }).catch(function(error) { 
                                    console.log("防作弊 - 檢查是否已加分發生錯誤：", error); 
                                });
                            } else {
                                $scope.SmallTask.SmallTask5_finished = false;
                            }
                            $scope.SmallTask.SmallTask5_schedule = doc.data().schedule;
                        } else if (doc.id=="SmallTask6") {
                            // 判斷成功
                            if (doc.data().schedule>=5) {
                                $scope.SmallTask.SmallTask6_finished = true;
                                // 防作弊 - 檢查是否已加分
                                db.collection("點數").doc(ClassID).collection(StuID).doc("點數歷程記錄").collection("點數歷程記錄").where("check", "==", "SmallTask6")
                                .get().then(function(results) {
                                    if(results.empty) {
                                        console.log("尚未解完此小任務"); 
                                        // 加分 - 上傳伺服器
                                        db.collection("點數").doc(ClassID).collection(StuID).doc("點數歷程記錄").collection("點數歷程記錄")
                                        .add({
                                            content: '完成任務：參與投票且結案(投票系統) (5/5)',
                                            point: paswLock(5),
                                            check: 'SmallTask6',
                                            time: new Date()
                                        })
                                        .then(function(data) {
                                            console.log("加分 - 上傳伺服器成功");
                                        })
                                        .catch(function(error) {
                                            console.error("加分 - 上傳伺服器失敗：", error);
                                        });
                                    } else {
                                        console.log("已拿過此獎勵");
                                    }
                                }).catch(function(error) { 
                                    console.log("防作弊 - 檢查是否已加分發生錯誤：", error); 
                                });
                            } else {
                                $scope.SmallTask.SmallTask6_finished = false;
                            }
                            $scope.SmallTask.SmallTask6_schedule = doc.data().schedule;
                        } else if (doc.id=="SmallTask7") {
                            // 判斷成功
                            if (doc.data().schedule>=1) {
                                $scope.SmallTask.SmallTask7_finished = true;
                                // 防作弊 - 檢查是否已加分
                                db.collection("點數").doc(ClassID).collection(StuID).doc("點數歷程記錄").collection("點數歷程記錄").where("check", "==", "SmallTask7")
                                .get().then(function(results) {
                                    if(results.empty) {
                                        console.log("尚未解完此小任務"); 
                                        // 加分 - 上傳伺服器
                                        db.collection("點數").doc(ClassID).collection(StuID).doc("點數歷程記錄").collection("點數歷程記錄")
                                        .add({
                                            content: '完成任務：(限組員)建議提案聚焦且被採納 (1/1)',
                                            point: paswLock(20),
                                            check: 'SmallTask7',
                                            time: new Date()
                                        })
                                        .then(function(data) {
                                            console.log("加分 - 上傳伺服器成功");
                                        })
                                        .catch(function(error) {
                                            console.error("加分 - 上傳伺服器失敗：", error);
                                        });
                                    } else {
                                        console.log("已拿過此獎勵");
                                    }
                                }).catch(function(error) { 
                                    console.log("防作弊 - 檢查是否已加分發生錯誤：", error); 
                                });
                            } else {
                                $scope.SmallTask.SmallTask7_finished = false;
                            }
                            $scope.SmallTask.SmallTask7_schedule = doc.data().schedule;
                        } else if (doc.id=="SmallTask8") {
                            // 判斷成功
                            if (doc.data().schedule>=1) {
                                $scope.SmallTask.SmallTask8_finished = true;
                                // 防作弊 - 檢查是否已加分
                                db.collection("點數").doc(ClassID).collection(StuID).doc("點數歷程記錄").collection("點數歷程記錄").where("check", "==", "SmallTask8")
                                .get().then(function(results) {
                                    if(results.empty) {
                                        console.log("尚未解完此小任務"); 
                                        // 加分 - 上傳伺服器
                                        db.collection("點數").doc(ClassID).collection(StuID).doc("點數歷程記錄").collection("點數歷程記錄")
                                        .add({
                                            content: '完成任務：(限組長)擔任組長 (1/1)',
                                            point: paswLock(40),
                                            check: 'SmallTask8',
                                            time: new Date()
                                        })
                                        .then(function(data) {
                                            console.log("加分 - 上傳伺服器成功");
                                        })
                                        .catch(function(error) {
                                            console.error("加分 - 上傳伺服器失敗：", error);
                                        });
                                    } else {
                                        console.log("已拿過此獎勵");
                                    }
                                }).catch(function(error) { 
                                    console.log("防作弊 - 檢查是否已加分發生錯誤：", error); 
                                });
                            } else {
                                $scope.SmallTask.SmallTask8_finished = false;
                                // 防作弊 - 檢查是否已加分
                                db.collection("點數").doc(ClassID).collection(StuID).doc("點數歷程記錄").collection("點數歷程記錄").where("check", "==", "SmallTask8")
                                .get().then(function(results) {
                                    if(!results.empty) {
                                        results.forEach(function (doc) {
                                            console.log("已拿過此獎勵 但已經不是組長了"); 
                                            // 扣分 - 上傳伺服器
                                            db.collection("點數").doc(ClassID).collection(StuID).doc("點數歷程記錄").collection("點數歷程記錄").doc(doc.id)
                                            .delete().then(function () {
                                                console.log("扣分 - 上傳伺服器成功");
                                            })
                                            .catch(function(error) {
                                                console.error("扣分 - 上傳伺服器失敗：", error);
                                            });
                                        });
                                    }
                                }).catch(function(error) { 
                                    console.log("防作弊 - 檢查是否已加分發生錯誤：", error); 
                                });
                            }
                            $scope.SmallTask.SmallTask8_schedule = doc.data().schedule;
                        }
                        $scope.$apply(); //重新監聽view
                    });
                } else {
                    console.log("尚無小任務");
                }
                
            },function(error) {
                console.error("取得測驗資料發生錯誤：", error);
            });

            // 進入IRS按鈕
            $scope.GoIRS = function(missionID,missionName,missionContent){
                $state.go("menu.irs",{TestID:missionID,TestName:missionName,TestContent:missionContent});
            };

            // 選擇提案聚焦按鈕
            $scope.chooseProposal = [];
            $scope.chooseProposalBtn = function(){
                $scope.proposals = [];
                // 選擇提案 - 取得提案聚焦
                $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner><p>載入提案聚焦中...</p>'});
                db.collection("提案聚焦").doc(ClassID).collection(GroupID)
                .get().then(function(results) {
                    if(results.empty) {
                        console.log("無提案聚焦");
                        $ionicLoading.hide();
                    } else {
                        var a = results.docs.length;
                        var count = 0;
                        results.forEach(function (doc) {
                            $scope.proposals.push({
                                ID:doc.id,
                                ProposalName:doc.data().ProposalName,
                                brainstorming:doc.data().brainstorming,
                            });
                            // 判斷最後一筆關閉轉圈圈
                            count++;
                            if (count==a) {
                                $ionicLoading.hide();
                            }
                        });
                        console.log("取得提案聚焦：",$scope.proposals);
                    }
                }).catch(function(error) { 
                    console.log("取得未分組名單發生錯誤：", error); 
                });

                $scope.checkProposals = [];
                // 選擇提案 - 偵測勾選
                $scope.proposalBtn = function(proposal) {
                    // 判斷有無在陣列中，無則增加、有則刪除
                    if ($scope.checkProposals.indexOf(proposal) === -1) {
                        $scope.checkProposals.push(proposal);
                    } else {
                        $scope.checkProposals.splice($scope.checkProposals.indexOf(proposal),1);
                    }
                    console.log($scope.checkProposals);
                };
                
                $scope.proposalInput = [];
                // 選擇提案 - 跳出泡泡
                $ionicPopup.show({
                    title: '選擇提案',
                    subTitle: '請選擇提案聚焦，可多選。',
                    template: 
                        '<div>'+
                            '<div class="item item-divider">提案聚焦</div>'+
                            '<div ng-repeat="proposal in proposals">'+
                                '<ion-checkbox ng-click="proposalBtn(proposal)">{{proposal.ProposalName}}</ion-checkbox>'+
                            '</div>'+
                        '</div>',
                    scope: $scope,
                    buttons: [{
                        text: '取消',
                        type: 'button-default',
                        onTap: function(e) {
                            console.log('選擇取消');
                        }
                    }, {
                        text: '選擇',
                        type: 'button-chanry1',
                        onTap: function(e) {
                            console.log('選擇選擇');
                            // 判斷是否必填未填
                            if($scope.checkProposals.length == 0) {
                                console.log("請勾選提案聚焦");
                                $ionicPopup.alert({
                                    title: '錯誤',
                                    template: '請勾選至少一項提案聚焦。'
                                });
                            } else {
                                $scope.chooseProposal = $scope.checkProposals;
                                $scope.response.proposal = $scope.checkProposals;
                            }
                        }
                    }]
                });
            };            

            // 查看更多按鈕
            $scope.missionShow = function(doc){
                // 用findIndex找出要修改的位置
                var indexNum = $scope.missions.findIndex((element)=>{
                    return (element.$$hashKey === doc.$$hashKey);
                });
                // 修改
                if (indexNum!=-1) {
                    if ($scope.missions[indexNum].show) {
                        $scope.missions[indexNum].show = false;
                        $scope.missions[indexNum].showMsg = '查看更多';
                    } else {
                        $scope.missions[indexNum].show = true;
                        $scope.missions[indexNum].showMsg = '收合內容';
                    }
                    console.log("修改顯示成功");
                }else{
                    console.log("修改顯示不成功");
                }
            };

            // 回傳填答結果
            $scope.response = [];
            $scope.responseBtn = function(doc,PosRes){
                var missionID = doc.missionID;
                // 用findIndex找出位置
                var indexNum = $scope.response.findIndex((element)=>{
                    return (element.missionID === missionID);
                });

                console.log("判斷是否有提案匯入"+PosRes);
                // 判斷是否有提案匯入
                if (PosRes!=undefined) {
                    $scope.response[indexNum].answer.POS = PosRes;
                }

                // 跳出泡泡
                $ionicPopup.confirm({
                    title: '存檔送出',
                    template: '確定要送出嗎?',
                    subTitle: '注意：送出後無法修改。',
                    buttons: [{
                        text: '取消',
                        type: 'button-default',
                        onTap: function(e) {
                            console.log('選擇取消');
                        }
                    }, {
                        text: '確定',
                        type: 'button-chanry1',
                        onTap: function(e) {
                            console.log('選擇送出');
                            // 上傳伺服器
                            db.collection("課程任務").doc(ClassID).collection("任務列表").doc(missionID).collection("填答結果")
                            .add({
                                StuID: StuID,
                                missionID: missionID,
                                response: $scope.response[indexNum].answer,
                                time: new Date()
                            })
                            .then(function(data) {
                                console.log("回傳填答結果成功");
                                // 標記已完成 - 取得已完成名單
                                db.collection("課程任務").doc(ClassID).collection("任務列表").doc(missionID)
                                .get().then(function(results) {
                                    // 加分fun
                                    function addPoint(Stu) {
                                        // 防作弊 - 檢查是否已加分
                                        console.log('檢查是否已加分'+Stu);
                                        db.collection("點數").doc(ClassID).collection(Stu).doc("點數歷程記錄").collection("點數歷程記錄").where("check", "==", missionID)
                                        .get().then(function(results) {
                                            if(results.empty) {
                                                console.log("第一次拿獎勵"); 
                                                // 加分 - 上傳伺服器
                                                db.collection("點數").doc(ClassID).collection(Stu).doc("點數歷程記錄").collection("點數歷程記錄")
                                                .add({
                                                    content: '完成任務：'+doc.Name,
                                                    point: paswLock(doc.Point),
                                                    check: missionID,
                                                    time: new Date()
                                                })
                                                .then(function(data) {
                                                    console.log("加分 - 上傳伺服器成功");
                                                })
                                                .catch(function(error) {
                                                    console.error("加分 - 上傳伺服器失敗：", error);
                                                });
                                            } else {
                                                console.log("已拿過此獎勵");
                                                // 系統紀錄 - 通報伺服器
                                                db.collection("系統記錄").doc(ClassID).collection("資安回報")
                                                .add({
                                                    StuID: Stu,
                                                    Content: '已拿過'+missionID+'獎勵',
                                                    time: new Date()
                                                })
                                                .then(function(data) {
                                                    console.log("通報伺服器成功");
                                                })
                                                .catch(function(error) {
                                                    console.error("通報伺服器失敗：", error);
                                                });
                                            }
                                        }).catch(function(error) { 
                                            console.log("防作弊 - 檢查是否已加分發生錯誤：", error); 
                                        });
                                    }
                                    var a = results.data().finished;
                                    // 判斷如果是組長限定的任務
                                    if (doc.LeaderOnly) {
                                        for(var i=0; i<$scope.members.length; ++i) {
                                            a.push($scope.members[i]);
                                            // 加全部組員分
                                            addPoint($scope.members[i]);
                                        }
                                    } else {
                                        a.push(StuID);
                                        // 只加自己分
                                        addPoint(StuID);
                                    }
                                    // 標記已完成 - 更新已完成名單
                                    db.collection("課程任務").doc(ClassID).collection("任務列表").doc(missionID)
                                    .update({
                                        finished: a
                                    })
                                    .then(function() {
                                        console.log("更新已完成名單成功");
                                        // 收合內容
                                        $scope.missionShow(doc);
                                        $ionicScrollDelegate.scrollTop(); //滑到最上面
                                        $scope.$apply(); //重新監聽view
                                    })
                                    .catch(function(error) {
                                        console.error("更新已完成名單失敗", error);
                                    });
                                }).catch(function(error) { 
                                    console.log("取得已完成名單發生錯誤：", error); 
                                });
                            })
                            .catch(function(error) {
                                console.error("回傳填答結果失敗：", error);
                            });
                        }
                    }]
                });
            };

        }else{
            console.log("尚未登入");
            $state.go("login");
            // window.location.reload();
        }
    });
}])

// ----------------------------------------點數歷程記錄頁面----------------------------------------
.controller('pointCtrl', ['$scope', '$stateParams', '$sce', '$state',
function ($scope, $stateParams, $sce, $state) {
    var db = firebase.firestore();
    // 驗證登入
    firebase.auth().onAuthStateChanged((user) => {
        if (user) { //登入成功，取得使用者
            console.log("已登入狀態");
            var StuID = user.email.substring(0,user.email.indexOf("@")).toUpperCase();
            var ClassID = localStorage.getItem("ClassID");

            $scope.points = [];
            // 監聽 - 取得點數歷程記錄
            db.collection("點數").doc(ClassID).collection(StuID).doc("點數歷程記錄").collection("點數歷程記錄")
            .onSnapshot(function(querySnapshot) {
                querySnapshot.docChanges().forEach(function(change) {
                    if (change.type === "added") {
                        // 呼叫解密fun
                        var point = pasw(change.doc.data().point);
                        if (point == 'ER') {
                            // 系統紀錄 - 通報伺服器
                            db.collection("系統記錄").doc(ClassID).collection("資安回報")
                            .add({
                                StuID: StuID,
                                Content: '點數解密發生錯誤',
                                time: new Date()
                            })
                            .then(function(data) {
                                console.log("通報伺服器成功");
                            })
                            .catch(function(error) {
                                console.error("通報伺服器失敗：", error);
                            });
                        }
                        
                        // Month轉換格式為數字(Number) Date判斷補0(if) HTML轉換格式為HTML($sce)
                        var pushMonth = Number(change.doc.data().time.toDate().getMonth())+1;
                        if (pushMonth<=9) {
                            pushMonth = '0'+pushMonth;
                        }
                        var pushDate = change.doc.data().time.toDate().getDate();
                        if (pushDate<=9) {
                            pushDate = '0'+pushDate;
                        }
                        // 取得日期
                        var time = pushMonth+'/'+pushDate;

                        // 放入資料
                        $scope.points.push({
                            point:point,
                            content:change.doc.data().content,
                            time:time,
                            deltime:change.doc.data().time
                        });
                        console.log("新增: ", change.doc.data());
                        $scope.$apply(); //重新監聽view
                    } else if (change.type === "modified") {
                        console.log("修改: ", change.doc.data());
                    } else if (change.type === "removed") {
                        console.log("刪除: ", change.doc.data());
                        // 用findIndex找出要刪除的位置
                        var indexNum = $scope.points.findIndex((element)=>{
                            return (element.deltime.seconds === change.doc.data().time.seconds) & (element.deltime.nanoseconds === change.doc.data().time.nanoseconds);
                        });
                        // 刪除
                        if (indexNum!=-1) {
                            $scope.points.splice(indexNum,1);
                            console.log("刪除點數歷程記錄成功");
                        }else{
                            console.log("刪除點數歷程記錄不成功");
                        }
                        $scope.$apply(); //重新監聽view
                    }
                });
            });
        }else{
            console.log("尚未登入");
            $state.go("login");
            // window.location.reload();
        }
    });
}])

// ----------------------------------------IRS頁面----------------------------------------
.controller('irsCtrl', ['$scope', '$stateParams', '$sce', '$state', '$ionicScrollDelegate',
function ($scope, $stateParams, $sce, $state, $ionicScrollDelegate) {
    var db = firebase.firestore();
    // 驗證登入
    firebase.auth().onAuthStateChanged((user) => {
        if (user && $stateParams.TestID!=null) { //登入成功，取得使用者
            console.log("已登入狀態");
            var StuID = user.email.substring(0,user.email.indexOf("@")).toUpperCase();
            var ClassID = localStorage.getItem("ClassID");
            var TestID = $stateParams.TestID;

            // 防作弊 - 檢查是否已完成
            db.collection("課程任務").doc(ClassID).collection("任務列表").doc(TestID)
            .get().then(function(results) {
                if (results.data().finished.indexOf(StuID)!=-1) {
                    console.log("已完成過測驗");
                    $state.go("login");
                    // window.location.reload();
                }
            }).catch(function(error) { 
                console.log("檢查是否已完成發生錯誤：", error); 
            });

            // 放入測驗名稱,說明
            $scope.test = {};
            $scope.test.Name = $stateParams.TestName;
            $scope.test.Content = $stateParams.TestContent;

            // 放正確答案
            $scope.rightAnswer = [];

            // 宣告計時器 答對題數
            var x,GradeNum=0; 
            
            // 完成測驗 fun
            function testCallBack(isFinish) {
                // 關閉計時器
                clearInterval(x);
                // 是否全部完成
                if (isFinish) {
                    // 對答案算成績
                    for (let index = 1; index <= $scope.rightAnswer.length; index++) {
                        console.log($scope.rightAnswer[index-1],$scope.answer[index]);
                        if ($scope.rightAnswer[index-1]==$scope.answer[index]) {
                            GradeNum+=1;
                        }
                        // 最後一筆結算成績
                        if (index>=$scope.rightAnswer.length) {
                            // 如果全對 給100分
                            if (GradeNum==$scope.rightAnswer.length) {
                                $scope.test.Grade = 100;
                            } else {
                                // 計算得分
                                $scope.test.Grade = GradeNum * Math.round(100/$scope.rightAnswer.length);
                            }
                        }
                    }
                    // 回傳填答結果
                    $scope.response = [{Grade:$scope.test.Grade,answer:$scope.answer}];
                    // 標記已完成 - 取得已完成名單
                    db.collection("課程任務").doc(ClassID).collection("任務列表").doc(TestID)
                    .get().then(function(results) {
                        var name = results.data().Name;
                        var point = results.data().Point;
                        var a = results.data().finished;
                        a.push(StuID);
                        // 標記已完成 - 更新已完成名單
                        db.collection("課程任務").doc(ClassID).collection("任務列表").doc(TestID)
                        .update({
                            finished: a
                        })
                        .then(function() {
                            console.log("更新已完成名單成功");
                            // 防作弊 - 檢查是否已加分
                            db.collection("點數").doc(ClassID).collection(StuID).doc("點數歷程記錄").collection("點數歷程記錄").where("check", "==", TestID)
                            .get().then(function(results) {
                                if(results.empty) {
                                    console.log("第一次拿獎勵"); 
                                    // 加分 - 上傳伺服器
                                    db.collection("點數").doc(ClassID).collection(StuID).doc("點數歷程記錄").collection("點數歷程記錄")
                                    .add({
                                        content: '完成任務：'+name,
                                        point: paswLock(point),
                                        check: TestID,
                                        time: new Date()
                                    })
                                    .then(function(data) {
                                        console.log("加分 - 上傳伺服器成功");
                                    })
                                    .catch(function(error) {
                                        console.error("加分 - 上傳伺服器失敗：", error);
                                    });
                                } else {
                                    console.log("已拿過此獎勵");
                                    // 系統紀錄 - 通報伺服器
                                    db.collection("系統記錄").doc(ClassID).collection("資安回報")
                                    .add({
                                        StuID: StuID,
                                        Content: '已拿過'+TestID+'獎勵',
                                        time: new Date()
                                    })
                                    .then(function(data) {
                                        console.log("通報伺服器成功");
                                    })
                                    .catch(function(error) {
                                        console.error("通報伺服器失敗：", error);
                                    });
                                }
                            }).catch(function(error) { 
                                console.log("防作弊 - 檢查是否已加分發生錯誤：", error); 
                            });
                            $scope.$apply(); //重新監聽view
                        })
                        .catch(function(error) {
                            console.error("更新已完成名單失敗", error);
                        });
                    }).catch(function(error) { 
                        console.log("取得已完成名單發生錯誤：", error); 
                    });
                } else {
                    // 判斷不是空值才回傳
                    if (!$scope.answer) {
                        $scope.response = [];
                    } else {
                        // 僅回傳備份
                        $scope.response = [{answer:$scope.answer}];
                    }
                }
                // 回傳
                db.collection("課程任務").doc(ClassID).collection("任務列表").doc(TestID).collection("填答結果").doc(StuID)
                .set({
                    StuID: StuID,
                    missionID: TestID,
                    response: $scope.response,
                    time: new Date()
                })
                .then(function(data) {
                    console.log("回傳填答結果成功");
                })
                .catch(function(error) {
                    console.error("回傳填答結果失敗：", error);
                });
            }

            // 預設在題目1
            $scope.search = 'fkozq65K題目：01';
            // 預設第一題的按鈕
            $scope.pageUpShow = false;
            $scope.pageDownShow = true;
            $scope.FinishBtnShow = false;

            // 監聽 - 取得測驗資料
            $scope.testStart = false;
            $scope.testContent = true;
            $scope.testOver = true;
            db.collection("IRS").doc(ClassID).collection("測驗列表").doc(TestID)
            .onSnapshot(function(doc) {
                // 取得測驗時間
                const second = 1000,
                    minute = second * 60,
                    hour = minute * 60;
                var distance = doc.data().stageTime; //取得每階段測驗時間 ms

                // 補 0 fun
                function GetZero(num) {
                    if (num<=9) {
                        return '0'+String(num);
                    } else {
                        return num;
                    }
                }
                // 放入顯示剩餘時間
                $scope.distance = GetZero(Math.floor(distance / (hour)))+":"+GetZero(Math.floor((distance % (hour)) / (minute)))+":"+GetZero(Math.floor((distance % (minute)) / second));

                // 判斷是否開始測驗
                if (doc.data().testStart) {
                    // 載入題庫
                    $scope.questions = doc.data().questions;

                    // 存入正確答案
                    for (let index = 0; index < $scope.questions.length; index++) {
                        $scope.rightAnswer[index] = $scope.questions[index].answer;
                    }
                    
                    // 亂數排序
                    var res = [];
                    for (var i = 0, len = $scope.questions.length; i < len; i++) {
                        // 隨機找題
                        var randomIndex = Math.floor(Math.random() * $scope.questions.length);
                        // 放到新隊伍
                        res[i] = $scope.questions[randomIndex];
                        // 原本隊伍人越來越少，因此randomIndex需要一直抓$scope.questions.length
                        $scope.questions.splice(randomIndex, 1);
                    }
                    $scope.questions = res;
                    
                    // 放入題目標籤
                    for (let index = 1; index <= $scope.questions.length; index++) {
                        var a;
                        if (index<=9) {
                            a = '0'+index;
                        }
                        $scope.questions[index-1].search = 'fkozq65K題目：'+a;
                    }

                    // 隱藏界面
                    $scope.testStart = true;
                    $scope.testContent = false;
                    $scope.pageUpDownShow = true;
                    $scope.$apply(); //重新監聽view

                    // 倒數計時
                    x = setInterval(function() {
                        distance = distance - 1000;
                        $scope.distance = GetZero(Math.floor(distance / (hour)))+":"+GetZero(Math.floor((distance % (hour)) / (minute)))+":"+GetZero(Math.floor((distance % (minute)) / second));                
                        $scope.$apply(); //重新監聽view
                        
                        //判斷時間到 並且 還沒按完成
                        if (distance <= 0 && $scope.testOver==true) {
                            // 呼叫回傳測驗 fun
                            testCallBack(true);

                            // 隱藏界面
                            $scope.testStart = true;
                            $scope.testContent = true;
                            $scope.testOver = false;
                            $scope.pageUpDownShow = false;
                            $ionicScrollDelegate.scrollTop(); //滑到最上面
                            $scope.$apply(); //重新監聽view
                        }
                    }, second);
                } else {
                    // 呼叫回傳測驗 fun
                    testCallBack(false);

                    // 隱藏界面
                    $scope.testStart = false;       
                    $scope.testContent = true;
                    $scope.testOver = true;
                    $scope.pageUpDownShow = false;
                    $ionicScrollDelegate.scrollTop(); //滑到最上面
                    $scope.$apply(); //重新監聽view
                }
            },function(error) {
                console.error("取得測驗資料發生錯誤：", error);
            });

            // 按上一題或下一題
            $scope.pageUp = function(Up){
                if (Up) {
                    // 上一題
                    var a = parseInt($scope.search.substr(11))-1;
                    if (a<=9) {
                        a = '0'+a;
                    }
                    $scope.search = 'fkozq65K題目：'+a;
                } else {
                    // 下一題
                    var a = parseInt($scope.search.substr(11))+1;
                    if (a<=9) {
                        a = '0'+a;
                    }
                    $scope.search = 'fkozq65K題目：'+a;
                }
                // 取得最後一題題號
                var a = $scope.questions.length;
                if (a<=9) {
                    a = '0'+a;
                }
                // 判斷是否第一或最後一題
                if ($scope.search=='fkozq65K題目：01') {
                    $scope.pageUpShow = false;
                    $scope.pageDownShow = true;
                    $scope.FinishBtnShow = false;
                } else if ($scope.search=='fkozq65K題目：'+a) {
                    $scope.pageUpShow = true;
                    $scope.pageDownShow = false;
                    $scope.FinishBtnShow = true;
                } else {
                    $scope.pageUpShow = true;
                    $scope.pageDownShow = true;
                    $scope.FinishBtnShow = false;
                }
                // 暫存到伺服器
                // 呼叫回傳測驗 fun
                testCallBack(false);
            };

            // 按完成按鈕
            $scope.testFinishBtn = function(){
                // 呼叫回傳測驗 fun
                testCallBack(true);

                // 隱藏界面
                $scope.testStart = true;
                $scope.testContent = true;
                $scope.testOver = false;
                $scope.pageUpDownShow = false;
                $ionicScrollDelegate.scrollTop(); //滑到最上面
            };

            // 每次點選項，更新結果檔和進度條
            $scope.answerChange = function(answer){
                ary = new Array();
                for(x in answer) ary[ary.length]=x;
                $scope.answer = answer;
                $scope.answerAry = ary;
            };

        }else{
            console.log("尚未登入");
            $state.go("login");
            // window.location.reload();
        }
    });
}])

// ----------------------------------------腦力激盪頁面----------------------------------------
.controller('brainstormingCtrl', ['$scope', '$stateParams', '$state', '$ionicScrollDelegate', '$ionicLoading', '$ionicPopup',
function ($scope, $stateParams, $state, $ionicScrollDelegate, $ionicLoading, $ionicPopup) {
    var db = firebase.firestore();
    // 驗證登入
    firebase.auth().onAuthStateChanged((user) => {
        if (user) { //登入成功，取得使用者
            console.log("已登入狀態");
            var StuID = user.email.substring(0,user.email.indexOf("@")).toUpperCase();
            var StuName = localStorage.getItem("StuName");
            var ClassID = localStorage.getItem("ClassID");
            var GroupID = localStorage.getItem("GroupID");

            // 預設在頁籤1
            $scope.search = 'fkozq65K頁籤：'+1;
            // 頁籤控制
            $scope.tabs = function(number) {
                if (number=='+') {
                    // 不給新增超過10頁
                    if ($scope.tabsCounts.length>=10) {
                        $ionicPopup.confirm({
                            title: '新增分頁',
                            template: '分頁已到上限(10頁)。',
                            buttons: [{
                                text: '好的',
                                type: 'button-chanry1',
                                onTap: function(e) {
                                }
                            }]
                        });
                    } else {
                        $ionicPopup.confirm({
                            title: '新增分頁',
                            template: '確定要新增嗎?',
                            subTitle: '注意：新增後無法刪除，上限為10個分頁。',
                            buttons: [{
                                text: '取消',
                                type: 'button-default',
                                onTap: function(e) {
                                    console.log('選擇取消');
                                }
                            }, {
                                text: '確定',
                                type: 'button-chanry1',
                                onTap: function(e) {
                                    console.log('選擇新增');
                                    // 新增分頁
                                    db.collection("腦力激盪").doc(ClassID).collection(GroupID).doc("頁籤")
                                    .update({
                                        count: $scope.tabsCounts.length+1
                                    })
                                    .then(function() {
                                        console.log("新增分頁成功");
                                    })
                                    .catch(function(error) {
                                        console.error("新增分頁失敗", error);
                                    });
                                }
                            }]
                        });
                    }
                    
                } else {
                    // 設定filters
                    $scope.search = 'fkozq65K頁籤：'+number;
                    // 用findIndex找出要刪除的位置
                    var indexNum = $scope.tabsCounts.findIndex((element)=>{
                        return (element.active === true);
                    });
                    // 替換class - 原頁面
                    $scope.tabsCounts[indexNum].num = indexNum+1;
                    $scope.tabsCounts[indexNum].active = false;
                    // 替換class - 新頁面
                    $scope.tabsCounts[number-1].num = number;
                    $scope.tabsCounts[number-1].active = true;

                    $ionicScrollDelegate.scrollBottom(); //滑到最下面
                }
            }
            // 監聽 - 頁籤數
            db.collection("腦力激盪").doc(ClassID).collection(GroupID).doc("頁籤")
            .onSnapshot(function(doc) {
                if (doc.exists) {
                    $scope.tabsCounts = [];
                    for (let index = 1; index <= doc.data().count; index++) {
                        if (index==1) {
                            $scope.tabsCounts.push({num:index,active:true});
                        } else {
                            $scope.tabsCounts.push({num:index,active:false});
                        }
                    }
                    $scope.$apply(); //重新監聽view
                } else {
                    // 初始化分頁
                    db.collection("腦力激盪").doc(ClassID).collection(GroupID).doc("頁籤")
                    .set({
                        count: 3
                    })
                    .then(function() {
                        console.log("初始化分頁成功");
                    })
                    .catch(function(error) {
                        console.error("初始化分頁失敗", error);
                    });
                }
            });

            $scope.items = [];
            // 監聽 - 腦力激盪內容
            db.collection("腦力激盪").doc(ClassID).collection(GroupID).orderBy("time","asc")
            .onSnapshot({
                includeMetadataChanges: true
            }, function(querySnapshot) {
                querySnapshot.docChanges().forEach(function(change) {
                    if (change.type === "added") {
                        // 判斷有無按過讚
                        var a = change.doc.data();
                        a.ID = change.doc.id;
                        if (a.like.indexOf(StuID)!=-1) {
                            a.likeBtn = true;
                        } else {
                            a.likeBtn = false;  
                        }
                        $scope.items.push(a);
                        $scope.$apply(); //重新監聽view
                        $ionicScrollDelegate.scrollBottom(); //滑到最下面
                        console.log("新增: ", a);
                    }
                    if (change.type === "modified") {
                        // 判斷有無按過讚
                        var a = change.doc.data();
                        a.ID = change.doc.id;
                        if (a.like.indexOf(StuID)!=-1) {
                            a.likeBtn = true;
                        } else {
                            a.likeBtn = false;  
                        }
                        // 用findIndex找出要刪除的位置
                        var indexNum = $scope.items.findIndex((element)=>{
                            return (element.time.seconds === change.doc.data().time.seconds) & (element.time.nanoseconds === change.doc.data().time.nanoseconds);
                        });
                        if (indexNum!=-1) {
                            // 刪掉舊的 並插入新的
                            $scope.items.splice(indexNum,1,a);
                            console.log("修改列表成功");
                        }else{
                            console.log("修改列表不成功");
                        }
                        $scope.$apply(); //重新監聽view
                        console.log("修改: ", change.doc.data());
                    }
                    if (change.type === "removed") {
                        console.log("刪除: ", change.doc.data());
                        // 用findIndex找出要刪除的位置
                        var indexNum = $scope.items.findIndex((element)=>{
                            return (element.time.seconds === change.doc.data().time.seconds) & (element.time.nanoseconds === change.doc.data().time.nanoseconds);
                        });
                        if (indexNum!=-1) {
                            $scope.items.splice(indexNum,1);
                            console.log("刪除列表成功");
                        }else{
                            console.log("刪除列表不成功");
                        }
                        $scope.$apply(); //重新監聽view
                    }
                });
            });
            
            // 新增腦力激盪
            $scope.add = function() {
                $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner><p>新增中...</p>'});
                if ($scope.input!=undefined && $scope.input!="") {
                    db.collection("腦力激盪").doc(ClassID).collection(GroupID)
                    .add({
                        StuID: StuID,
                        StuName: StuName,
                        msg: $scope.input,
                        like: [],
                        invited: false,
                        search: $scope.search,
                        time: new Date()
                    })
                    .then(function(data) {
                        console.log("新增腦力激盪成功");
                        // 更新小任務 自己腦力激盪次數
                        db.collection("腦力激盪").doc(ClassID).collection(GroupID).where("StuID", "==", StuID)
                        .get().then(function(results) {
                            // 更新小任務進度
                            db.collection("點數").doc(ClassID).collection(StuID).doc("小任務進度").collection("小任務進度").doc("SmallTask2_3")
                            .set({
                                schedule: results.size,
                                time: new Date()
                            })
                            .then(function(data) {
                                console.log("更新小任務進度成功");
                            })
                            .catch(function(error) {
                                console.error("更新小任務進度失敗：", error);
                            });
                        }).catch(function(error) { 
                            console.log("更新小任務 自己腦力激盪次數發生錯誤：", error); 
                        });
                        // 更新教師主控台
                        db.collection("腦力激盪").doc(ClassID)
                        .set({
                            update: new Date()
                        })
                        .then(function(data) {
                            console.log("更新教師主控台成功");
                        })
                        .catch(function(error) {
                            console.error("更新教師主控台失敗：", error);
                        });
                    })
                    .catch(function(error) {
                        console.error("新增腦力激盪失敗：", error);
                    });
                    $scope.input = "";
                }
                $ionicLoading.hide();
            };

            // 刪除腦力激盪
            $scope.Delete = function(item) {
                $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner><p>刪除中...</p>'});
                var query = db.collection("腦力激盪").doc(ClassID).collection(GroupID).where("time", "==", item.time);
                query.get().then(function (querySnapshot) {
                    querySnapshot.forEach(function (doc) {
                        db.collection("腦力激盪").doc(ClassID).collection(GroupID).doc(doc.id)
                        .delete().then(function () {
                            console.log("刪除腦力激盪成功");
                        }).catch(function(error) {
                            console.error("刪除腦力激盪失敗：", error);
                        });
                    });
                });
                $ionicLoading.hide();
            };

            // 按讚
            $scope.like = function(item) {
                if (item.likeBtn == true) {
                    // 更新按讚狀態
                    item.like.splice(item.like.indexOf(StuID),1);
                    db.collection("腦力激盪").doc(ClassID).collection(GroupID).doc(item.ID)
                    .update({
                        like: item.like
                    })
                    .then(function(data) {
                        console.log("更新按讚狀態成功");
                    })
                    .catch(function(error) {
                        console.error("更新按讚狀態失敗：", error);
                    });
                    // 取得目前次數
                    db.collection("點數").doc(ClassID).collection(StuID).doc("小任務進度").collection("小任務進度").doc("SmallTask4")
                    .get().then(function(results) {
                        console.log("減少按讚次數");
                        // 更新小任務進度
                        db.collection("點數").doc(ClassID).collection(StuID).doc("小任務進度").collection("小任務進度").doc("SmallTask4")
                        .update({
                            schedule: results.data().schedule-1,
                            time: new Date()
                        })
                        .then(function(data) {
                            console.log("更新小任務進度成功");
                        })
                        .catch(function(error) {
                            console.error("更新小任務進度失敗：", error);
                        });
                    }).catch(function(error) { 
                        console.log("取得目前次數發生錯誤：", error); 
                    });
                } else {
                    // 更新按讚狀態
                    item.like.push(StuID);
                    db.collection("腦力激盪").doc(ClassID).collection(GroupID).doc(item.ID)
                    .update({
                        like: item.like
                    })
                    .then(function(data) {
                        console.log("更新按讚狀態成功");

                    })
                    .catch(function(error) {
                        console.error("更新按讚狀態失敗：", error);
                    });
                    // 取得目前次數
                    db.collection("點數").doc(ClassID).collection(StuID).doc("小任務進度").collection("小任務進度").doc("SmallTask4")
                    .get().then(function(results) {
                        if(!results.exists) {
                            console.log("第一次按讚");
                            // 更新小任務進度
                            db.collection("點數").doc(ClassID).collection(StuID).doc("小任務進度").collection("小任務進度").doc("SmallTask4")
                            .set({
                                schedule: 1,
                                time: new Date()
                            })
                            .then(function(data) {
                                console.log("更新小任務進度成功");
                            })
                            .catch(function(error) {
                                console.error("更新小任務進度失敗：", error);
                            });
                        } else {
                            console.log("增加按讚次數");
                            // 更新小任務進度
                            db.collection("點數").doc(ClassID).collection(StuID).doc("小任務進度").collection("小任務進度").doc("SmallTask4")
                            .update({
                                schedule: results.data().schedule+1,
                                time: new Date()
                            })
                            .then(function(data) {
                                console.log("更新小任務進度成功");
                            })
                            .catch(function(error) {
                                console.error("更新小任務進度失敗：", error);
                            });
                        }
                    }).catch(function(error) { 
                        console.log("取得目前次數發生錯誤：", error); 
                    });
                }
            };

            // 判斷組長
            db.collection("分組").doc(ClassID).collection("group").where("leader", "==", StuID)
            .get().then(function(results) {
                if(results.empty) {
                    console.log("你非組長"); 
                    $scope.DelAllBtnShow = false;
                } else {
                    console.log("你是組長");
                    $scope.DelAllBtnShow = true;
                }
            }).catch(function(error) { 
                console.log("判斷組長發生錯誤：", error); 
            });

            // 清空按鈕
            $scope.DelAllBtn = function() {
                $ionicPopup.confirm({
                    title: '清空腦力激盪資料',
                    template: '確定要清空嗎?',
                    subTitle: '注意：清空會刪除全體組員腦力激盪資料。',
                    buttons: [{
                        text: '取消',
                        type: 'button-default',
                        onTap: function(e) {
                            console.log('選擇取消');
                        }
                    }, {
                        text: '確定',
                        type: 'button-chanry1',
                        onTap: function(e) {
                            console.log('選擇清空');
                            // 取得全部訊息
                            db.collection("腦力激盪").doc(ClassID).collection(GroupID)
                            .get().then(function(results) {
                                results.forEach(function (doc) {
                                    db.collection("腦力激盪").doc(ClassID).collection(GroupID).doc(doc.id)
                                    .delete().then(function () {
                                        console.log("刪除腦力激盪成功");
                                    }).catch(function(error) {
                                        console.error("刪除腦力激盪失敗：", error);
                                    });
                                });
                            }).catch(function(error) { 
                                console.log("查詢全部訊息發生錯誤：", error); 
                            });
                        }
                    }]
                });
            };

        }else{
            console.log("尚未登入");
            $state.go("login");
            // window.location.reload();
        }
    });
}])

// ----------------------------------------提案聚焦頁面----------------------------------------
.controller('proposalCtrl', ['$scope', '$stateParams', '$state', '$ionicPopup', '$ionicLoading', '$ionicScrollDelegate',
function ($scope, $stateParams, $state, $ionicPopup, $ionicLoading, $ionicScrollDelegate) {
    var db = firebase.firestore();
    // 驗證登入
    firebase.auth().onAuthStateChanged((user) => {
        if (user) { //登入成功，取得使用者
            console.log("已登入狀態");
            var StuID = user.email.substring(0,user.email.indexOf("@")).toUpperCase();
            var StuName = localStorage.getItem("StuName");
            var ClassID = localStorage.getItem("ClassID");
            var GroupID = localStorage.getItem("GroupID");
            
            // 判斷組長
            db.collection("分組").doc(ClassID).collection("group").where("leader", "==", StuID)
            .get().then(function(results) {
                if(results.empty) {
                    console.log("你非組長"); 
                    $scope.leaderGroupShow = false;
                } else {
                    console.log("你是組長");
                    $scope.leaderGroupShow = true;
                }
            }).catch(function(error) { 
                console.log("判斷組長發生錯誤：", error); 
            });

            $scope.items = [];
            // 監聽 - 提案聚焦內容
            db.collection("提案聚焦").doc(ClassID).collection(GroupID).orderBy("time","asc")
            .onSnapshot({
                includeMetadataChanges: true
            }, function(querySnapshot) {
                querySnapshot.docChanges().forEach(function(change) {
                    if (change.type === "added") {
                        var a = change.doc.data();
                        var b = [];
                        // 找出腦力激盪內容
                        a.brainstorming.forEach(function(brainstormingID) {
                            db.collection("腦力激盪").doc(ClassID).collection(GroupID).doc(brainstormingID)
                            .get().then(function(results) {
                                b.push(results.data());
                                $scope.$apply(); //重新監聽view
                            }).catch(function(error) { 
                                console.log("腦力激盪內容發生錯誤：", error); 
                            });
                        });

                        // 判斷bellBadge是否有自己
                        var c = false;
                        if (change.doc.data().bellBadge.indexOf(StuID)!=-1) {
                            var c = true;
                        }
                        
                        // 放入資料
                        $scope.items.push({
                            ProposalName:a.ProposalName,
                            brainstorming:b,
                            bellBadge:c,
                            time:a.time
                        });

                        $ionicScrollDelegate.scrollBottom(); //滑到最下面
                        console.log("新增: ", $scope.items);
                    } else if (change.type === "modified") {
                        console.log("修改: ", change.doc.data());
                        var a = change.doc.data();
                        var b = [];
                        // 找出腦力激盪內容
                        a.brainstorming.forEach(function(brainstormingID) {
                            db.collection("腦力激盪").doc(ClassID).collection(GroupID).doc(brainstormingID)
                            .get().then(function(results) {
                                b.push(results.data());
                                $scope.$apply(); //重新監聽view
                            }).catch(function(error) { 
                                console.log("腦力激盪內容發生錯誤：", error); 
                            });
                        });

                        // 修改腦力激盪內容
                        a.brainstorming = b;
                        // 判斷bellBadge是否有自己
                        if (a.bellBadge.indexOf(StuID)!=-1) {
                            a.bellBadge = true;
                        }

                        // 用findIndex找出要修改的位置
                        var indexNum = $scope.items.findIndex((element)=>{
                            return (element.time.seconds === change.doc.data().time.seconds) & (element.time.nanoseconds === change.doc.data().time.nanoseconds);
                        });

                        if (indexNum!=-1) {
                            // 刪掉舊的 並插入新的
                            $scope.items.splice(indexNum,1,a);
                            console.log("修改列表成功");
                        }else{
                            console.log("修改列表不成功");
                        }

                        $scope.$apply(); //重新監聽view
                        console.log("修改: ", $scope.items);
                    } else if (change.type === "removed") {
                        console.log("刪除: ", change.doc.data());
                        // 用findIndex找出要刪除的位置
                        var indexNum = $scope.items.findIndex((element)=>{
                            return (element.time.seconds === change.doc.data().time.seconds) & (element.time.nanoseconds === change.doc.data().time.nanoseconds);
                        });
                        // 刪除
                        if (indexNum!=-1) {
                            $scope.items.splice(indexNum,1);
                            console.log("刪除列表成功");
                        }else{
                            console.log("刪除列表不成功");
                        }
                        $scope.$apply(); //重新監聽view
                    }
                });
            });

            $scope.bells = []; // 宣告全域
            var unsubscribe;
            var proposalID = "";
            // 點擊bell
            $scope.bellProposal = function(time) {
                $scope.bells = []; // 清空重載
                // 載入建議 
                $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner><p>載入建議中...</p>'});
                // 取得提案ID
                db.collection("提案聚焦").doc(ClassID).collection(GroupID).where("time", "==", time)
                .get().then(function(results) {
                    results.forEach(function (doc) {
                        proposalID = doc.id;
                        // 監聽 - 取得建議
                        unsubscribe = db.collection("提案聚焦").doc(ClassID).collection(GroupID).doc(proposalID).collection("建議").where("solve", "==", false)
                        .onSnapshot(function(results) {
                            if (results.empty) {
                                console.log("目前無建議");
                                $scope.bells = [];
                                // ................................
                                $ionicLoading.hide();
                            } else {
                                var a = results.docs.length;
                                var count = 0;
                                results.docChanges().forEach(function(change) {
                                    // 新增
                                    if (change.type === "added") {
                                        var bellBrainstorming = [];
                                        // 取得腦力激盪內容
                                        change.doc.data().brainstorming.forEach(function (doc) {
                                            var brainstormingID = doc;
                                            // 取得腦力激盪內容
                                            db.collection("腦力激盪").doc(ClassID).collection(GroupID).doc(brainstormingID)
                                            .get().then(function(doc) {
                                                bellBrainstorming.push({
                                                    brainstormingID:doc.id,
                                                    msg:doc.data().msg
                                                });
                                                $scope.$apply(); //重新監聽view
                                            }).catch(function(error) { 
                                                console.log("取得腦力激盪內容發生錯誤：", error); 
                                            });
                                        });

                                        // 初始化選擇
                                        var voteChooseN = false;
                                        var voteChooseY = false;
                                        // 如果自己有在voteN裡面 or在voteY裡面
                                        if (change.doc.data().voteN.indexOf(StuID)!=-1) {
                                            voteChooseN = true;
                                        } else if (change.doc.data().voteY.indexOf(StuID)!=-1) {
                                            voteChooseY = true;
                                        }
                                        
                                        // 放入提案ID和腦力激盪內容
                                        $scope.bells.push({
                                            bellID:change.doc.id,
                                            StuID:change.doc.data().StuID,
                                            bellTime:change.doc.data().time,
                                            voteN:change.doc.data().voteN,
                                            voteY:change.doc.data().voteY,
                                            voteChooseN:voteChooseN,
                                            voteChooseY:voteChooseY,
                                            time:change.doc.data().time,
                                            bellBrainstorming:bellBrainstorming
                                        });

                                        // 判斷最後一筆關閉轉圈圈
                                        count++;
                                        if (count==a) {
                                            $ionicLoading.hide();
                                        }
                                        $scope.$apply(); //重新監聽view
                                        console.log("新增：", change.doc.data());
                                    }
                                    // 修改 - 更新票數
                                    if (change.type === "modified") {
                                        // 初始化選擇
                                        var voteChooseN = false;
                                        var voteChooseY = false;
                                        // 如果自己有在voteN裡面 or在voteY裡面
                                        if (change.doc.data().voteN.indexOf(StuID)!=-1) {
                                            voteChooseN = true;
                                        } else if (change.doc.data().voteY.indexOf(StuID)!=-1) {
                                            voteChooseY = true;
                                        }
                                        
                                        // 用findIndex找出位置
                                        var indexNum = $scope.bells.findIndex((element)=>{
                                            return (element.bellID === change.doc.id);
                                        });

                                        // 更新票數
                                        $scope.bells[indexNum].voteN = change.doc.data().voteN;
                                        $scope.bells[indexNum].voteY = change.doc.data().voteY;
                                        $scope.bells[indexNum].voteChooseN = voteChooseN;
                                        $scope.bells[indexNum].voteChooseY = voteChooseY;

                                        $scope.$apply(); //重新監聽view
                                        console.log("修改：", change.doc.data());
                                    }
                                    // 刪除
                                    if (change.type === "removed") {
                                        // 用findIndex找出要刪除的位置
                                        var indexNum = $scope.bells.findIndex((element)=>{
                                            return (element.time.seconds === change.doc.data().time.seconds) & (element.time.nanoseconds === change.doc.data().time.nanoseconds);
                                        });
                                        // 刪除
                                        if (indexNum!=-1) {
                                            $scope.bells.splice(indexNum,1);
                                            console.log("刪除列表成功");
                                        }else{
                                            console.log("刪除列表不成功");
                                        }
                                        $scope.$apply(); //重新監聽view
                                        console.log("刪除：", change.doc.data());
                                    }
                                });
                            }
                        },function(error) {
                            console.log("取得建議發生錯誤：", error); 
                        });

                        // 判斷未讀名單是否有自己
                        if (doc.data().bellBadge.indexOf(StuID)!=-1) {
                            // 將紅點關閉 - 刪除自己
                            var a = doc.data();
                            a.bellBadge.splice(a.bellBadge.indexOf(StuID),1);
                            // 將紅點關閉 - 更新提案
                            db.collection("提案聚焦").doc(ClassID).collection(GroupID).doc(proposalID)
                            .update({
                                bellBadge: a.bellBadge,
                            })
                            .then(function(data) {
                                console.log("將紅點關閉 - 更新提案成功");
                            })
                            .catch(function(error) {
                                console.error("將紅點關閉 - 更新提案失敗：", error);
                            });
                        }
                    });  
                }).catch(function(error) { 
                    console.log("取得提案ID發生錯誤：", error); 
                });

                // 跳出泡泡
                $ionicPopup.show({
                    title: '組員建議之腦力激盪',
                    subTitle: '請進行投票，贊成過半自動成立，反之否決建議。',
                    template: 
                    '<div ng-repeat="bell in bells | orderBy:'+"'time'"+'">'+
                        '<div class="item item-divider">【匿名】建議加入以下腦力激盪</div>'+
                        '<div ng-repeat="bellBrainstorming in bell.bellBrainstorming">'+
                            '<div class="item">{{$index+1}}.{{bellBrainstorming.msg}}</div>'+
                        '</div>'+
                        '<div class="item vote">'+
                            '<div class="voteN" style="width:{{bell.voteN.length / (bell.voteN.length + bell.voteY.length) * 100}}%"></div>'+
                            '<span class="votespan" style="left:16px;">反對：{{bell.voteN.length}}</span>'+
                            '<span class="votespan" style="right:16px;">贊成：{{bell.voteY.length}}</span>'+
                        '</div>'+
                        '<div class="item row VoteHeight">'+
                            '<div class="col col-50">'+
                                '<i ng-click="votebtn('+"'N'"+',bell.bellID,bell.StuID)" ng-class="{true:'+"'voteChooseN'"+',false:'+"'voteNbtn'"+'}[bell.voteChooseN]" ></i>'+
                            '</div>'+
                            '<div class="col col-50">'+
                                '<i ng-click="votebtn('+"'Y'"+',bell.bellID,bell.StuID)" ng-class="{true:'+"'voteChooseY'"+',false:'+"'voteYbtn'"+'}[bell.voteChooseY]" ></i>'+
                            '</div>'+
                        '</div>'+
                        '<div class="spacer" style="height: 20px;"></div>'+
                    '</div>',
                    scope: $scope,
                    buttons: [{
                        text: '關閉',
                        type: 'button-chanry1',
                        onTap: function(e) {
                            console.log('選擇關閉');
                            // 關閉監聽
                            unsubscribe();
                        }
                    }]
                });
            };

            // 點擊votebtn
            $scope.votebtn = function(NorY,bellID,bell_StuID) {
                // 用findIndex找出位置
                var indexNum = $scope.bells.findIndex((element)=>{
                    return (element.bellID === bellID);
                });
                if (indexNum!=-1) {
                    // 判斷按鈕  
                    if (NorY=='N') {
                        // 判斷N是否投過
                        if ($scope.bells[indexNum].voteN.indexOf(StuID)!=-1) {
                            // 有投過 刪除自己
                            $scope.bells[indexNum].voteN.splice($scope.bells[indexNum].voteN.indexOf(StuID),1);
                            $scope.bells[indexNum].voteChooseN = false;
                        } else {
                            // 沒投過 新增自己
                            $scope.bells[indexNum].voteN.push(StuID);
                            $scope.bells[indexNum].voteChooseN = true;
                            // 如果Y有自己就刪除
                            if ($scope.bells[indexNum].voteY.indexOf(StuID)!=-1) {
                                // 清除Y的自己
                                $scope.bells[indexNum].voteY.splice($scope.bells[indexNum].voteY.indexOf(StuID),1);
                                $scope.bells[indexNum].voteChooseY = false;
                            }
                        }
                    } else if (NorY=='Y') {
                        // 判斷Y是否投過
                        if ($scope.bells[indexNum].voteY.indexOf(StuID)!=-1) {
                            // 有投過 刪除自己
                            $scope.bells[indexNum].voteY.splice($scope.bells[indexNum].voteY.indexOf(StuID),1);
                            $scope.bells[indexNum].voteChooseY = false;
                        } else {
                            // 沒投過 新增自己
                            $scope.bells[indexNum].voteY.push(StuID);
                            $scope.bells[indexNum].voteChooseY = true;
                            // 如果N有自己就刪除
                            if ($scope.bells[indexNum].voteN.indexOf(StuID)!=-1) {
                                // 清除N的自己
                                $scope.bells[indexNum].voteN.splice($scope.bells[indexNum].voteN.indexOf(StuID),1);
                                $scope.bells[indexNum].voteChooseN = false;
                            }
                        }
                    }

                    // 判斷是否過半數
                    // 取得組員人數
                    db.collection("分組").doc(ClassID).collection("group").doc(GroupID)
                    .get().then(function(doc) {
                        var membersLength = doc.data().members.length;
                        if ($scope.bells[indexNum].voteN.length > membersLength/2 || ($scope.bells[indexNum].voteN.length == $scope.bells[indexNum].voteY.length && $scope.bells[indexNum].voteY.length == membersLength/2)) {
                            console.log("否決建議or平手");
                            // 關閉建議
                            db.collection("提案聚焦").doc(ClassID).collection(GroupID).doc(proposalID).collection("建議").doc(bellID)
                            .update({
                                solve: true,
                            })
                            .then(function(data) {
                                console.log("關閉建議成功");
                                $scope.$apply(); //重新監聽view
                            })
                            .catch(function(error) {
                                console.error("關閉建議失敗：", error);
                            });
                        } else if ($scope.bells[indexNum].voteY.length > membersLength/2) {
                            console.log("建議成立");
                            // 取得提案聚焦內腦力激盪陣列
                            db.collection("提案聚焦").doc(ClassID).collection(GroupID).doc(proposalID)
                            .get().then(function(doc) {
                                // 整理bell內的腦力激盪陣列
                                var bellBrainstorming = [];
                                $scope.bells[indexNum].bellBrainstorming.forEach(function (doc) {
                                    bellBrainstorming.push(doc.brainstormingID);
                                });
                                // 相加兩陣列 不重複
                                var a = doc.data().brainstorming.concat(bellBrainstorming).concat();//使用concat()再複製一份陣列，避免影響原陣列
                                for(var i=0; i<a.length; ++i) {
                                    for(var j=i+1; j<a.length; ++j) {
                                        if(a[i] === a[j])
                                            a.splice(j, 1);
                                    }
                                }
                                // 更新提案
                                db.collection("提案聚焦").doc(ClassID).collection(GroupID).doc(proposalID)
                                .update({
                                    brainstorming: a
                                })
                                .then(function(data) {
                                    console.log("更新提案成功");
                                    // 標記提案已加入
                                    bellBrainstorming.forEach(function (brainstormingID) {
                                        db.collection("腦力激盪").doc(ClassID).collection(GroupID).doc(brainstormingID)
                                        .update({
                                            invited: true
                                        })
                                        .then(function(data) {
                                            console.log("標記提案成功");
                                        })
                                        .catch(function(error) {
                                            console.error("標記提案失敗：", error);
                                        });
                                        // 關閉建議
                                        db.collection("提案聚焦").doc(ClassID).collection(GroupID).doc(proposalID).collection("建議").doc(bellID)
                                        .update({
                                            solve: true,
                                        })
                                        .then(function(data) {
                                            console.log("關閉建議成功");
                                            $scope.$apply(); //重新監聽view
                                        })
                                        .catch(function(error) {
                                            console.error("關閉建議失敗：", error);
                                        });
                                    });
                                })
                                .catch(function(error) {
                                    console.error("更新提案失敗：", error);
                                });
                            }).catch(function(error) { 
                                console.log("取得提案聚焦內腦力激盪陣列發生錯誤：", error); 
                            });
                            // 取得目前次數
                            db.collection("點數").doc(ClassID).collection(bell_StuID).doc("小任務進度").collection("小任務進度").doc("SmallTask7")
                            .get().then(function(results) {
                                if(!results.exists) {
                                    console.log("第一次建議成立");
                                    // 更新小任務進度
                                    db.collection("點數").doc(ClassID).collection(bell_StuID).doc("小任務進度").collection("小任務進度").doc("SmallTask7")
                                    .set({
                                        schedule: 1,
                                        time: new Date()
                                    })
                                    .then(function(data) {
                                        console.log("更新小任務進度成功");
                                    })
                                    .catch(function(error) {
                                        console.error("更新小任務進度失敗：", error);
                                    });
                                } else {
                                    console.log("增加建議成立次數");
                                    // 更新小任務進度
                                    db.collection("點數").doc(ClassID).collection(bell_StuID).doc("小任務進度").collection("小任務進度").doc("SmallTask7")
                                    .update({
                                        schedule: results.data().schedule+1,
                                        time: new Date()
                                    })
                                    .then(function(data) {
                                        console.log("更新小任務進度成功");
                                    })
                                    .catch(function(error) {
                                        console.error("更新小任務進度失敗：", error);
                                    });
                                }
                            }).catch(function(error) { 
                                console.log("取得目前次數發生錯誤：", error); 
                            });
                        }
                    }).catch(function(error) { 
                        console.log("取得組員人數發生錯誤：", error); 
                    });

                    // 更新伺服器
                    db.collection("提案聚焦").doc(ClassID).collection(GroupID).doc(proposalID).collection("建議").doc(bellID)
                    .update({
                        voteN: $scope.bells[indexNum].voteN,
                        voteY: $scope.bells[indexNum].voteY
                    })
                    .then(function(data) {
                        console.log("更新伺服器成功");
                    })
                    .catch(function(error) {
                        console.error("更新伺服器失敗：", error);
                    });

                }else{
                    console.log("取得該bell失敗");
                }
            };

            // 新增,加入,建議提案
            $scope.AddProposal = function(InviteOrAdd,time) {
                $scope.proposals = [];
                // 新增提案 - 取得未新增名單
                $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner><p>載入腦力激盪中...</p>'});
                db.collection("腦力激盪").doc(ClassID).collection(GroupID).where("invited", "==", false)
                .get().then(function(results) {
                    if(results.empty) {
                        console.log("全都已新增or無腦力激盪");
                        $ionicLoading.hide();
                    } else {
                        var a = results.docs.length;
                        var count = 0;
                        results.forEach(function (doc) {
                            $scope.proposals.push({
                                ID:doc.id,msg:doc.data().msg,
                                like:doc.data().like.length,
                                search:Number(doc.data().search.substr(11))
                            });
                            // 判斷最後一筆關閉轉圈圈
                            count++;
                            if (count==a) {
                                $ionicLoading.hide();
                            }
                        });
                        console.log("取得腦力激盪名單：",$scope.proposals);
                    }
                }).catch(function(error) { 
                    console.log("取得未分組名單發生錯誤：", error); 
                });

                // 分類器 依分頁分類
                var indexedsearch = [];
                $scope.proposalsForFilter = function() {
                    indexedsearch = [];
                    return $scope.proposals;
                };
                $scope.searchFilter = function(proposals) {
                    var newsearch = indexedsearch.indexOf(proposals.search) == -1;
                    if(newsearch) {
                      indexedsearch.push(proposals.search);     
                    }
                    return newsearch;
                };

                $scope.checkProposals = [];
                // 新增提案 - 偵測勾選
                $scope.proposalBtn = function(proposalID) {
                    // 判斷有無在陣列中，無則增加、有則刪除
                    if ($scope.checkProposals.indexOf(proposalID) === -1) {
                        $scope.checkProposals.push(proposalID);
                    } else {
                        $scope.checkProposals.splice($scope.checkProposals.indexOf(proposalID),1);
                    }
                    console.log($scope.checkProposals);
                };
                
                $scope.proposalInput = [];
                // 判斷新增還是加入提案
                if (InviteOrAdd=="Add") {
                    // 新增提案 - 跳出泡泡(組長)新增
                    $ionicPopup.show({
                        title: '新增提案',
                        subTitle: '請選擇加入提案之腦力激盪。',
                        template: 
                            '<input type="text" ng-model="proposalInput.content" placeholder="輸入提案標題（限15字內）..." maxlength="15" style="margin-bottom:10px; padding:8px;">'+
                            '<div ng-repeat="proposalsPerSearch in proposalsForFilter() | filter:searchFilter | orderBy:'+"'search'"+'">'+
                                '<div class="item item-divider">腦力激盪{{proposalsPerSearch.search}}</div>'+
                                '<div ng-repeat="proposal in proposals | filter:{search:proposalsPerSearch.search} | orderBy:'+"'-like'"+' ">'+
                                    '<ion-checkbox ng-click="proposalBtn(proposal.ID)">{{proposal.like}}讚：{{proposal.msg}}</ion-checkbox>'+
                                '</div>'+
                            '</div>',
                        scope: $scope,
                        buttons: [{
                            text: '取消',
                            type: 'button-default',
                            onTap: function(e) {
                                console.log('選擇取消');
                            }
                        }, {
                            text: '新增',
                            type: 'button-chanry1',
                            onTap: function(e) {
                                console.log('選擇新增');
                                // 判斷是否必填未填
                                if ($scope.proposalInput.content==""||$scope.proposalInput.content==undefined) {
                                    console.log("請填寫提案標題");
                                    $ionicPopup.alert({
                                        title: '錯誤',
                                        template: '請填寫提案標題。'
                                    });
                                } else if($scope.checkProposals.length == 0) {
                                    console.log("請勾選腦力激盪");
                                    $ionicPopup.alert({
                                        title: '錯誤',
                                        template: '請勾選至少一項腦力激盪。'
                                    });
                                } else {
                                    // 新增提案
                                    db.collection("提案聚焦").doc(ClassID).collection(GroupID)
                                    .add({
                                        ProposalName: $scope.proposalInput.content,
                                        brainstorming: $scope.checkProposals,
                                        bellBadge: [],
                                        time: new Date()
                                    })
                                    .then(function(data) {
                                        console.log("新增提案成功");
                                        // 標記提案已加入
                                        $scope.checkProposals.forEach(function (brainstormingID) {
                                            db.collection("腦力激盪").doc(ClassID).collection(GroupID).doc(brainstormingID)
                                            .update({
                                                invited: true
                                            })
                                            .then(function(data) {
                                                console.log("標記提案成功");
                                            })
                                            .catch(function(error) {
                                                console.error("標記提案失敗：", error);
                                            });
                                        });
                                        // 更新教師主控台
                                        db.collection("提案聚焦").doc(ClassID)
                                        .set({
                                            update: new Date()
                                        })
                                        .then(function(data) {
                                            console.log("更新教師主控台成功");
                                        })
                                        .catch(function(error) {
                                            console.error("更新教師主控台失敗：", error);
                                        });
                                    })
                                    .catch(function(error) {
                                        console.error("新增提案失敗：", error);
                                    });
                                }
                            }
                        }]
                    });
                } else if (InviteOrAdd=="Invite") {
                    // 判斷是否是組長
                    if ($scope.leaderGroupShow) {
                        // 加入提案 - 跳出泡泡(組長)加入
                        $ionicPopup.show({
                            title: '加入腦力激盪',
                            subTitle: '請選擇加入此提案之腦力激盪。',
                            template: 
                            '<div ng-repeat="proposalsPerSearch in proposalsForFilter() | filter:searchFilter | orderBy:'+"'search'"+'">'+
                                '<div class="item item-divider">腦力激盪{{proposalsPerSearch.search}}</div>'+
                                '<div ng-repeat="proposal in proposals | filter:{search:proposalsPerSearch.search} | orderBy:'+"'-like'"+' ">'+
                                    '<ion-checkbox ng-click="proposalBtn(proposal.ID)">{{proposal.like}}讚：{{proposal.msg}}</ion-checkbox>'+
                                '</div>'+
                            '</div>',
                            scope: $scope,
                            buttons: [{
                                text: '取消',
                                type: 'button-default',
                                onTap: function(e) {
                                    console.log('選擇取消');
                                }
                            }, {
                                text: '加入',
                                type: 'button-chanry1',
                                onTap: function(e) {
                                    console.log('選擇加入');
                                    // 判斷是否必填未填
                                    if($scope.checkProposals.length == 0) {
                                        console.log("請勾選腦力激盪");
                                        $ionicPopup.alert({
                                            title: '錯誤',
                                            template: '請勾選至少一項腦力激盪。'
                                        });
                                    } else {
                                        // 取得提案ID
                                        db.collection("提案聚焦").doc(ClassID).collection(GroupID).where("time", "==", time)
                                        .get().then(function(results) {
                                            results.forEach(function (doc) {
                                                var proposalID = doc.id;
                                                // 取得提案聚焦內腦力激盪陣列
                                                db.collection("提案聚焦").doc(ClassID).collection(GroupID).doc(proposalID)
                                                .get().then(function(doc) {
                                                    // 更新提案
                                                    db.collection("提案聚焦").doc(ClassID).collection(GroupID).doc(proposalID)
                                                    .update({
                                                        brainstorming: doc.data().brainstorming.concat($scope.checkProposals)
                                                    })
                                                    .then(function(data) {
                                                        console.log("更新提案成功");
                                                        // 標記提案已加入
                                                        $scope.checkProposals.forEach(function (brainstormingID) {
                                                            db.collection("腦力激盪").doc(ClassID).collection(GroupID).doc(brainstormingID)
                                                            .update({
                                                                invited: true
                                                            })
                                                            .then(function(data) {
                                                                console.log("標記提案成功");
                                                            })
                                                            .catch(function(error) {
                                                                console.error("標記提案失敗：", error);
                                                            });
                                                        });
                                                    })
                                                    .catch(function(error) {
                                                        console.error("更新提案失敗：", error);
                                                    });
                                                }).catch(function(error) { 
                                                    console.log("取得提案聚焦內腦力激盪陣列發生錯誤：", error); 
                                                });
                                            });
                                        }).catch(function(error) { 
                                            console.log("查詢全部訊息發生錯誤：", error); 
                                        });
                                    }
                                }
                            }]
                        });
                    } else {
                        // 加入提案 - 跳出泡泡(非組長)建議
                        $ionicPopup.show({
                            title: '建議加入之腦力激盪',
                            subTitle: '建議後需等過半組員同意才可加入。',
                            template: 
                            '<div ng-repeat="proposalsPerSearch in proposalsForFilter() | filter:searchFilter | orderBy:'+"'search'"+'">'+
                                '<div class="item item-divider">腦力激盪{{proposalsPerSearch.search}}</div>'+
                                '<div ng-repeat="proposal in proposals | filter:{search:proposalsPerSearch.search} | orderBy:'+"'-like'"+' ">'+
                                    '<ion-checkbox ng-click="proposalBtn(proposal.ID)">{{proposal.like}}讚：{{proposal.msg}}</ion-checkbox>'+
                                '</div>'+
                            '</div>',
                            scope: $scope,
                            buttons: [{
                                text: '取消',
                                type: 'button-default',
                                onTap: function(e) {
                                    console.log('選擇取消');
                                }
                            }, {
                                text: '建議',
                                type: 'button-chanry1',
                                onTap: function(e) {
                                    console.log('選擇建議');
                                    // 判斷是否必填未填
                                    if($scope.checkProposals.length == 0) {
                                        console.log("請勾選腦力激盪");
                                        $ionicPopup.alert({
                                            title: '錯誤',
                                            template: '請勾選至少一項腦力激盪。'
                                        });
                                    } else {
                                        // 取得提案ID
                                        db.collection("提案聚焦").doc(ClassID).collection(GroupID).where("time", "==", time)
                                        .get().then(function(results) {
                                            results.forEach(function (doc) {
                                                var proposalID = doc.id;
                                                // 新增bell
                                                db.collection("提案聚焦").doc(ClassID).collection(GroupID).doc(proposalID).collection("建議")
                                                .add({
                                                    StuID: StuID,
                                                    brainstorming: $scope.checkProposals,
                                                    voteY: [StuID],
                                                    voteN: [],
                                                    solve: false,
                                                    time: new Date() 
                                                })
                                                .then(function(data) {
                                                    console.log("新增bell成功");
                                                    // 取得小組名單
                                                    db.collection("分組").doc(ClassID).collection("group").doc(GroupID)
                                                    .get().then(function(results) {
                                                        // 更新未讀名單
                                                        db.collection("提案聚焦").doc(ClassID).collection(GroupID).doc(proposalID)
                                                        .update({
                                                            bellBadge: results.data().members
                                                        })
                                                        .then(function(data) {
                                                            console.log("更新未讀名單成功");
                                                        })
                                                        .catch(function(error) {
                                                            console.error("更新未讀名單失敗：", error);
                                                        });

                                                    }).catch(function(error) { 
                                                        console.log("取得小組名單發生錯誤：", error); 
                                                    });
                                                })
                                                .catch(function(error) {
                                                    console.error("新增bell失敗：", error);
                                                });
                                            });
                                        }).catch(function(error) { 
                                            console.log("查詢全部訊息發生錯誤：", error); 
                                        });
                                    }
                                }
                            }]
                        });
                    }
                    
                }
            };

            // 刪除腦力激盪
            $scope.DelBrainstorming = function(ProposalTime,BrainTime) {
                // 取得腦力激盪ID
                db.collection("腦力激盪").doc(ClassID).collection(GroupID).where("time", "==", BrainTime)
                .get().then(function(results) {
                    results.forEach(function (doc) {
                        var BrainID = doc.id;
                        // 取得該提案之腦力激盪清單
                        db.collection("提案聚焦").doc(ClassID).collection(GroupID).where("time", "==", ProposalTime)
                        .get().then(function(results) {
                            results.forEach(function (doc) {
                                // 從清單中刪除該腦力激盪
                                var brainstorming = doc.data().brainstorming;
                                brainstorming.splice(brainstorming.indexOf(BrainID),1);
                                // 更新該提案之腦力激盪清單
                                db.collection("提案聚焦").doc(ClassID).collection(GroupID).doc(doc.id)
                                .update({
                                    brainstorming: brainstorming
                                })
                                .then(function(data) {
                                    console.log("更新該提案之腦力激盪清單成功");
                                })
                                .catch(function(error) {
                                    console.error("更新該提案之腦力激盪清單失敗：", error);
                                });
                                // 標記提案未加入
                                db.collection("腦力激盪").doc(ClassID).collection(GroupID).doc(BrainID)
                                .update({
                                    invited: false
                                })
                                .then(function(data) {
                                    console.log("標記提案成功");
                                })
                                .catch(function(error) {
                                    console.error("標記提案失敗：", error);
                                });
                            });
                        }).catch(function(error) { 
                            console.log("取得該提案之腦力激盪清單發生錯誤：", error); 
                });
                    });
                }).catch(function(error) { 
                    console.log("取得腦力激盪ID發生錯誤：", error); 
                });
            }

            // 刪除提案
            $scope.DelProposal = function(time) {
                $ionicPopup.confirm({
                    title: '刪除提案',
                    template: '確定要刪除此提案嗎?',
                    buttons: [{
                        text: '取消',
                        type: 'button-default',
                        onTap: function(e) {
                            console.log('選擇取消');
                        }
                    }, {
                        text: '確定',
                        type: 'button-chanry1',
                        onTap: function(e) {
                            console.log('選擇刪除');
                            // 取得提案ID
                            db.collection("提案聚焦").doc(ClassID).collection(GroupID).where("time", "==", time)
                            .get().then(function(results) {
                                results.forEach(function (doc) {
                                    db.collection("提案聚焦").doc(ClassID).collection(GroupID).doc(doc.id)
                                    .delete().then(function () {
                                        console.log("刪除提案聚焦成功");
                                        // 標記提案未加入
                                        doc.data().brainstorming.forEach(function (brainstormingID) {
                                            db.collection("腦力激盪").doc(ClassID).collection(GroupID).doc(brainstormingID)
                                            .update({
                                                invited: false
                                            })
                                            .then(function(data) {
                                                console.log("標記提案成功");
                                            })
                                            .catch(function(error) {
                                                console.error("標記提案失敗：", error);
                                            });
                                        });
                                        // 更新教師主控台
                                        db.collection("腦力激盪").doc(ClassID)
                                        .set({
                                            update: new Date()
                                        })
                                        .then(function(data) {
                                            console.log("更新教師主控台成功");
                                        })
                                        .catch(function(error) {
                                            console.error("更新教師主控台失敗：", error);
                                        });
                                    }).catch(function(error) {
                                        console.error("刪除提案聚焦失敗：", error);
                                    });
                                });
                            }).catch(function(error) { 
                                console.log("查詢全部訊息發生錯誤：", error); 
                            });
                        }
                    }]
                });
            };

        }else{
            console.log("尚未登入");
            $state.go("login");
            // window.location.reload();
        }
    });
}])

// ----------------------------------------設定頁面----------------------------------------
.controller('settingCtrl', ['$scope', '$stateParams', '$ionicLoading', '$ionicPopup',
function ($scope, $stateParams, $ionicLoading, $ionicPopup) {
    var db = firebase.firestore();
    // 驗證登入
    firebase.auth().onAuthStateChanged((user) => {
        if (user) { //登入成功，取得使用者
            console.log("已登入狀態");
            var StuID = user.email.substring(0,user.email.indexOf("@")).toUpperCase();
            var ClassID = localStorage.getItem("ClassID");

            // 修改密碼
            $scope.Passward = function() {
                // 寄送密碼重置信
                $ionicPopup.show({
                    title: '寄送密碼重置信',
                    template: '確定要寄送密碼重置信嗎?',
                    buttons: [{
                        text: '取消',
                        type: 'button-default',
                        onTap: function(e) {
                            console.log('選擇取消');
                        }
                    }, {
                        text: '確定',
                        type: 'button-chanry1',
                        onTap: function(e) {
                            console.log('選擇確定');
                            $ionicLoading.show({ // 開始跑圈圈
                                template: '寄送密碼重置信中...'
                            });
                            firebase.auth().sendPasswordResetEmail(StuID+"@nkust.edu.tw").then(function() {
                                console.log("寄送密碼重置信成功");
                                var alertPopup = $ionicPopup.alert({
                                    title: '成功',
                                    template: '寄送密碼重置信成功，請至 '+StuID+"@nkust.edu.tw"+" 收信"
                                });
                                $ionicLoading.hide();
                            }).catch(function(error) {
                                console.log("寄送密碼重置信失敗：",error);
                                $ionicLoading.hide();
                            });
                        }
                    }]
                });
            };

            // 上傳大頭照功能
            $scope.myImage='';
            $scope.myCroppedImage='';
            var handleFileSelect=function(evt) {
                var file=evt.currentTarget.files[0];
                var reader = new FileReader();
                reader.onload = function (evt) {
                    $scope.$apply(function($scope){
                        $scope.myImage=evt.target.result;
                    });
                };
                reader.readAsDataURL(file);
            };
            angular.element(document.querySelector('#uploadFileInput2')).on('change',handleFileSelect);
            // 點擊上傳
            $scope.ChangeImg = function(myCroppedImage) {
                $ionicLoading.show({ // 開始跑圈圈
                    template: '上傳圖片中...'
                });
                // 判斷是否有上傳
                if (myCroppedImage == "") {
                    console.log("未選擇檔案");
                    $ionicLoading.hide();
                    var alertPopup = $ionicPopup.alert({
                        title: '未選擇檔案',
                        template: '請先選擇檔案再上傳'
                    });
                } else {
                    var storage = firebase.storage();
                    var storageRef = storage.ref();
                    var now = new Date();
                    var ImgID = StuID+now.getFullYear().toString()+now.getMonth()+now.getDate()+now.getHours()+now.getMinutes()+now.getSeconds()+now.getMilliseconds();
                    var uploadTask = storageRef.child('members/'+ImgID).putString(myCroppedImage, 'data_url');
                    uploadTask.on('state_changed', function(snapshot){
                        // 取得檔案上傳狀態，並用數字顯示
                        var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        $ionicLoading.show({ // 開始跑圈圈
                            template: '已上傳 ' + progress + '%'
                        });
                        switch (snapshot.state) {
                            case firebase.storage.TaskState.PAUSED: 
                            console.log('上傳暫停');
                            break;
                            case firebase.storage.TaskState.RUNNING: 
                            console.log('上傳中');
                            break;
                        }
                    }, function(error) {
                        console.log("上傳失敗");
                        $ionicLoading.hide();
                        console.log(error);
                        var alertPopup = $ionicPopup.alert({
                            title: '上傳圖片失敗',
                            template: error
                        });
                        // 清空
                        $scope.myImage='';
                        $scope.myCroppedImage='';
                    }, function() {
                        console.log("上傳成功");
                        $ionicLoading.hide();
                        // 清空
                        $scope.myImage='';
                        $scope.myCroppedImage='';
                        // 更新menu的大頭照
                        storageRef.child('members/'+ImgID).getDownloadURL().then(function(url) {
                            document.getElementById("menu-img").src=url;
                        })
                        // 更新DB檔名
                        db.collection("帳號").doc(StuID)
                        .update({
                            Img: ImgID
                        })
                        .then(function(data) {
                            console.log("更新DB檔名成功");
                        })
                        .catch(function(error) {
                            console.error("更新DB檔名失敗：", error);
                        });
                        // 判斷是否有小組
                        if (localStorage.getItem("GroupID")!="none") {
                            // 通知首頁更換照片
                            db.collection("分組").doc(ClassID).collection("group").doc(localStorage.getItem("GroupID"))
                            .update({
                                imgChange: new Date()
                            })
                            .then(function(data) {
                                console.log("通知首頁更換照片成功");
                            })
                            .catch(function(error) {
                                console.error("通知首頁更換照片失敗：", error);
                            });
                        }

                        var alertPopup = $ionicPopup.alert({
                            title: '成功',
                            template: '更換照片完成。'
                        });
                    });
                }
            };

            // BUG回報功能
            $scope.BugBtn = function(Bug) {
                // 判斷是否未填
                if (Bug=="" || Bug==undefined) {
                    console.log("請填寫完整");
                    $ionicPopup.alert({
                        title: '錯誤',
                        template: '請填寫完整。'
                    });
                } else {
                    // 系統紀錄 - 回傳伺服器
                    db.collection("系統記錄").doc(ClassID).collection("BUG回報")
                    .add({
                        StuID: StuID,
                        Content: Bug,
                        time: new Date()
                    })
                    .then(function(data) {
                        console.log("回傳伺服器成功");
                        $ionicPopup.alert({
                            title: '成功',
                            template: '回報成功，感謝您。'
                        });
                    })
                    .catch(function(error) {
                        console.error("回傳伺服器失敗：", error);
                        $ionicPopup.alert({
                            title: '失敗',
                            template: '回報失敗，請稍候再試。'+error
                        });
                    });
                }
            };

        }else{
            console.log("尚未登入");
            $state.go("login");
            // window.location.reload();
        }
    });
}])

// ----------------------------------------選單頁面----------------------------------------
.controller('menuCtrl', ['$scope', '$stateParams', '$ionicPopup', '$state',
function ($scope, $stateParams, $ionicPopup, $state) {
    var db = firebase.firestore();
    // 驗證登入
    firebase.auth().onAuthStateChanged((user) => {
        if (user) { //登入成功，取得使用者
            console.log("已登入狀態");
            var StuID = user.email.substring(0,user.email.indexOf("@")).toUpperCase();
            var ClassID = localStorage.getItem("ClassID");

            // 查詢姓名
            db.collection("帳號").doc(StuID)
            .get().then(function(results) {
                // 更新使用者姓名
                document.getElementById("menu-heading1").innerText = StuID + ' ' +results.data().Name;
                localStorage.setItem("StuName",results.data().Name);
            }).catch(function(error) { 
                console.log("查詢姓名發生錯誤：", error); 
            });

            // 登出
            var signOutSmtBtn = document.getElementById("menu-list-item8");
            signOutSmtBtn.addEventListener("click",function(){
                firebase.auth().signOut().then(function() {
                    console.log("登出成功");
                    localStorage.clear();
                }).catch(function(error) {
                    console.log("登出發生錯誤!");
                });
            },false);
            
            // 查詢圖片檔名
            db.collection("帳號").doc(StuID)
            .get().then(function(results) {
                // 更新menu的大頭照
                console.log("更新大頭照成功");
                var storage = firebase.storage();
                var storageRef = storage.ref();
                storageRef.child('members/'+results.data().Img).getDownloadURL().then(function(url) {
                    document.getElementById("menu-img").src=url;
                })
            }).catch(function(error) { 
                console.log("查詢圖片檔名發生錯誤：", error); 
            });
              
            // 設定授權文字
            document.getElementById("menu-heading2").innerText="Copyright © 2019 ver "+verson;

            // 監聽 - 搜尋是否有人邀請
            db.collection("分組").doc(ClassID).collection("student").doc(StuID).collection("invite").where("respond", "==", false)
            .onSnapshot(function(querySnapshot) {
                querySnapshot.docChanges().forEach(function(change) {
                    // 僅新增的邀請會跳出 修改不會重載
                    if (change.type === "added") {
                        var doc = change.doc;

                        console.log("有人邀請");
                        // 查詢姓名
                        var groupID = doc.data().groupID;
                        var inviteID = doc.id;
                        var leaderID = doc.data().leader;
                        db.collection("帳號").doc(leaderID)
                        .get().then(function(results) {
                            var leaderName = results.data().Name;
                            //跳出邀請訊息
                            var invitePopup = $ionicPopup.show({
                                title: '小組邀請',
                                subTitle: leaderID+' '+leaderName+' 邀請你加入小組。',
                                template: 
                                    '<img class="inviteImg" src="img/invite.jpg">',
                                scope: $scope,
                                buttons: [{
                                    text: '拒絕',
                                    type: 'button-default',
                                    onTap: function(e) {
                                        console.log('選擇拒絕');
                                        // 更新回應狀態
                                        db.collection("分組").doc(ClassID).collection("student").doc(StuID).collection("invite").doc(inviteID)
                                        .update({
                                            respond: true
                                        })
                                        .then(function(data) {
                                            console.log("更新回應狀態成功");
                                            // 檢查小組是否還存在 如存在 刪除自己邀請中狀態
                                            db.collection("分組").doc(ClassID).collection("group").doc(groupID)
                                            .get().then(function(results) {
                                                var inviting = results.data().inviting;
                                                // 刪除自己
                                                inviting.splice(inviting.indexOf(StuID),1);
                                                // 取消邀請
                                                db.collection("分組").doc(ClassID).collection("group").doc(groupID)
                                                .update({
                                                    inviting: inviting
                                                })
                                                .then(function(data) {
                                                    console.log("更新inviting成功");
                                                })
                                                .catch(function(error) {
                                                    console.error("更新inviting失敗：", error);
                                                });
                                            }).catch(function(error) { 
                                                console.log("檢查小組是否還存在，可能小組已解散：", error); 
                                            });
                                        })
                                        .catch(function(error) {
                                            console.error("更新回應狀態失敗：", error);
                                        });
                                    }
                                }, {
                                    text: '接受',
                                    type: 'button-chanry1',
                                    onTap: function(e) {
                                        console.log('選擇接受');
                                        // 更新回應狀態
                                        db.collection("分組").doc(ClassID).collection("student").doc(StuID).collection("invite").doc(inviteID)
                                        .update({
                                            respond: true
                                        })
                                        .then(function(data) {
                                            console.log("更新回應狀態成功");
                                            // 創立小組 - 更新入組狀態
                                            db.collection("分組").doc(ClassID).collection("student").doc(StuID)
                                            .update({
                                                grouped: true
                                            })
                                            .then(function(data) {
                                                console.log("更新入組狀態成功");
                                                // 檢查小組是否還存在 如存在 刪除自己邀請中狀態
                                                db.collection("分組").doc(ClassID).collection("group").doc(groupID)
                                                .get().then(function(results) {
                                                    var inviting = results.data().inviting;
                                                    var members = results.data().members;
                                                    // 刪除自己
                                                    inviting.splice(inviting.indexOf(StuID),1);
                                                    // 新增自己
                                                    members.push(StuID);
                                                    // 取消邀請
                                                    db.collection("分組").doc(ClassID).collection("group").doc(groupID)
                                                    .update({
                                                        inviting: inviting,
                                                        members: members
                                                    })
                                                    .then(function(data) {
                                                        console.log("更新inviting成功");
                                                        // 拒絕其他邀請
                                                        db.collection("分組").doc(ClassID).collection("student").doc(StuID).collection("invite").where("respond", "==", false)
                                                        .get().then(function (querySnapshot) {
                                                            querySnapshot.forEach(function (doc) {
                                                                // 拒絕其他邀請 - 更新回應狀態
                                                                db.collection("分組").doc(ClassID).collection("student").doc(StuID).collection("invite").doc(doc.id)
                                                                .update({
                                                                    respond: true
                                                                })
                                                                .then(function(data) {
                                                                    console.log("拒絕其他邀請 - 更新回應狀態成功");
                                                                    // 檢查小組是否還存在 如存在 刪除自己邀請中狀態
                                                                    db.collection("分組").doc(ClassID).collection("group").doc(groupID)
                                                                    .get().then(function(results) {
                                                                        var inviting = results.data().inviting;
                                                                        // 刪除自己
                                                                        inviting.splice(inviting.indexOf(StuID),1);
                                                                        // 取消邀請
                                                                        db.collection("分組").doc(ClassID).collection("group").doc(groupID)
                                                                        .update({
                                                                            inviting: inviting
                                                                        })
                                                                        .then(function(data) {
                                                                            console.log("更新inviting成功");
                                                                            // 重載頁面 目的關閉全部泡泡(極端用法)
                                                                            window.location.reload();
                                                                        })
                                                                        .catch(function(error) {
                                                                            console.error("更新inviting失敗：", error);
                                                                        });
                                                                    }).catch(function(error) { 
                                                                        console.log("檢查小組是否還存在，可能小組已解散：", error); 
                                                                    });
                                                                })
                                                                .catch(function(error) {
                                                                    console.error("拒絕其他邀請 - 更新回應狀態失敗：", error);
                                                                });
                                                            });
                                                        });
                                                        // 關閉其他invitePopup
                                                        for (let index = 0; index < 10; index++) {
                                                            invitePopup.close();
                                                        }
                                                    })
                                                    .catch(function(error) {
                                                        console.error("更新inviting失敗：", error);
                                                    });
                                                }).catch(function(error) { 
                                                    console.log("檢查小組是否還存在，可能小組已解散：", error); 
                                                });
                                            })
                                            .catch(function(error) {
                                                console.error("更新入組狀態失敗：", error);
                                            });
                                        })
                                        .catch(function(error) {
                                            console.error("更新回應狀態失敗：", error);
                                        });
                                    }
                                }]
                            });
                        }).catch(function(error) { 
                            console.log("查詢姓名發生錯誤：", error); 
                        });
                    }
                });
            },function(error) {
                console.log("搜尋是否有人邀請發生錯誤：", error); 
            });

            // 監聽 - 是否有小組
            db.collection("分組").doc(ClassID).collection("group").where("members", "array-contains", StuID)
            .onSnapshot(function(results) {
                // 確認是否有小組
                if (results.empty == false) {
                    console.log("選單 - 已加入小組");
                    results.forEach(function (doc) {
                        // 設定小組ID
                        localStorage.setItem("GroupID",doc.id);
                        GroupID = doc.id;
                        // 開關顯示
                        $scope.needGroup = true;
                        // 更新小任務進度
                        db.collection("點數").doc(ClassID).collection(StuID).doc("小任務進度").collection("小任務進度").doc("SmallTask1")
                        .set({
                            schedule: 1,
                            time: new Date()
                        })
                        .then(function(data) {
                            console.log("更新小任務進度成功");
                        })
                        .catch(function(error) {
                            console.error("更新小任務進度失敗：", error);
                        });
                    });
                } else {
                    console.log("選單 - 未加入小組");
                    // 設定小組ID
                    localStorage.setItem("GroupID","none");
                    GroupID = "none";
                    // 開關顯示
                    $scope.needGroup = false;
                }
            },function(error) {
                console.log("取得小組ID發生錯誤：", error); 
            }); 

            var TotalPointArray = [];
            // 監聽 - 取得點數
            db.collection("點數").doc(ClassID).collection(StuID).doc("點數歷程記錄").collection("點數歷程記錄")
            .onSnapshot(function(querySnapshot) {
                querySnapshot.docChanges().forEach(function(change) {
                    if (change.type === "added") {
                        // 呼叫解密fun
                        var point = pasw(change.doc.data().point);
                        if (point == 'ER') {
                            // 系統紀錄 - 通報伺服器
                            db.collection("系統記錄").doc(ClassID).collection("資安回報")
                            .add({
                                StuID: StuID,
                                Content: '點數解密發生錯誤',
                                time: new Date()
                            })
                            .then(function(data) {
                                console.log("通報伺服器成功");
                            })
                            .catch(function(error) {
                                console.error("通報伺服器失敗：", error);
                            });
                        } else {
                            TotalPointArray.push({
                                point:point,
                                time:change.doc.data().time
                            });
                        }
                        console.log("新增: ", change.doc.data());
                        $scope.$apply(); //重新監聽view
                    } else if (change.type === "modified") {
                        console.log("修改: ", change.doc.data());
                    } else if (change.type === "removed") {
                        console.log("刪除: ", change.doc.data());
                        // 用findIndex找出要刪除的位置
                        var indexNum = TotalPointArray.findIndex((element)=>{
                            return (element.time.seconds === change.doc.data().time.seconds) & (element.time.nanoseconds === change.doc.data().time.nanoseconds);
                        });
                        // 刪除
                        if (indexNum!=-1) {
                            TotalPointArray.splice(indexNum,1);
                            console.log("刪除點數成功");
                        }else{
                            console.log("刪除點數不成功");
                        }
                        $scope.$apply(); //重新監聽view
                    }
                    // 有修改就重新加總
                    var TotalPoint = 0;
                    for (let index = 0; index < TotalPointArray.length; index++) {
                        TotalPoint += TotalPointArray[index].point;
                        // 判斷最後一筆
                        if (index==TotalPointArray.length-1) {
                            $scope.TotalPoint = TotalPoint;
                            // 更新伺服器點數
                            db.collection("點數").doc(ClassID).collection(StuID).doc("點數歷程記錄")
                            .set({
                                Point: paswLock(TotalPoint)
                            })
                            .then(function(data) {
                                console.log("更新伺服器點數成功");
                            })
                            .catch(function(error) {
                                console.error("更新伺服器點數失敗：", error);
                            });
                        }
                    }
                });
            });
        }else{
            console.log("尚未登入");
            $state.go("login");
            // window.location.reload();
        }
    });
}])

// ----------------------------------------教師版主頁面----------------------------------------
.controller('root_pblCtrl', ['$scope', '$stateParams', '$ionicPopup', '$ionicLoading', '$state',
function ($scope, $stateParams, $ionicPopup, $ionicLoading, $state) {
    // 驗證登入
    firebase.auth().onAuthStateChanged((user) => {
        if (user.uid==="eTlMITVmGbSStEQ7B7jw9rIl20N2") { //登入成功，取得使用者
            console.log("已登入狀態");
            let originalUser = firebase.auth().currentUser;

            // 處理xlsx
            var persons = []; // 儲存獲取到的資料
            $('#excel-file').change(function(e) {
                var files = e.target.files;
                var fileReader = new FileReader();
                fileReader.onload = function(ev) {
                    try {
                        var data = ev.target.result;
                        var workbook = XLSX.read(data, {
                            type: 'binary'
                        }) // 以二進位制流方式讀取得到整份excel表格物件
                    } catch (e) {
                        console.log('檔案型別不正確');
                        return;
                    }
                    // 表格的表格範圍，可用於判斷表頭是否數量是否正確
                    var fromTo = '';
                    // 遍歷每張表讀取
                    for (var sheet in workbook.Sheets) {
                        if (workbook.Sheets.hasOwnProperty(sheet)) {
                            fromTo = workbook.Sheets[sheet]['!ref'];
                            console.log(fromTo);
                            persons = persons.concat(XLSX.utils.sheet_to_json(workbook.Sheets[sheet]));
                            // break; // 如果只取第一張表，就取消註釋這行
                        }
                    }
                    //在控制檯打印出來表格中的資料
                    console.log(persons);
                };
                // 以二進位制方式開啟檔案
                fileReader.readAsBinaryString(files[0]);
            });

            // 點擊創立
            var db = firebase.firestore();
            $scope.addClass = function() {
                var className = this.className;
                if (className===undefined || className==="" || persons.length===0) {
                    console.log("未填");
                    var alertPopup = $ionicPopup.alert({
                        title: '錯誤',
                        template: '資料未填完整。'
                    });
                } else {
                    var confirmPopup = $ionicPopup.confirm({
                        title: '創立課程',
                        template: '確定創立嗎?'
                    });
                    confirmPopup.then(function(res) {
                        if(res) {
                            console.log('確定');
                            $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner><p>創立課程中...</p>'});
                            // 取得全部人學號
                            var Stu = [];
                            for (let index = 0; index < persons.length; index++) {
                                Stu.push(persons[index].學號);
                            }
                            // 創立課程 - 新增課程
                            db.collection("課程")
                            .add({
                                ClassName: className,
                                ClassContent: "暫無公告。",
                                inviteLock: false,
                                lock: false,
                                maxMembers: 6,
                                ClassStu: Stu
                            })
                            .then(function(data) {
                                console.log("新增課程成功");
                                // 創立課程 - 更新學生資料
                                var batch = db.batch();
                                batch.update(db.collection("課程").doc(data.id), {ClassID:data.id});
                                for (let index = 0; index < persons.length; index++) {
                                    db.collection("帳號").doc(persons[index].學號).get().then(function(doc) {
                                        // 如此判斷才不會覆蓋已新增的其他資料
                                        if (doc.exists) {
                                            // 已有帳號
                                            console.log("已有帳號");
                                            batch.set(db.collection("分組").doc(data.id).collection("student").doc(persons[index].學號), {grouped:false});
                                            // 判斷沒資料了 就送出
                                            if (index === persons.length-1) {
                                                batch.commit().then(function () {
                                                    console.log("更新學生成功");
                                                    persons = [];
                                                    $ionicLoading.hide();
                                                }).catch(function(error) {
                                                    console.error("更新學生資料失敗：", error);
                                                });
                                            }
                                        } else {
                                            // 尚無帳號
                                            console.log("尚無帳號");
                                            batch.set(db.collection("帳號").doc(persons[index].學號), {Name:persons[index].姓名}, {Img:"default"});
                                            batch.set(db.collection("分組").doc(data.id).collection("student").doc(persons[index].學號), {grouped:false});
                                            // 註冊Authentication
                                            firebase.auth().createUserWithEmailAndPassword(persons[index].學號+"@nkust.edu.tw", persons[index].學號)
                                            .then(() => {
                                                console.log("註冊Authentication成功");
                                                firebase.auth().updateCurrentUser(originalUser);
                                            })
                                            .catch((error) => {
                                                console.log("註冊Authentication失敗",error.message);
                                            });
                                            // 判斷沒資料了 就送出
                                            if (index === persons.length-1) {
                                                batch.commit().then(function () {
                                                    console.log("更新學生成功");
                                                    persons = [];
                                                    $ionicLoading.hide();
                                                }).catch(function(error) {
                                                    console.error("更新學生資料失敗：", error);
                                                });
                                            }
                                        }
                                    }).catch(function(error) {
                                        console.log("判斷帳號發生錯誤：", error); 
                                    });

                                    
                                }
                            })
                            .catch(function(error) {
                                console.error("新增課程失敗：", error);
                            });
                        } else {
                            console.log('取消');
                        }
                    });
                }
            }
           
            // 列出全部課程
            db.collection("課程")
            .get().then(function (querySnapshot) {
                $scope.AllClass = [];
                querySnapshot.forEach(function (doc) {
                    $scope.AllClass.push(doc.data());
                    $scope.$apply(); //重新監聽view
                });
            });

            // 選擇課程 - 選擇完成
            $scope.SelectBtn = function(value) {
                if (value!=undefined) {
                    var ClassID = value.ClassID;
                    var StuID = "教師版";
                    $scope.cardShow = true;

                    // 分組 - 設定 - 開放學生自行分組
                    $scope.LockGroupChange = function(ClassID,inviteLock) {
                        // 更新inviteLock
                        db.collection("課程").doc(ClassID)
                        .update({
                            inviteLock: inviteLock
                        })
                        .then(function(data) {
                            console.log("更新inviteLock成功");
                        })
                        .catch(function(error) {
                            console.error("更新inviteLock失敗：", error);
                        });
                    };

                    // 分組 - 設定 - 小組人數上限
                    $scope.maxMembersChange = function(ClassID,maxMembers) {
                        // 更新maxMembers
                        db.collection("課程").doc(ClassID)
                        .update({
                            maxMembers: maxMembers
                        })
                        .then(function(data) {
                            console.log("更新maxMembers成功");
                        })
                        .catch(function(error) {
                            console.error("更新maxMembers失敗：", error);
                        });
                    };

                    // 分組 - 監聽 - 分組狀態變動及更新
                    db.collection("分組").doc(ClassID).collection("student").where("grouped", "==", false)
                    .onSnapshot(function(querySnapshot) {
                        $scope.thisClass = value;
                        // 取得分組狀態
                        $scope.Allgroups = [];
                        // 未分組的人
                        var Ngroup = [];
                        db.collection("分組").doc(ClassID).collection("student").where("grouped", "==", false)
                        .get().then(function (querySnapshot) {
                            querySnapshot.forEach(function (doc) {
                                // 查詢姓名
                                db.collection("帳號").doc(doc.id)
                                .get().then(function(results) {
                                    Ngroup.push(doc.id+results.data().Name);
                                }).catch(function(error) { 
                                    console.log("查詢姓名發生錯誤：", error); 
                                });
                            });
                            // 已分組的人
                            var Ygroup = [];
                            db.collection("分組").doc(ClassID).collection("student").where("grouped", "==", true)
                            .get().then(function (querySnapshot) {
                                querySnapshot.forEach(function (doc) {
                                    Ygroup.push(doc.id);
                                });
                                $scope.Allgroups = [{ClassName:value.ClassName,Ngroup:Ngroup,Ygroup:Ygroup}];
                                // 繪製環形圖
                                var dom = document.getElementById("Chart_group");
                                var myChart = echarts.init(dom);
                                var app = {};
                                option = null;
                                app.title = '環形圖';
                                option = {
                                    tooltip: {
                                        trigger: 'item',
                                        formatter: "{a} <br/>{b}: {c} ({d}%)"
                                    },
                                    legend: {
                                        orient: 'vertical',
                                        x: 'left',
                                        data:['未分組','已分組']
                                    },
                                    series: [
                                        {
                                            name:'分組狀態',
                                            type:'pie',
                                            radius: ['50%', '70%'],
                                            avoidLabelOverlap: false,
                                            label: {
                                                normal: {
                                                    show: false,
                                                    position: 'center'
                                                },
                                                emphasis: {
                                                    show: true,
                                                    textStyle: {
                                                        fontSize: '15',
                                                        fontWeight: 'bold'
                                                    }
                                                }
                                            },
                                            labelLine: {
                                                normal: {
                                                    show: false
                                                }
                                            },
                                            data:[
                                                {value:Ngroup.length, name:'未分組'},
                                                {value:Ygroup.length, name:'已分組'}
                                            ]
                                        }
                                    ]
                                };
                                if (option && typeof option === "object") {
                                    myChart.setOption(option, true);
                                }

                                $scope.cardShow = true;
                                $ionicLoading.hide();
                                $state.go($state.current, {}, {reload: true}); //重新載入view
                            });
                        });
                    });

                    var data_name = [];
                    var data_brain = [];
                    var data_proposal = [];
                    var data_vote = [];
                    // 小組討論情形 - 監聽 - 分組狀態變動及更新
                    db.collection("分組").doc(ClassID).collection("student").where("grouped", "==", false)
                    .onSnapshot(function(querySnapshot) {
                        data_name = [];
                        // 取得小組名單
                        db.collection("分組").doc(ClassID).collection("group").orderBy("leader","asc")
                        .get().then(function (querySnapshot) {
                            querySnapshot.forEach(function (doc) {
                                data_name.push(doc.data().leader);

                                // 判斷最後一筆
                                if (querySnapshot.docs[querySnapshot.docs.length-1].id==doc.id) {
                                    // 查詢姓名
                                    for (let index = 0; index < data_name.length; index++) {
                                        db.collection("帳號").doc(data_name[index])
                                        .get().then(function(results) {
                                            data_name[index] = results.data().Name+'組';
                                            Chart_discuss(data_name,data_brain,data_proposal,data_vote);
                                        });
                                    }
                                }
                            });
                        });
                    });

                    // 小組討論情形 - 監聽 - 腦力激盪數
                    db.collection("腦力激盪").doc(ClassID)
                    .onSnapshot(function(querySnapshot) {
                        data_brain = [];
                        // 取得小組名單
                        db.collection("分組").doc(ClassID).collection("group").orderBy("leader","asc")
                        .get().then(function (querySnapshot) {
                            querySnapshot.forEach(function (doc) {
                                // 取得小組腦力激盪數
                                db.collection("腦力激盪").doc(ClassID).collection(doc.id)
                                .get().then(function (querySnapshot) {
                                    data_brain.push(querySnapshot.docs.length-1);
                                    Chart_discuss(data_name,data_brain,data_proposal,data_vote);
                                });
                            });
                        });
                    });

                    // 小組討論情形 - 監聽 - 提案聚焦數
                    db.collection("提案聚焦").doc(ClassID)
                    .onSnapshot(function(querySnapshot) {
                        data_proposal = [];
                        // 取得小組名單
                        db.collection("分組").doc(ClassID).collection("group").orderBy("leader","asc")
                        .get().then(function (querySnapshot) {
                            querySnapshot.forEach(function (doc) {
                                // 取得小組提案聚焦數
                                db.collection("提案聚焦").doc(ClassID).collection(doc.id)
                                .get().then(function (querySnapshot) {
                                    data_proposal.push(querySnapshot.docs.length);
                                    Chart_discuss(data_name,data_brain,data_proposal,data_vote);
                                });
                            });
                        });
                    });

                    // 小組討論情形 - 監聽 - 投票數
                    db.collection("投票").doc(ClassID)
                    .onSnapshot(function(querySnapshot) {
                        data_vote = [];
                        // 取得小組名單
                        db.collection("分組").doc(ClassID).collection("group").orderBy("leader","asc")
                        .get().then(function (querySnapshot) {
                            querySnapshot.forEach(function (doc) {
                                // 取得小組投票數
                                db.collection("投票").doc(ClassID).collection(doc.id)
                                .get().then(function (querySnapshot) {
                                    data_vote.push(querySnapshot.docs.length);
                                    Chart_discuss(data_name,data_brain,data_proposal,data_vote);
                                });
                            });
                        });
                    });

                    // 小組討論情形 - 繪製直方圖
                    var Chart_discuss = function(data_name,data_brain,data_proposal,data_vote) {
                        var myChart = echarts.init(document.getElementById("Chart_discuss"));
                        var app = {};
                        option = null;
                        option = {
                            tooltip : {
                                trigger: 'axis'
                            },
                            legend: {
                                data:['腦力激盪數','提案聚焦數','投票數']
                            },
                            toolbox: {
                                show : true
                            },
                            calculable : true,
                            xAxis : [
                                {
                                    type : 'category',
                                    data : data_name
                                }
                            ],
                            yAxis : [
                                {
                                    type : 'value'
                                }
                            ],
                            series : [
                                {
                                    name:'腦力激盪數',
                                    type:'bar',
                                    data:data_brain,
                                    markPoint : {
                                        data : [
                                            {type : 'max', name: '最大值'},
                                            {type : 'min', name: '最小值'}
                                        ]
                                    },
                                    markLine : {
                                        data : [
                                            {type : 'average', name: '平均值'}
                                        ]
                                    }
                                },
                                {
                                    name:'提案聚焦數',
                                    type:'bar',
                                    data:data_proposal,
                                    markPoint : {
                                        data : [
                                            {type : 'max', name: '最大值'},
                                            {type : 'min', name: '最小值'}
                                        ]
                                    },
                                    markLine : {
                                        data : [
                                            {type : 'average', name: '平均值'}
                                        ]
                                    }
                                },
                                {
                                    name:'投票數',
                                    type:'bar',
                                    data:data_vote,
                                    markPoint : {
                                        data : [
                                            {type : 'max', name: '最大值'},
                                            {type : 'min', name: '最小值'}
                                        ]
                                    },
                                    markLine : {
                                        data : [
                                            {type : 'average', name : '平均值'}
                                        ]
                                    }
                                }
                            ]
                        };
                        if (option && typeof option === "object") {
                            myChart.setOption(option, true);
                        }
                    };
                    
                    // 點數排行榜 - 監聽
                    db.collection("點數").doc(ClassID)
                    .onSnapshot(function(doc) {
                        $scope.PointTops = [];
                        for (let index = 0; index < doc.data().top.length; index++) {
                            // 查詢帳號資料
                            db.collection("帳號").doc(doc.data().top[index].StuID)
                            .get().then(function(results) {
                                // 獲取大頭照
                                var storage = firebase.storage();
                                storage.ref().child('members/'+results.data().Img).getDownloadURL().then(function(url) {
                                    $scope.PointTops.push({
                                        Name:results.data().Name,
                                        Img:url,
                                        Point:doc.data().top[index].Point
                                    });
                                    $scope.$apply(); //重新監聽view
                                });
                            }).catch(function(error) { 
                                console.log("查詢帳號資料發生錯誤：", error); 
                            });
                        }
                    },function(error) {
                        console.error("讀取點數排行榜發生錯誤：", error);
                    });

                    $scope.StuPoints = [];
                    // 點數排行榜 - 取得點數名單
                    db.collection("課程").doc(ClassID)
                    .get().then(function(results) {
                        var ClassStu = results.data().ClassStu;
                        ClassStu.forEach(function (Stu) {
                            // 載入總點數
                            db.collection("點數").doc(ClassID).collection(Stu).doc("點數歷程記錄").collection("點數歷程記錄")
                            .get().then(function(results) {
                                var This_point = 0;
                                var b = results.docs.length;
                                var countB = 0;
                                var isRepeat = [];
                                results.forEach(function (doc) {
                                    // 判斷是否有重複
                                    if (isRepeat.indexOf(doc.data().check)!=-1) {
                                        console.log(Stu+"發現重複");
                                        $ionicPopup.alert({
                                            title: Stu+'發現重複',
                                            template: '編號：'+doc.id
                                        });
                                    } else {
                                        isRepeat.push(doc.data().check);
                                    }
                                    // 加總點數
                                    This_point += pasw(doc.data().point);
                                    
                                    // 判斷最後一筆
                                    countB++;
                                    if (countB==b) {
                                        $ionicLoading.hide();
                                        // 查詢姓名
                                        db.collection("帳號").doc(Stu)
                                        .get().then(function(doc) {
                                            $scope.StuPoints.push({
                                                Name:Stu+' '+doc.data().Name,
                                                StuID:Stu,
                                                Point:This_point
                                            });
                                            $scope.$apply(); //重新監聽view
                                        }).catch(function(error) { 
                                            console.log("查詢姓名發生錯誤：", error); 
                                        });
                                    }
                                });
                            }).catch(function(error) { 
                                console.log("載入總點數發生錯誤：", error); 
                            });

                        });
                    }).catch(function(error) { 
                        console.log("取得課程名單發生錯誤：", error); 
                    });

                    // 點數排行榜 - 發放點數
                    $scope.AddBtn = function(value) {
                        $scope.Stus = [];
                        // 取得學生名單
                        $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner><p>載入學生中...</p>'});
                        db.collection("分組").doc(ClassID).collection("student")
                        .get().then(function(results) {
                            results.forEach(function (doc) {
                                var a = results.docs[results.docs.length-1].id;
                                var b = results.docs[results.docs.length-2].id;
                                // 查詢姓名
                                db.collection("帳號").doc(doc.id)
                                .get().then(function(results) {
                                    $scope.Stus.push({StuID:doc.id,Name:results.data().Name,Checked:false});
                                    // 判斷倒數第一or第二筆 關閉轉圈圈
                                    if (doc.id==a || doc.id==b) {
                                        $ionicLoading.hide();
                                    }
                                }).catch(function(error) { 
                                    console.log("查詢姓名發生錯誤：", error); 
                                });
                            });
                        }).catch(function(error) { 
                            console.log("取得未分組名單發生錯誤：", error); 
                        });

                        $scope.checkStus = [];
                        // 取得學生名單 - 偵測勾選
                        $scope.check = function(Stu) {
                            // 判斷有無在陣列中，無則增加、有則刪除
                            if ($scope.checkStus.indexOf(Stu) === -1) {
                                $scope.checkStus.push(Stu);
                            } else {
                                $scope.checkStus.splice($scope.checkStus.indexOf(Stu),1);
                            }
                            console.log($scope.checkStus);
                        };

                        // 設定預設值
                        $scope.AddBtnPopup = [];

                        // 發放點數 - 跳出泡泡
                        $ionicPopup.show({
                            title: '發放點數',
                            template: 
                                '<label class="item item-input item-input">'+
                                    '<div class="input-label">點數說明</div>'+
                                    '<input type="text" ng-model="AddBtnPopup.content" placeholder="輸入說明">'+    
                                '</label>'+

                                '<label class="item item-input item-input">'+
                                    '<div class="input-label">點數數量</div>'+
                                    '<input type="number" ng-model="AddBtnPopup.point" placeholder="輸入數字">'+    
                                '</label>'+
                                
                                '<label class="item item-input item-select">'+
                                    '<div class="input-label">發放日期</div>'+
                                    '<input type="date" ng-model="AddBtnPopup.time">'+    
                                '</label>'+
                                
                                '<div ng-repeat="Stu in Stus">'+
                                    '<ion-checkbox ng-model="Stu.Checked" ng-click="check(Stu.StuID)">{{Stu.StuID}} {{Stu.Name}}</ion-checkbox>'+
                                '</div>',

                            scope: $scope,
                            buttons: [{
                                text: '取消',
                                type: 'button-default',
                                onTap: function(e) {
                                    console.log('選擇取消');
                                }
                            }, {
                                text: '發放',
                                type: 'button-chanry1',
                                onTap: function(e) {
                                    console.log('選擇發放');
                                    // 判斷是否必填未填
                                    if ($scope.AddBtnPopup.content==undefined||$scope.AddBtnPopup.point==undefined||$scope.AddBtnPopup.time==undefined) {
                                        console.log("請填寫完整");
                                        $ionicPopup.alert({
                                            title: '錯誤',
                                            template: '請填寫完整。'
                                        });
                                    } else if ($scope.checkStus.length==0) {
                                        console.log("請至少勾一位");
                                        $ionicPopup.alert({
                                            title: '錯誤',
                                            template: '請至少勾一位。'
                                        });
                                    } else {
                                        // 產生此次發放編號
                                        var now = new Date();
                                        var pointID =now.getFullYear().toString()+now.getMonth()+now.getDate()+now.getHours()+now.getMinutes()+now.getSeconds()+now.getMilliseconds();

                                        // 加分 - 上傳伺服器
                                        for (let index = 0; index < $scope.checkStus.length; index++) {
                                            db.collection("點數").doc(ClassID).collection($scope.checkStus[index]).doc("點數歷程記錄").collection("點數歷程記錄")
                                            .add({
                                                content: $scope.AddBtnPopup.content,
                                                point: paswLock($scope.AddBtnPopup.point),
                                                check: pointID,
                                                time: $scope.AddBtnPopup.time
                                            })
                                            .then(function(data) {
                                                console.log("加分 - 上傳伺服器成功");
                                            })
                                            .catch(function(error) {
                                                console.error("加分 - 上傳伺服器失敗：", error);
                                            });
                                        }
                                    }
                                }
                            }]
                        });
                    };

                    // 點數排行榜 - 更新排行榜
                    $scope.update = function() {
                        // 點數排序
                        $scope.StuPoints = $scope.StuPoints.sort(function (a, b) {
                            return a.Point < b.Point ? 1 : -1;
                        });
                        // 取前五
                        var StuPoints = [];
                        for (let index = 0; index < 5; index++) {
                            StuPoints.push({
                                StuID: $scope.StuPoints[index].StuID,
                                Point: $scope.StuPoints[index].Point
                            });
                        }
                        // 上傳排行榜
                        db.collection("點數").doc(ClassID)
                        .set({
                            top: StuPoints,
                            UpdateTime: new Date()
                        })
                        .then(function(data) {
                            console.log("更新排行榜成功");
                            $ionicPopup.alert({
                                title: '完成',
                                template: 
                                    '更新排行榜成功。<br>'+
                                    '第一名 '+StuPoints[0].StuID+' 共 '+StuPoints[0].Point+'點<br>'+
                                    '第二名 '+StuPoints[1].StuID+' 共 '+StuPoints[1].Point+'點<br>'+
                                    '第三名 '+StuPoints[2].StuID+' 共 '+StuPoints[2].Point+'點<br>'+
                                    '第四名 '+StuPoints[3].StuID+' 共 '+StuPoints[3].Point+'點<br>'+
                                    '第五名 '+StuPoints[4].StuID+' 共 '+StuPoints[4].Point+'點'
                            });
                        })
                        .catch(function(error) {
                            console.error("更新排行榜失敗：", error);
                            $ionicPopup.alert({
                                title: '錯誤',
                                template: '更新排行榜失敗。'
                            });
                        });
                    };

                    $scope.messages = [];
                    // 班級留言版 - 監聽
                    db.collection("留言版").doc(ClassID).collection("messages").orderBy("time","asc")
                    .onSnapshot(function(querySnapshot) {
                        querySnapshot.docChanges().forEach(function(change) {
                            if (change.type === "added") {
                                // 查詢圖片檔名
                                db.collection("帳號").doc(change.doc.data().StuID)
                                .get().then(function(results) {
                                    var storage = firebase.storage();
                                    var storageRef = storage.ref();
                                    storageRef.child('members/'+results.data().Img).getDownloadURL().then(function(url) {
                                        // 放入留言版內容
                                        $scope.messages.push({
                                            messageName:change.doc.data().StuID + ' ' + change.doc.data().StuName,
                                            messageImg:url,
                                            messageContent:change.doc.data().content,
                                            time:change.doc.data().time
                                        });

                                        $scope.$apply(); //重新監聽view
                                        // 滑至最底
                                        var objDiv = document.getElementById("scroll_doc");
                                        objDiv.scrollTop = objDiv.scrollHeight;
                                    })
                                }).catch(function(error) { 
                                    console.log("查詢圖片檔名發生錯誤：", error); 
                                });
                            }
                            if (change.type === "modified") {
                                console.log("修改: ", change.doc.data());
                            }
                            if (change.type === "removed") {
                                console.log("刪除: ", change.doc.data());
                            }
                        });
                    });

                    $scope.messages2 = [];
                    // 班級匿名留言版 - 監聽
                    db.collection("匿名留言版").doc(ClassID).collection("messages").orderBy("time","asc")
                    .onSnapshot(function(querySnapshot) {
                        querySnapshot.docChanges().forEach(function(change) {
                            if (change.type === "added") {
                                // 查詢圖片檔名
                                db.collection("帳號").doc(change.doc.data().StuID)
                                .get().then(function(results) {
                                    var storage = firebase.storage();
                                    var storageRef = storage.ref();
                                    storageRef.child('members/'+results.data().Img).getDownloadURL().then(function(url) {
                                        var messageName = "匿名";
                                        var messageImg = "https://firebasestorage.googleapis.com/v0/b/co-writing-test.appspot.com/o/members%2Fdefault?alt=media&token=e511b185-cd79-47e2-b501-e026fd8da387";
                                        // 判斷是否是老師
                                        if (change.doc.data().StuID=="ROOT") {
                                            messageName = change.doc.data().StuID + ' ' + change.doc.data().StuName;
                                            messageImg = url;
                                        }
                                        // 放入留言版內容
                                        $scope.messages2.push({
                                            messageName:messageName,
                                            messageImg:messageImg,
                                            messageContent:change.doc.data().content,
                                            time:change.doc.data().time
                                        });

                                        $scope.$apply(); //重新監聽view
                                        // 滑至最底
                                        var objDiv = document.getElementById("scroll_doc2");
                                        objDiv.scrollTop = objDiv.scrollHeight;
                                    });
                                }).catch(function(error) { 
                                    console.log("查詢圖片檔名發生錯誤：", error); 
                                });
                            }
                            if (change.type === "modified") {
                                console.log("修改: ", change.doc.data());
                            }
                            if (change.type === "removed") {
                                console.log("刪除: ", change.doc.data());
                            }
                        });
                    });

                    // 班級匿名留言版 - 新增留言
                    $scope.addMessage = function(Nun,content) {
                        $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner><p>新增中...</p>'});
                        console.log("1");
                        // 判斷是否是在匿名版
                        if (Nun==2) {
                            if (content!=undefined && content!="") {
                                db.collection("匿名留言版").doc(ClassID).collection("messages")
                                .add({
                                    StuID: "ROOT",
                                    StuName: "劉勇志 老師",
                                    content: content,
                                    time: new Date()
                                })
                                .then(function(data) {
                                    console.log("新增留言成功");
                                })
                                .catch(function(error) {
                                    console.error("新增留言失敗：", error);
                                });
                                $scope.inputMessage2 = "";
                            }
                        } else if(Nun==1) {
                            console.log("2"+content);
                            if (content!=undefined && content!="") {
                                db.collection("留言版").doc(ClassID).collection("messages")
                                .add({
                                    StuID: "ROOT",
                                    StuName: "劉勇志 老師",
                                    content: content,
                                    time: new Date()
                                })
                                .then(function(data) {
                                    console.log("新增留言成功");
                                })
                                .catch(function(error) {
                                    console.error("新增留言失敗：", error);
                                });
                                $scope.inputMessage = "";
                            }
                        }
                        $ionicLoading.hide();
                    };

                } else {
                    // 提醒
                    $ionicPopup.alert({
                        title: '錯誤',
                        template: '請選擇課程。'
                    });
                }
            };

        }else{
            console.log("非管理員");
            $state.go("login");
            // window.location.reload();
        }
    });
}])

// ----------------------------------------教師版分組狀態----------------------------------------
.controller('root_groupCtrl', ['$scope', '$stateParams', '$state', '$ionicLoading',
function ($scope, $stateParams, $state, $ionicLoading) {
    var db = firebase.firestore();
    // 驗證登入
    firebase.auth().onAuthStateChanged((user) => {
        if (user.uid==="eTlMITVmGbSStEQ7B7jw9rIl20N2") { //登入成功，取得使用者
            console.log("已登入狀態");
            $scope.cardShow = false;
            
            // 列出全部課程
            db.collection("課程")
            .get().then(function (querySnapshot) {
                $scope.AllClass = [];
                querySnapshot.forEach(function (doc) {
                    $scope.AllClass.push(doc.data());
                    $state.go($state.current, {}, {reload: true}); //重新載入view
                });
            });

            // 按下課程
            $scope.choose_class = function(ClassID,ClassName) {
                $scope.cardShow = false;
                $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner><p>載入資料中...</p>'});

                // 取得課程設定資訊
                // 用findIndex找出位置
                var indexNum = $scope.AllClass.findIndex((element)=>{
                    return (element.ClassID === ClassID);
                });
                $scope.thisClass = $scope.AllClass[indexNum];
                console.log($scope.thisClass);

                // 取得分組狀態
                $scope.Allgroups = [];
                // 未分組的人
                var Ngroup = [];
                db.collection("分組").doc(ClassID).collection("student").where("grouped", "==", false)
                .get().then(function (querySnapshot) {
                    querySnapshot.forEach(function (doc) {
                        // 查詢姓名
                        db.collection("帳號").doc(doc.id)
                        .get().then(function(results) {
                            Ngroup.push(doc.id+results.data().Name);
                        }).catch(function(error) { 
                            console.log("查詢姓名發生錯誤：", error); 
                        });
                    });
                    // 已分組的人
                    var Ygroup = [];
                    db.collection("分組").doc(ClassID).collection("student").where("grouped", "==", true)
                    .get().then(function (querySnapshot) {
                        querySnapshot.forEach(function (doc) {
                            Ygroup.push(doc.id);
                        });
                        $scope.Allgroups = [{ClassName:ClassName,Ngroup:Ngroup,Ygroup:Ygroup}];
                        // 繪製環形圖
                        var dom = document.getElementById("Chart_group");
                        var myChart = echarts.init(dom);
                        var app = {};
                        option = null;
                        app.title = '環形圖';
                        option = {
                            tooltip: {
                                trigger: 'item',
                                formatter: "{a} <br/>{b}: {c} ({d}%)"
                            },
                            legend: {
                                orient: 'vertical',
                                x: 'left',
                                data:['未分組','已分組']
                            },
                            series: [
                                {
                                    name:'分組狀態',
                                    type:'pie',
                                    radius: ['50%', '70%'],
                                    avoidLabelOverlap: false,
                                    label: {
                                        normal: {
                                            show: false,
                                            position: 'center'
                                        },
                                        emphasis: {
                                            show: true,
                                            textStyle: {
                                                fontSize: '15',
                                                fontWeight: 'bold'
                                            }
                                        }
                                    },
                                    labelLine: {
                                        normal: {
                                            show: false
                                        }
                                    },
                                    data:[
                                        {value:Ngroup.length, name:'未分組'},
                                        {value:Ygroup.length, name:'已分組'}
                                    ]
                                }
                            ]
                        };
                        if (option && typeof option === "object") {
                            myChart.setOption(option, true);
                        }

                        $scope.cardShow = true;
                        $ionicLoading.hide();
                        $state.go($state.current, {}, {reload: true}); //重新載入view
                    });
                });

                // 取得組別組員名單
                $scope.Allgroups2 = [];
                db.collection("分組").doc(ClassID).collection("group")
                .get().then(function (querySnapshot) {
                    querySnapshot.forEach(function (doc) {
                        var a = doc.data();
                        for (let index = 0; index < doc.data().members.length; index++) {
                            // 查詢姓名
                            db.collection("帳號").doc(doc.data().members[index])
                            .get().then(function(results) {
                                a.members[index] += results.data().Name;
                            }).catch(function(error) { 
                                console.log("查詢姓名發生錯誤：", error); 
                            });
                        }
                        $scope.Allgroups2.push(a);
                        $state.go($state.current, {}, {reload: true}); //重新載入view
                    });
                });
            };

            // 設定 - 開放學生自行分組
            $scope.LockGroupChange = function(ClassID,inviteLock) {
                // 更新inviteLock
                db.collection("課程").doc(ClassID)
                .update({
                    inviteLock: inviteLock
                })
                .then(function(data) {
                    console.log("更新inviteLock成功");
                })
                .catch(function(error) {
                    console.error("更新inviteLock失敗：", error);
                });
            };

            // 設定 - 小組人數上限
            $scope.maxMembersChange = function(ClassID,maxMembers) {
                // 更新maxMembers
                db.collection("課程").doc(ClassID)
                .update({
                    maxMembers: maxMembers
                })
                .then(function(data) {
                    console.log("更新maxMembers成功");
                })
                .catch(function(error) {
                    console.error("更新maxMembers失敗：", error);
                });
            };

        }else{
            console.log("尚未登入");
            $state.go("login");
            // window.location.reload();
        }
    });
}])

// ----------------------------------------教師版課程任務----------------------------------------
.controller('root_missionCtrl', ['$scope', '$stateParams', '$state', '$ionicPopup', '$sce',
function ($scope, $stateParams, $state, $ionicPopup, $sce) {
    var db = firebase.firestore();
    // 驗證登入
    firebase.auth().onAuthStateChanged((user) => {
        if (user.uid==="eTlMITVmGbSStEQ7B7jw9rIl20N2") { //登入成功，取得使用者
            console.log("已登入狀態");
            $scope.cardShow = false;

            // 列出全部課程
            db.collection("課程")
            .get().then(function (querySnapshot) {
                $scope.AllClass = [];
                querySnapshot.forEach(function (doc) {
                    $scope.AllClass.push(doc.data());
                    $state.go($state.current, {}, {reload: true}); //重新載入view
                });
                console.log($scope.AllClass);
            });

            // 選擇課程 - 選擇中
            $scope.hide = function() {
                $scope.cardShow = false;
            };

            // 選擇課程 - 選擇完成
            $scope.SelectBtn = function(value) {
                if (value!=undefined) {
                    var ClassID = value.ClassID;
                    var StuID = "教師版";
                    $scope.cardShow = true;

                    // 監聽 - 載入所有任務
                    $scope.missions = [];
                    db.collection("課程任務").doc(ClassID).collection("任務列表")
                    .onSnapshot(function(querySnapshot) {
                        querySnapshot.docChanges().forEach(function(change) {
                            if (change.type === "added") {
                                // 判斷是否 關閉3 完成1 過期2
                                var lock = 0;
                                if (change.doc.data().lock == true){
                                    lock = 3;
                                } else if (change.doc.data().finished.indexOf(StuID)!=-1){
                                    lock = 1;
                                } else if (change.doc.data().TimeOut.toDate() < new Date()){
                                    lock = 2;
                                }
                                // Month轉換格式為數字(Number) Date判斷補0(if) HTML轉換格式為HTML($sce)
                                var pushMonth = Number(change.doc.data().TimeOut.toDate().getMonth())+1;
                                if (pushMonth<=9) {
                                    pushMonth = '0'+pushMonth;
                                }
                                var pushDate = change.doc.data().TimeOut.toDate().getDate();
                                if (pushDate<=9) {
                                    pushDate = '0'+pushDate;
                                }
                                $scope.missions.push({
                                    missionID:change.doc.id,
                                    Name:change.doc.data().Name,
                                    Content:change.doc.data().Content,
                                    TimeOut:change.doc.data().TimeOut.toDate().getUTCFullYear()+'/'+
                                            pushMonth+'/'+
                                            pushDate,
                                    LeaderOnly:change.doc.data().LeaderOnly,
                                    type:change.doc.data().type,
                                    Point:change.doc.data().Point,
                                    finished:change.doc.data().finished,
                                    HTML:$sce.trustAsHtml(change.doc.data().HTML),
                                    time:change.doc.data().time,
                                    lock:lock,
                                    show:false,
                                    isIRS:change.doc.data().isIRS,
                                    showMsg:'查看更多'
                                });
                                $scope.$apply(); //重新監聽view
                                console.log("新增: ", $scope.missions);
                            } else if (change.type === "modified") {
                                console.log("修改: ", change.doc.data());
                                // 用findIndex找出要修改的位置
                                var indexNum = $scope.missions.findIndex((element)=>{
                                    return (element.time.seconds === change.doc.data().time.seconds) & (element.time.nanoseconds === change.doc.data().time.nanoseconds);
                                });
                                // 修改
                                if (indexNum!=-1) {
                                    // 判斷是否 關閉3 完成1 過期2
                                    var lock = 0;
                                    if (change.doc.data().lock == true){
                                        lock = 3;
                                    } else if (change.doc.data().finished.indexOf(StuID)!=-1){
                                        lock = 1;
                                    } else if (change.doc.data().TimeOut.toDate() < new Date()){
                                        lock = 2;
                                    }
                                    $scope.missions[indexNum].lock = lock;
                                    console.log("修改任務成功");
                                }else{
                                    console.log("修改任務不成功");
                                }
                                $scope.$apply(); //重新監聽view
                            } else if (change.type === "removed") {
                                console.log("刪除: ", change.doc.data());
                                // 用findIndex找出要刪除的位置
                                var indexNum = $scope.missions.findIndex((element)=>{
                                    return (element.time.seconds === change.doc.data().time.seconds) & (element.time.nanoseconds === change.doc.data().time.nanoseconds);
                                });
                                // 刪除
                                if (indexNum!=-1) {
                                    $scope.missions.splice(indexNum,1);
                                    console.log("刪除任務成功");
                                }else{
                                    console.log("刪除任務不成功");
                                }
                                $scope.$apply(); //重新監聽view
                            }
                        });
                    });

                    // 新增任務
                    $scope.AddBtn = function(value) {
                        // 設定預設質
                        $scope.AddBtnPopup = [];
                        $scope.AddBtnPopup.IRS = [];
                        $scope.AddBtnPopup.LeaderOnly = false;
                        $scope.AddBtnPopup.isIRS = false;
                        $scope.AddBtnPopup.IRS.testStart = false;
                        $scope.AddBtnPopup.HTML = "";
                        $scope.AddBtnPopup.IRS.questions = "";
                        var ClassID = value.ClassID;

                        // 新增任務 - 跳出泡泡
                        $ionicPopup.show({
                            title: '新增任務',
                            template: 
                                '<label class="item item-input item-input">'+
                                    '<div class="input-label">任務名稱</div>'+
                                    '<input type="text" ng-model="AddBtnPopup.Name" placeholder="輸入任務名稱（限15字內）" maxlength="15">'+    
                                '</label>'+

                                '<label class="item item-input item-input">'+
                                    '<div class="input-label">任務簡介</div>'+
                                    '<input type="text" ng-model="AddBtnPopup.Content" placeholder="輸入任務簡介（不限字數）">'+    
                                '</label>'+

                                '<label class="item item-input item-input">'+
                                    '<div class="input-label">完成點數</div>'+
                                    '<input type="number" ng-model="AddBtnPopup.Point" placeholder="輸入數字">'+    
                                '</label>'+
                                
                                '<label class="item item-input item-select">'+
                                    '<div class="input-label">任務類型</div>'+
                                    '<select ng-model="AddBtnPopup.type">'+
                                        '<option value="隨堂測驗">隨堂測驗</option>'+
                                        '<option value="小組討論">小組討論</option>'+
                                        '<option value="加分問卷">加分問卷</option>'+
                                        '<option value="評分">評分</option>'+
                                    '</select>'+
                                '</label>'+

                                '<label class="item item-input item-select">'+
                                    '<div class="input-label">截止日期</div>'+
                                    '<input type="date" ng-model="AddBtnPopup.TimeOut">'+    
                                '</label>'+

                                '<ion-toggle ng-model="AddBtnPopup.LeaderOnly">是否僅限組長執行</ion-toggle>'+

                                '<ion-toggle ng-model="AddBtnPopup.isIRS">是否需要使用IRS</ion-toggle>'+

                                '<label ng-show="!AddBtnPopup.isIRS" class="item item-input item-input">'+
                                    '<div class="input-label">HTML</div>'+
                                    '<textarea cols="50" rows="5" ng-model="AddBtnPopup.HTML" placeholder="輸入HTML。"></textarea>'+
                                '</label>'+
                                
                                // IRS欄位
                                '<div ng-show="AddBtnPopup.isIRS">'+

                                    '<label class="item item-input item-input">'+
                                        '<div class="input-label">考題上傳</div>'+
                                        '<textarea cols="50" rows="5" ng-model="AddBtnPopup.IRS.questions" placeholder="輸入考題(ex:{})。"></textarea>'+
                                    '</label>'+

                                    '<label class="item item-input item-input">'+
                                        '<div class="input-label">測驗時間</div>'+
                                        '<input type="number" ng-model="AddBtnPopup.IRS.stageTime" placeholder="輸入數字(單位秒)">'+    
                                    '</label>'+

                                    '<ion-toggle ng-model="AddBtnPopup.IRS.testStart">開啟測驗</ion-toggle>'+

                                '</div>',
                                
                            scope: $scope,
                            buttons: [{
                                text: '取消',
                                type: 'button-default',
                                onTap: function(e) {
                                    console.log('選擇取消');
                                }
                            }, {
                                text: '新增',
                                type: 'button-chanry1',
                                onTap: function(e) {
                                    console.log('選擇新增');
                                    // 判斷是否必填未填
                                    if ($scope.AddBtnPopup.Name==undefined||$scope.AddBtnPopup.type==undefined||$scope.AddBtnPopup.TimeOut==undefined||$scope.AddBtnPopup.LeaderOnly==undefined) {
                                        console.log("請填寫完整");
                                        $ionicPopup.alert({
                                            title: '錯誤',
                                            template: '請填寫完整。'
                                        });
                                    } else {
                                        // 將截止日期設為當天晚上23:59:59
                                        $scope.AddBtnPopup.TimeOut=$scope.AddBtnPopup.TimeOut.setHours(23,59,59);
                                        $scope.AddBtnPopup.TimeOut=new Date($scope.AddBtnPopup.TimeOut);
                                        // 新增任務
                                        db.collection("課程任務").doc(ClassID).collection("任務列表")
                                        .add({
                                            Name: $scope.AddBtnPopup.Name,
                                            Content: $scope.AddBtnPopup.Content,
                                            type: $scope.AddBtnPopup.type,
                                            Point: $scope.AddBtnPopup.Point,
                                            TimeOut: $scope.AddBtnPopup.TimeOut,
                                            LeaderOnly: $scope.AddBtnPopup.LeaderOnly,
                                            isIRS: $scope.AddBtnPopup.isIRS,
                                            HTML: $scope.AddBtnPopup.HTML,
                                            finished: [],
                                            lock: false,
                                            time: new Date()
                                        })
                                        .then(function(data) {
                                            console.log("新增任務成功");
                                            // 判斷是否新增IRS
                                            if ($scope.AddBtnPopup.isIRS) {
                                                // 假資料....................................
                                                $scope.AddBtnPopup.IRS.questions = [
                                                    // { indexReal:1, question: '本週章節名稱是：', optionA:'資訊管理的基本概念與架構', optionB:'資訊管理的科技觀點', optionC:'資訊管理的應用系統面觀點', optionD:'整合性的企業系統—ERP、CRM與SCM', answer:1 },
                                                    // { indexReal:2, question: '「資訊科技」、「經濟環境」與「產業結構」的關係是：', optionA:'三者有交互影響關係', optionB:'三者之間沒有關係', optionC:'只有資訊科技與經濟環境有關係', optionD:'只有經濟環境與產業結構有關係', answer:1 },
                                                    // { indexReal:3, question: '在資通訊科技所促成的新經濟體系中，從「人工作業」變成「電腦作業」的典範轉移，一般稱為：', optionA:'資訊化', optionB:'智慧化', optionC:'虛擬化', optionD:'網路化', answer:1 },
                                                    // { indexReal:4, question: '下列何者不是資訊科技演化相關的定律？', optionA:'運動定律', optionB:'摩爾定律', optionC:'吉爾德定律', optionD:'貝爾定律', answer:1 },
                                                    // { indexReal:5, question: '關於MIS的重要性敘述，何者正確？', optionA:'投資大', optionB:'提升生產力', optionC:'創造競爭優勢', optionD:'所述皆是', answer:4 },
                                                    // { indexReal:6, question: '當我們提到硬體、軟體、資料庫或網路時，指的是MIS知識中哪一方面的議題？', optionA:'IT基礎設施', optionB:'企業的資訊應用系統', optionC:'ABIC四大科技', optionD:'資訊管理', answer:1 }
                                                    { indexReal:1, question: '本學年度為？', optionA:'106', optionB:'107', optionC:'108', optionD:'109', answer:3 },
                                                    { indexReal:2, question: '資管系系主任是：', optionA:'汪素卿', optionB:'賴俊男', optionC:'黃奇俊', optionD:'賴正男', answer:4 },
                                                    { indexReal:3, question: '本堂課名稱為：', optionA:'管理資訊系統', optionB:'管理學', optionC:'專家管理', optionD:'專案管理', answer:1 },
                                                    { indexReal:4, question: '下列何者是高科大正確的校區名？', optionA:'光復', optionB:'新興', optionC:'旗津', optionD:'六龜', answer:3 },
                                                    { indexReal:5, question: '本系本系系辦的人員有？', optionA:'柯大哥', optionB:'鯰魚哥', optionC:'柱柱姐', optionD:'柯P學姐', answer:1 },
                                                    { indexReal:6, question: '本系比較不帥的老師是：', optionA:'劉勇志', optionB:'陳信榮', optionC:'王馨葦', optionD:'黃國璽', answer:3 }
                                                ]
                                                // 新增IRS
                                                db.collection("IRS").doc(ClassID).collection("測驗列表").doc(data.id)
                                                .set({
                                                    Name: $scope.AddBtnPopup.Name,
                                                    questions: $scope.AddBtnPopup.IRS.questions,
                                                    stageTime: $scope.AddBtnPopup.IRS.stageTime * 1000,
                                                    testStart: $scope.AddBtnPopup.IRS.testStart
                                                })
                                                .then(function(data) {
                                                    console.log("新增IRS成功");
                                                })
                                                .catch(function(error) {
                                                    console.error("新增IRS失敗：", error);
                                                });
                                            }
                                        })
                                        .catch(function(error) {
                                            console.error("新增任務失敗：", error);
                                        });
                                    }
                                }
                            }]
                        });
                    };

                    // 查看更多按鈕
                    $scope.missionShow = function(doc){
                        // 用findIndex找出要修改的位置
                        var indexNum = $scope.missions.findIndex((element)=>{
                            return (element.$$hashKey === doc.$$hashKey);
                        });
                        // 修改
                        if (indexNum!=-1) {
                            if ($scope.missions[indexNum].show) {
                                $scope.missions[indexNum].show = false;
                                $scope.missions[indexNum].showMsg = '查看更多';
                            } else {
                                $scope.missions[indexNum].show = true;
                                $scope.missions[indexNum].showMsg = '收合內容';
                            }
                            console.log("修改顯示成功");
                        }else{
                            console.log("修改顯示不成功");
                        }
                    };

                    // 回傳填答結果
                    $scope.response = {};
                    $scope.responseBtn = function(missionID){
                        // 回傳伺服器
                        db.collection("課程任務").doc(ClassID).collection("任務列表").doc(missionID).collection("填答結果")
                        .add({
                            StuID: StuID,
                            missionID: missionID,
                            response: $scope.response,
                            time: new Date()
                        })
                        .then(function(data) {
                            console.log("回傳填答結果成功");
                        })
                        .catch(function(error) {
                            console.error("回傳填答結果失敗：", error);
                        });
                    };

                    // 匯出資料
                    function sheet2blob(sheet, sheetName) {
                        sheetName = sheetName || 'sheet1';
                        var workbook = {
                            SheetNames: [sheetName],
                            Sheets: {}
                        };
                        workbook.Sheets[sheetName] = sheet;
                        // 生成excel的配置项
                        var wopts = {
                            bookType: 'xlsx', // 要生成的文件类型
                            bookSST: false, // 是否生成Shared String Table，官方解释是，如果开启生成速度会下降，但在低版本IOS设备上有更好的兼容性
                            type: 'binary'
                        };
                        var wbout = XLSX.write(workbook, wopts);
                        var blob = new Blob([s2ab(wbout)], {type:"application/octet-stream"});
                        // 字符串转ArrayBuffer
                        function s2ab(s) {
                            var buf = new ArrayBuffer(s.length);
                            var view = new Uint8Array(buf);
                            for (var i=0; i!=s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
                            return buf;
                        }
                        return blob;
                    }
                    function openDownloadDialog(url, saveName)
                    {
                        if(typeof url == 'object' && url instanceof Blob)
                        {
                            url = URL.createObjectURL(url); // 创建blob地址
                        }
                        var aLink = document.createElement('a');
                        aLink.href = url;
                        aLink.download = saveName || ''; // HTML5新增的属性，指定保存文件名，可以不要后缀，注意，file:///模式下不会生效
                        var event;
                        if(window.MouseEvent) event = new MouseEvent('click');
                        else
                        {
                            event = document.createEvent('MouseEvents');
                            event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
                        }
                        aLink.dispatchEvent(event);
                    }
                    var items = [];
                    // 匯出填答結果
                    // db.collection("課程任務").doc(ClassID).collection("任務列表").doc("Q3Ufw0Ztklnu0hSDUtMe").collection("填答結果")
                    // .get().then(function(results) {
                    //     items.push(["學號","組員1","第一題","第二題","第三題","第四題","第五題","第六題","第七題","時間"]);
                    //     // items.push(["組長","組員","版本","第一題","第二題","第三題","第四題","第五題","提案","時間"]);
                    //     // items.push(["學號","版本","第一題","第二題","第三題","時間"]);
                    //     results.forEach(function (doc) {
                    //         // Month轉換格式為數字(Number) Date判斷補0(if) HTML轉換格式為HTML($sce)
                    //         var pushMonth = Number(doc.data().time.toDate().getMonth())+1;
                    //         if (pushMonth<=9) {
                    //             pushMonth = '0'+pushMonth;
                    //         }
                    //         var pushDate = doc.data().time.toDate().getDate();
                    //         if (pushDate<=9) {
                    //             pushDate = '0'+pushDate;
                    //         }

                    //         // 查詢姓名
                    //         db.collection("帳號").doc(doc.data().StuID)
                    //         .get().then(function(a) {
                    //             // 課後學習心得與反思
                    //             // items.push([
                    //             //     doc.data().StuID + a.data().Name,
                    //             //     "V2",
                    //             //     doc.data().response.question6,
                    //             //     doc.data().response.question7,
                    //             //     doc.data().response.question8,
                    //             //     doc.data().time.toDate().getUTCFullYear()+'/'+
                    //             //     pushMonth+'/'+
                    //             //     pushDate,
                    //             // ]);
                                
                    //             // 分組提案計畫評分
                    //             // items.push([
                    //             //     doc.data().StuID + a.data().Name,
                    //             //     "期中前",
                    //             //     Object.keys(doc.data().response),
                    //             //     Object.values(doc.data().response)[0].E,
                    //             //     Object.values(doc.data().response)[1].E,
                    //             //     Object.values(doc.data().response)[2].E,
                    //             //     Object.values(doc.data().response)[3].E,
                    //             //     Object.values(doc.data().response)[4].E,
                    //             //     Object.values(doc.data().response)[5].E,
                    //             //     Object.values(doc.data().response)[6].E,
                    //             //     Object.values(doc.data().response)[7].E,
                    //             //     Object.values(doc.data().response)[8].E,
                    //             //     Object.values(doc.data().response)[9].E,
                    //             //     doc.data().time.toDate().getUTCFullYear()+'/'+
                    //             //     pushMonth+'/'+
                    //             //     pushDate,
                    //             // ]);

                    //             // 組內自評、互評
                    //             if (Object.keys(doc.data().response)[4]!=undefined) {
                    //                 items.push([
                    //                     doc.data().StuID + a.data().Name,
                    //                     Object.keys(doc.data().response)[0],
                    //                     Object.values(doc.data().response)[0].A,
                    //                     Object.values(doc.data().response)[0].B,
                    //                     Object.values(doc.data().response)[0].C,
                    //                     Object.values(doc.data().response)[0].D,
                    //                     Object.values(doc.data().response)[0].E,
                    //                     Object.values(doc.data().response)[0].F,
                    //                     Object.values(doc.data().response)[0].G,
                    //                     Object.keys(doc.data().response)[1],
                    //                     Object.values(doc.data().response)[1].A,
                    //                     Object.values(doc.data().response)[1].B,
                    //                     Object.values(doc.data().response)[1].C,
                    //                     Object.values(doc.data().response)[1].D,
                    //                     Object.values(doc.data().response)[1].E,
                    //                     Object.values(doc.data().response)[1].F,
                    //                     Object.values(doc.data().response)[1].G,
                    //                     Object.keys(doc.data().response)[2],
                    //                     Object.values(doc.data().response)[2].A,
                    //                     Object.values(doc.data().response)[2].B,
                    //                     Object.values(doc.data().response)[2].C,
                    //                     Object.values(doc.data().response)[2].D,
                    //                     Object.values(doc.data().response)[2].E,
                    //                     Object.values(doc.data().response)[2].F,
                    //                     Object.values(doc.data().response)[2].G,
                    //                     Object.keys(doc.data().response)[3],
                    //                     Object.values(doc.data().response)[3].A,
                    //                     Object.values(doc.data().response)[3].B,
                    //                     Object.values(doc.data().response)[3].C,
                    //                     Object.values(doc.data().response)[3].D,
                    //                     Object.values(doc.data().response)[3].E,
                    //                     Object.values(doc.data().response)[3].F,
                    //                     Object.values(doc.data().response)[3].G,
                    //                     Object.keys(doc.data().response)[4],
                    //                     Object.values(doc.data().response)[4].A,
                    //                     Object.values(doc.data().response)[4].B,
                    //                     Object.values(doc.data().response)[4].C,
                    //                     Object.values(doc.data().response)[4].D,
                    //                     Object.values(doc.data().response)[4].E,
                    //                     Object.values(doc.data().response)[4].F,
                    //                     Object.values(doc.data().response)[4].G,
                    //                     doc.data().time.toDate().getUTCFullYear()+'/'+
                    //                     pushMonth+'/'+
                    //                     pushDate,
                    //                 ]);
                    //             } else if(Object.keys(doc.data().response)[3]!=undefined) {
                    //                 items.push([
                    //                     doc.data().StuID + a.data().Name,
                    //                     Object.keys(doc.data().response)[0],
                    //                     Object.values(doc.data().response)[0].A,
                    //                     Object.values(doc.data().response)[0].B,
                    //                     Object.values(doc.data().response)[0].C,
                    //                     Object.values(doc.data().response)[0].D,
                    //                     Object.values(doc.data().response)[0].E,
                    //                     Object.values(doc.data().response)[0].F,
                    //                     Object.values(doc.data().response)[0].G,
                    //                     Object.keys(doc.data().response)[1],
                    //                     Object.values(doc.data().response)[1].A,
                    //                     Object.values(doc.data().response)[1].B,
                    //                     Object.values(doc.data().response)[1].C,
                    //                     Object.values(doc.data().response)[1].D,
                    //                     Object.values(doc.data().response)[1].E,
                    //                     Object.values(doc.data().response)[1].F,
                    //                     Object.values(doc.data().response)[1].G,
                    //                     Object.keys(doc.data().response)[2],
                    //                     Object.values(doc.data().response)[2].A,
                    //                     Object.values(doc.data().response)[2].B,
                    //                     Object.values(doc.data().response)[2].C,
                    //                     Object.values(doc.data().response)[2].D,
                    //                     Object.values(doc.data().response)[2].E,
                    //                     Object.values(doc.data().response)[2].F,
                    //                     Object.values(doc.data().response)[2].G,
                    //                     Object.keys(doc.data().response)[3],
                    //                     Object.values(doc.data().response)[3].A,
                    //                     Object.values(doc.data().response)[3].B,
                    //                     Object.values(doc.data().response)[3].C,
                    //                     Object.values(doc.data().response)[3].D,
                    //                     Object.values(doc.data().response)[3].E,
                    //                     Object.values(doc.data().response)[3].F,
                    //                     Object.values(doc.data().response)[3].G,
                    //                     doc.data().time.toDate().getUTCFullYear()+'/'+
                    //                     pushMonth+'/'+
                    //                     pushDate,
                    //                 ]);
                    //             } else if(Object.keys(doc.data().response)[2]!=undefined) {
                    //                 items.push([
                    //                     doc.data().StuID + a.data().Name,
                    //                     Object.keys(doc.data().response)[0],
                    //                     Object.values(doc.data().response)[0].A,
                    //                     Object.values(doc.data().response)[0].B,
                    //                     Object.values(doc.data().response)[0].C,
                    //                     Object.values(doc.data().response)[0].D,
                    //                     Object.values(doc.data().response)[0].E,
                    //                     Object.values(doc.data().response)[0].F,
                    //                     Object.values(doc.data().response)[0].G,
                    //                     Object.keys(doc.data().response)[1],
                    //                     Object.values(doc.data().response)[1].A,
                    //                     Object.values(doc.data().response)[1].B,
                    //                     Object.values(doc.data().response)[1].C,
                    //                     Object.values(doc.data().response)[1].D,
                    //                     Object.values(doc.data().response)[1].E,
                    //                     Object.values(doc.data().response)[1].F,
                    //                     Object.values(doc.data().response)[1].G,
                    //                     Object.keys(doc.data().response)[2],
                    //                     Object.values(doc.data().response)[2].A,
                    //                     Object.values(doc.data().response)[2].B,
                    //                     Object.values(doc.data().response)[2].C,
                    //                     Object.values(doc.data().response)[2].D,
                    //                     Object.values(doc.data().response)[2].E,
                    //                     Object.values(doc.data().response)[2].F,
                    //                     Object.values(doc.data().response)[2].G,
                    //                     doc.data().time.toDate().getUTCFullYear()+'/'+
                    //                     pushMonth+'/'+
                    //                     pushDate,
                    //                 ]);
                    //             } else if(Object.keys(doc.data().response)[1]!=undefined) {
                    //                 items.push([
                    //                     doc.data().StuID + a.data().Name,
                    //                     Object.keys(doc.data().response)[0],
                    //                     Object.values(doc.data().response)[0].A,
                    //                     Object.values(doc.data().response)[0].B,
                    //                     Object.values(doc.data().response)[0].C,
                    //                     Object.values(doc.data().response)[0].D,
                    //                     Object.values(doc.data().response)[0].E,
                    //                     Object.values(doc.data().response)[0].F,
                    //                     Object.values(doc.data().response)[0].G,
                    //                     Object.keys(doc.data().response)[1],
                    //                     Object.values(doc.data().response)[1].A,
                    //                     Object.values(doc.data().response)[1].B,
                    //                     Object.values(doc.data().response)[1].C,
                    //                     Object.values(doc.data().response)[1].D,
                    //                     Object.values(doc.data().response)[1].E,
                    //                     Object.values(doc.data().response)[1].F,
                    //                     Object.values(doc.data().response)[1].G,
                    //                     doc.data().time.toDate().getUTCFullYear()+'/'+
                    //                     pushMonth+'/'+
                    //                     pushDate,
                    //                 ]);
                    //             }
                    //             console.log(items);
                    //         }).catch(function(error) { 
                    //             console.log("查詢姓名發生錯誤：", error); 
                    //         });
                            
                    //         // var proposal = "";
                    //         // // 如果有提案才放
                    //         // if (doc.data().response.proposal!=undefined) {
                    //         //     // 列出所有提案
                    //         //     for (let i = 0; i < doc.data().response.proposal.length; i++) {
                    //         //         var brainstorming = "";
                    //         //         // 列出所有腦力激盪
                    //         //         for (let j = 0; j < doc.data().response.proposal[i].brainstorming.length; j++) {
                    //         //             // 先取得小組ID
                    //         //             db.collection("分組").doc(ClassID).collection("group").where("leader", "==", doc.data().StuID)
                    //         //             .get().then(function(results) {
                    //         //                 results.forEach(function (doc2) {
                    //         //                     // 再用小組ID搜尋腦力激盪名稱
                    //         //                     db.collection("腦力激盪").doc(ClassID).collection(doc2.id).doc(doc.data().response.proposal[i].brainstorming[j])
                    //         //                     .get().then(function(doc3) {
                    //         //                         brainstorming = brainstorming + doc3.data().msg + ",";
                    //         //                         // 判斷最後一筆
                    //         //                         if (j == doc.data().response.proposal[i].brainstorming.length-1) {
                    //         //                             proposal = proposal + doc.data().response.proposal[i].ProposalName + ":" +brainstorming;
                    //         //                             // 判斷最後一筆
                    //         //                             if (i == doc.data().response.proposal.length-1) {
                    //         //                                 proposal = proposal + doc.data().response.proposal[i].ProposalName + ":" +brainstorming;
                    //         //                                 // 取得小組成員
                    //         //                                 db.collection("分組").doc(ClassID).collection("group").where("leader", "==", doc.data().StuID)
                    //         //                                 .get().then(function(results) {
                    //         //                                     results.forEach(function (doc2) {
                    //         //                                         // 總結送出
                    //         //                                         items.push([
                    //         //                                             doc.data().StuID,
                    //         //                                             doc2.data().members,
                    //         //                                             "V1",
                    //         //                                             doc.data().response.question1,
                    //         //                                             doc.data().response.question2,
                    //         //                                             doc.data().response.question3,
                    //         //                                             doc.data().response.question4,
                    //         //                                             doc.data().response.question5,
                    //         //                                             proposal
                    //         //                                         ]);
                    //         //                                     }); 
                    //         //                                 }).catch(function(error) { 
                    //         //                                     console.log("取得小組ID發生錯誤：", error); 
                    //         //                                 }); 
                    //         //                             }
                    //         //                         }
                    //         //                     }).catch(function(error) { 
                    //         //                         console.log("用小組ID搜尋腦力激盪名稱發生錯誤：", error); 
                    //         //                     });
                    //         //                 });
                    //         //             }).catch(function(error) { 
                    //         //                 console.log("取得小組ID發生錯誤：", error); 
                    //         //             });
                    //         //         }
                    //         //     }
                    //         // } else {
                    //             // 取得小組成員
                    //             // db.collection("分組").doc(ClassID).collection("group").where("leader", "==", doc.data().StuID)
                    //             // .get().then(function(results) {
                    //             //     results.forEach(function (doc2) {
                    //             //         var members = "";
                    //             //         for (let index = 0; index < doc2.data().members.length; index++) {
                    //             //             // 查詢姓名
                    //             //             db.collection("帳號").doc(doc2.data().members[index])
                    //             //             .get().then(function(a) {
                    //             //                 members = members + doc2.data().members[index] + a.data().Name + ",";
                    //             //             }).catch(function(error) { 
                    //             //                 console.log("查詢姓名發生錯誤：", error); 
                    //             //             });
                    //             //             // Month轉換格式為數字(Number) Date判斷補0(if) HTML轉換格式為HTML($sce)
                    //             //             var pushMonth = Number(doc.data().time.toDate().getMonth())+1;
                    //             //             if (pushMonth<=9) {
                    //             //                 pushMonth = '0'+pushMonth;
                    //             //             }
                    //             //             var pushDate = doc.data().time.toDate().getDate();
                    //             //             if (pushDate<=9) {
                    //             //                 pushDate = '0'+pushDate;
                    //             //             }
                                            
                    //             //             // 判斷最後一筆
                    //             //             if (index == doc2.data().members.length-1) {
                    //             //                 // 總結送出
                    //             //                 items.push([
                    //             //                     doc.data().StuID,
                    //             //                     members,
                    //             //                     "V3",
                    //             //                     doc.data().response.question1,
                    //             //                     doc.data().response.question2,
                    //             //                     doc.data().response.question3,
                    //             //                     doc.data().response.question4,
                    //             //                     doc.data().response.question5,
                    //             //                     proposal,
                    //             //                     doc.data().time.toDate().getUTCFullYear()+'/'+
                    //             //                     pushMonth+'/'+
                    //             //                     pushDate,
                    //             //                 ]);
                    //             //                 console.log(items);
                    //             //             }
                    //             //         }
                    //             //     }); 
                    //             // }).catch(function(error) { 
                    //             //     console.log("取得小組ID發生錯誤：", error); 
                    //             // }); 
                    //         // }
                    //     });
                    // }).catch(function(error) { 
                    //     console.log("匯出資料發生錯誤：", error); 
                    // });

                    // 匯出腦力激盪 提案聚焦數
                    // 取得小組成員
                    // db.collection("分組").doc(ClassID).collection("group")
                    // .get().then(function(results) {
                    //     items.push(["學號","小組","版本","腦力激盪數量","腦力激盪被採用次數","提案聚焦數量","提案聚焦被採用次數"]);
                    //     results.forEach(function (doc) {
                    //         for (let index = 0; index < doc.data().members.length; index++) {
                    //             // 查詢腦力激盪數 與被採用次數
                    //             // db.collection("腦力激盪").doc(ClassID).collection(doc.id).where("StuID", "==", doc.data().members[index])
                    //             // .get().then(function(results) {
                    //             //     console.log(doc.data().members[index]+'的腦力激盪數：'+results.docs.length);
                    //             //     var count = 0;
                    //             //     results.forEach(function (doc2) {
                    //             //         if (doc2.data().invited==true) {
                    //             //             count++;
                    //             //         }
                    //             //     });
                    //             //     console.log(doc.data().members[index]+'的腦力激盪被採用數：'+count);
                    //             //     items.push([
                    //             //         doc.data().members[index],
                    //             //         doc.id,
                    //             //         "期中前",
                    //             //         results.docs.length,
                    //             //         count,
                    //             //     ]);
                    //             // }).catch(function(error) { 
                    //             //     console.log("查詢腦力激盪數 與被採用次數發生錯誤：", error); 
                    //             // });

                    //             // 查詢提案聚焦數量
                    //             db.collection("提案聚焦").doc(ClassID).collection(doc.id)
                    //             .get().then(function(results) {
                    //                 console.log(doc.id+'小組的提案聚焦數：'+results.docs.length);
                    //                 items.push([
                    //                     doc.data().members[index],
                    //                     doc.id,
                    //                     "期中前",
                    //                     results.docs.length
                    //                 ]);
                    //             }).catch(function(error) { 
                    //                 console.log("查詢查詢提案聚焦數量發生錯誤：", error); 
                    //             });

                    //         }
                    //     }); 
                    // }).catch(function(error) { 
                    //     console.log("取得小組成員發生錯誤：", error); 
                    // }); 

                    

                    // 點按鈕匯出
                    $scope.OutputBtn = function() {
                        var sheet = XLSX.utils.aoa_to_sheet(items);
                        openDownloadDialog(sheet2blob(sheet), '匯出.xlsx');
                    };

                } else {
                    // 提醒
                    $ionicPopup.alert({
                        title: '錯誤',
                        template: '請選擇課程。'
                    });
                }
            };

            // 點擊 狀態 修改 刪除 任務
            $scope.SettingMission = function(type,ClassID,missionID) {
                if (type=='status') {
                    // 查看答題狀態
                    // 監聽 - 取得任務狀態
                    $scope.missionStatus = [];
                    db.collection("課程任務").doc(ClassID).collection("任務列表").doc(missionID)
                    .get().then(function(doc) {
                        // 取得任務狀態
                        $scope.missionStatus = doc.data();
                        $scope.missionStatus.finished = doc.data().finished;
                        $scope.$apply(); //重新監聽view

                        // 取得全班名單
                        $scope.AllStu = [];
                        db.collection("課程").doc(ClassID)
                        .get().then(function (results) {
                            $scope.AllStu = results.data().ClassStu;

                            // 取得未完成名單 (全班名單-已完成名單)
                            $scope.unfinished = $scope.AllStu;
                            // $scope.AllStu //全班
                            // $scope.missionStatus.finished //已完成
                            for (let i = 0; i < $scope.missionStatus.finished.length; i++) {
                                if ($scope.unfinished.indexOf($scope.missionStatus.finished[i])!=-1) {
                                    $scope.unfinished.splice($scope.unfinished.indexOf($scope.missionStatus.finished[i]),1);
                                }
                                // if ($scope.AllStu.indexOf($scope.missionStatus.finished[i])!=-1) {
                                //     $scope.unfinished.splice($scope.AllStu.indexOf($scope.missionStatus.finished[i],1));
                                // }
                                // 判斷最後一筆
                                if (i>=$scope.missionStatus.finished.length-1) {
                                    console.log("最後一筆");
                                    // 完成名單補上姓名
                                    for (let j = 0; j < $scope.missionStatus.finished.length; j++) {
                                        db.collection("帳號").doc($scope.missionStatus.finished[j])
                                        .get().then(function(results) {
                                            $scope.missionStatus.finished[j] = $scope.missionStatus.finished[j]+results.data().Name;
                                            $scope.$apply(); //重新監聽view
                                        }).catch(function(error) { 
                                            console.log("查詢姓名發生錯誤：", error); 
                                        });
                                    }
                                    // 未完成名單補上姓名
                                    for (let j = 0; j < $scope.unfinished.length; j++) {
                                        db.collection("帳號").doc($scope.unfinished[j])
                                        .get().then(function(results) {
                                            $scope.unfinished[j] = $scope.unfinished[j]+results.data().Name;
                                            $scope.$apply(); //重新監聽view
                                        }).catch(function(error) { 
                                            console.log("查詢姓名發生錯誤：", error); 
                                        });
                                    }
                                }
                            }
                        });
                    },function(error) {
                        console.error("取得任務狀態發生錯誤：", error);
                    });

                    // 跳出泡泡
                    $ionicPopup.show({
                        title: '答題狀態(即時監聽)',
                        template: 
                            '<div>'+
                                '<div class="item item-divider">任務名稱</div>'+
                                '<div class="item item-content">{{missionStatus.Name}}</div>'+

                                '<div class="item item-divider">是否限組長</div>'+
                                '<div class="item item-content">{{missionStatus.LeaderOnly}}</div>'+
                                
                                '<div class="item item-divider">人數</div>'+
                                '<div class="item item-content">已完成{{missionStatus.finished.length}}人，未完成{{unfinished.length}}人</div>'+

                                '<div class="item item-divider">已完成名單</div>'+
                                '<div class="item item-content">{{missionStatus.finished}}</div>'+

                                '<div class="item item-divider">未完成名單</div>'+
                                '<div class="item item-content">{{unfinished}}</div>'+
                            '</div>',
                        scope: $scope,
                        buttons: [{
                            text: '關閉',
                            type: 'button-chanry1',
                            onTap: function(e) {
                                console.log('選擇取消');
                            }
                        }]
                    });
                } else if (type=='modify') {

                    // 修改任務 - 載入任務資訊
                    $scope.modifyPopup = [];
                    db.collection("課程任務").doc(ClassID).collection("任務列表").doc(missionID)
                    .get().then(function(results) {
                        $scope.modifyPopup = results.data();
                        $scope.$apply(); //重新監聽view
                    }).catch(function(error) { 
                        console.log("修改任務 - 載入任務資訊發生錯誤：", error); 
                    });

                    // 修改任務 - 跳出泡泡
                    $ionicPopup.show({
                        title: '修改任務',
                        template: 
                            '<label class="item item-input item-input">'+
                                '<div class="input-label">任務名稱</div>'+
                                '<input type="text" ng-model="modifyPopup.Name" placeholder="輸入任務名稱（限15字內）" maxlength="15">'+    
                            '</label>'+

                            '<label class="item item-input item-input">'+
                                '<div class="input-label">任務簡介</div>'+
                                '<input type="text" ng-model="modifyPopup.Content" placeholder="輸入任務簡介（不限字數）">'+    
                            '</label>'+

                            '<label class="item item-input item-input">'+
                                '<div class="input-label">完成點數</div>'+
                                '<input type="number" ng-model="modifyPopup.Point" placeholder="輸入數字">'+    
                            '</label>'+
                            
                            '<label class="item item-input item-select">'+
                                '<div class="input-label">任務類型</div>'+
                                '<select ng-model="modifyPopup.type">'+
                                    '<option value="隨堂測驗">隨堂測驗</option>'+
                                    '<option value="小組討論">小組討論</option>'+
                                    '<option value="加分問卷">加分問卷</option>'+
                                    '<option value="評分">評分</option>'+
                                '</select>'+
                            '</label>'+

                            '<label class="item item-input item-select">'+
                                '<div class="input-label">截止日期</div>'+
                                '<input type="date" ng-model="modifyPopup.TimeOut2">'+    
                            '</label>'+

                            '<ion-toggle ng-model="modifyPopup.LeaderOnly">是否僅限組長執行</ion-toggle>'+

                            '<ion-toggle ng-model="modifyPopup.lock">是否鎖住任務</ion-toggle>'+

                            '<label class="item item-input item-input">'+
                                '<div class="input-label">HTML</div>'+
                                '<textarea cols="50" rows="5" ng-model="modifyPopup.HTML" placeholder="輸入HTML。"></textarea>'+
                            '</label>',
                            
                        scope: $scope,
                        buttons: [{
                            text: '取消',
                            type: 'button-default',
                            onTap: function(e) {
                                console.log('選擇取消');
                            }
                        }, {
                            text: '修改',
                            type: 'button-chanry1',
                            onTap: function(e) {
                                console.log('選擇新增');
                                if ($scope.modifyPopup.TimeOut2==undefined) {
                                    // 請填寫到期日
                                    $ionicPopup.alert({
                                        title: '錯誤',
                                        template: '請填寫到期日。'
                                    });
                                } else {
                                    // 將截止日期設為當天晚上23:59:59
                                    $scope.modifyPopup.TimeOut2=$scope.modifyPopup.TimeOut2.setHours(23,59,59);
                                    $scope.modifyPopup.TimeOut2=new Date($scope.modifyPopup.TimeOut2);
                                    // 修改任務
                                    db.collection("課程任務").doc(ClassID).collection("任務列表").doc(missionID)
                                    .update({
                                        Name: $scope.modifyPopup.Name,
                                        Content: $scope.modifyPopup.Content,
                                        type: $scope.modifyPopup.type,
                                        Point: $scope.modifyPopup.Point,
                                        TimeOut: $scope.modifyPopup.TimeOut2,
                                        LeaderOnly: $scope.modifyPopup.LeaderOnly,
                                        HTML: $scope.modifyPopup.HTML,
                                        lock: $scope.modifyPopup.lock
                                    })
                                    .then(function(data) {
                                        console.log("修改任務成功");
                                    })
                                    .catch(function(error) {
                                        console.error("修改任務失敗：", error);
                                    });
                                }
                            }
                        }]
                    });
                } else if (type=='delete') {
                    // 刪除任務
                    // 跳出泡泡
                    $ionicPopup.confirm({
                        title: '刪除任務',
                        template: '確定要刪除任務嗎?',
                        buttons: [{
                            text: '取消',
                            type: 'button-default',
                            onTap: function(e) {
                                console.log('選擇取消');
                            }
                        }, {
                            text: '刪除',
                            type: 'button-chanry1',
                            onTap: function(e) {
                                console.log('選擇刪除');
                                // 刪除任務資料
                                db.collection("課程任務").doc(ClassID).collection("任務列表").doc(missionID)
                                .delete()
                                .then(function(data) {
                                    console.log("刪除任務資料成功");
                                    $scope.$apply(); //重新監聽view
                                })
                                .catch(function(error) {
                                    console.error("刪除任務資料失敗：", error);
                                });
                            }
                        }]
                    });
                }
            };

            

        }else{
            console.log("尚未登入");
            $state.go("login");
            // window.location.reload();
        }
    });
}])

// ----------------------------------------教師版腦力激盪----------------------------------------
.controller('root_brainstormingCtrl', ['$scope', '$stateParams', '$state', '$ionicPopup', '$ionicLoading',
function ($scope, $stateParams, $state, $ionicPopup, $ionicLoading) {
    var db = firebase.firestore();
    // 驗證登入
    firebase.auth().onAuthStateChanged((user) => {
        if (user.uid==="eTlMITVmGbSStEQ7B7jw9rIl20N2") { //登入成功，取得使用者
            console.log("已登入狀態");
            $scope.cardShow = false;

            // 列出全部課程
            db.collection("課程")
            .get().then(function (querySnapshot) {
                $scope.AllClass = [];
                querySnapshot.forEach(function (doc) {
                    $scope.AllClass.push(doc.data());
                    $state.go($state.current, {}, {reload: true}); //重新載入view
                });
                console.log($scope.AllClass);
            });

            // 選擇課程 - 選擇中
            $scope.hide = function() {
                $scope.cardShow = false;
            };

            // 選擇課程 - 選擇完成
            $scope.SelectBtn = function(value) {
                if (value!=undefined) {
                    var ClassID = value.ClassID;
                    var StuID = "教師版";
                    $scope.cardShow = true;

                    $scope.groups = [];
                    // 取得各組別
                    db.collection("分組").doc(ClassID).collection("group")
                    .get().then(function(results) {
                        results.forEach(function (doc) {
                            // 查詢姓名
                            db.collection("帳號").doc(doc.data().leader)
                            .get().then(function(a) {
                                $scope.groups.push({
                                    id:doc.id,
                                    leader:doc.data().leader + " " + a.data().Name
                                })
                                $scope.$apply(); //重新監聽view
                            }).catch(function(error) { 
                                console.log("查詢姓名發生錯誤：", error); 
                            });
                        });
                    }).catch(function(error) { 
                        console.log("取得各組別發生錯誤：", error); 
                    });

                    // 點個別小組
                    $scope.DetailBtn = function(GroupID) {
                        // 取得小組腦力激盪內容

                        // 預設在頁籤1
                        $scope.search = 'fkozq65K頁籤：'+1;
                        // 頁籤控制
                        $scope.tabs = function(number) {
                            // 設定filters
                            $scope.search = 'fkozq65K頁籤：'+number;
                            // 用findIndex找出要刪除的位置
                            var indexNum = $scope.tabsCounts.findIndex((element)=>{
                                return (element.active === true);
                            });
                            // 替換class - 原頁面
                            $scope.tabsCounts[indexNum].num = indexNum+1;
                            $scope.tabsCounts[indexNum].active = false;
                            // 替換class - 新頁面
                            $scope.tabsCounts[number-1].num = number;
                            $scope.tabsCounts[number-1].active = true;

                            $ionicScrollDelegate.scrollBottom(); //滑到最下面
                        }
                        // 取得 - 頁籤數
                        db.collection("腦力激盪").doc(ClassID).collection(GroupID).doc("頁籤")
                        .get().then(function(doc) {
                            if (doc.exists) {
                                $scope.tabsCounts = [];
                                for (let index = 1; index <= doc.data().count; index++) {
                                    if (index==1) {
                                        $scope.tabsCounts.push({num:index,active:true});
                                    } else {
                                        $scope.tabsCounts.push({num:index,active:false});
                                    }
                                }
                                $scope.$apply(); //重新監聽view
                            } else {
                                // 初始化分頁
                                db.collection("腦力激盪").doc(ClassID).collection(GroupID).doc("頁籤")
                                .set({
                                    count: 3
                                })
                                .then(function() {
                                    console.log("初始化分頁成功");
                                })
                                .catch(function(error) {
                                    console.error("初始化分頁失敗", error);
                                });
                            }
                        }).catch(function(error) { 
                            console.log("取得 - 頁籤數發生錯誤：", error); 
                        });

                        $scope.items = [];
                        // 取得 - 腦力激盪內容
                        db.collection("腦力激盪").doc(ClassID).collection(GroupID).orderBy("time","asc")
                        .get().then(function(results) {
                            results.forEach(function(doc) {
                                $scope.items.push(doc.data());
                                $scope.$apply(); //重新監聽view
                                console.log("新增: ", doc.data());
                            });
                        }).catch(function(error) { 
                            console.log("取得 - 腦力激盪內容發生錯誤：", error); 
                        });
                        // 跳出泡泡
                        $ionicPopup.show({
                            title: '討論狀況',
                            template: 
                            '<div class="tabs-striped tabs-top tabs-background-light tabs-color-calm">'+
                                '<div class="tabs" style="width:93%;top:37px;">'+
                                    '<a class="tab-item" ng-class="{true:'+"'"+'active'+"'"+',false:'+"''"+'}[tabsCount.active]" ng-repeat="tabsCount in tabsCounts" ng-click="tabs(tabsCount.num)">'+
                                        '{{tabsCount.num}}'+
                                    '</a>'+
                                '</div>'+
                            '</div>'+

                            '<div class="spacer" style="height: 35px;"></div>'+

                            '<div class="list" ng-repeat="item in items | filter:search">'+
                                '<div class="item">'+
                                    '<h2>獲讚數：{{item.like.length}}    被採用：{{item.invited}}</h2>'+
                                    '<h2 class="brainstorming_h2">{{item.StuName}}：<span ng-bind-html="item.msg | linky"></span></h2>'+
                                '</div>'+
                            '</div>',

                            scope: $scope,
                            buttons: [{
                                text: '關閉',
                                type: 'button-chanry1',
                                onTap: function(e) {
                                    console.log('選擇關閉');
                                }
                            }]
                        });
                    };

                } else {
                    // 提醒
                    $ionicPopup.alert({
                        title: '錯誤',
                        template: '請選擇課程。'
                    });
                }
            };

        }else{
            console.log("尚未登入");
            $state.go("login");
            // window.location.reload();
        }
    });
}])

// ----------------------------------------教師版提案聚焦----------------------------------------
.controller('root_proposalCtrl', ['$scope', '$stateParams', '$state', '$ionicPopup', '$ionicLoading',
function ($scope, $stateParams, $state, $ionicPopup, $ionicLoading) {
    var db = firebase.firestore();
    // 驗證登入
    firebase.auth().onAuthStateChanged((user) => {
        if (user.uid==="eTlMITVmGbSStEQ7B7jw9rIl20N2") { //登入成功，取得使用者
            console.log("已登入狀態");
            $scope.cardShow = false;

            // 列出全部課程
            db.collection("課程")
            .get().then(function (querySnapshot) {
                $scope.AllClass = [];
                querySnapshot.forEach(function (doc) {
                    $scope.AllClass.push(doc.data());
                    $state.go($state.current, {}, {reload: true}); //重新載入view
                });
                console.log($scope.AllClass);
            });

            // 選擇課程 - 選擇中
            $scope.hide = function() {
                $scope.cardShow = false;
            };

            // 選擇課程 - 選擇完成
            $scope.SelectBtn = function(value) {
                if (value!=undefined) {
                    var ClassID = value.ClassID;
                    var StuID = "教師版";
                    $scope.cardShow = true;

                    $scope.groups = [];
                    // 取得各組別
                    db.collection("分組").doc(ClassID).collection("group")
                    .get().then(function(results) {
                        results.forEach(function (doc) {
                            // 查詢姓名
                            db.collection("帳號").doc(doc.data().leader)
                            .get().then(function(a) {
                                $scope.groups.push({
                                    id:doc.id,
                                    leader:doc.data().leader + " " + a.data().Name
                                })
                                $scope.$apply(); //重新監聽view
                            }).catch(function(error) { 
                                console.log("查詢姓名發生錯誤：", error); 
                            });
                        });
                    }).catch(function(error) { 
                        console.log("取得各組別發生錯誤：", error); 
                    });

                    // 點個別小組
                    $scope.DetailBtn = function(GroupID) {
                        // 取得小組提案聚焦內容

                        $scope.items = [];
                        // 取得 - 提案聚焦內容
                        db.collection("提案聚焦").doc(ClassID).collection(GroupID).orderBy("time","asc")
                        .get().then(function(results) {
                            results.forEach(function(doc) {
                                var a = doc.data();
                                var b = [];
                                // 找出腦力激盪內容
                                a.brainstorming.forEach(function(brainstormingID) {
                                    db.collection("腦力激盪").doc(ClassID).collection(GroupID).doc(brainstormingID)
                                    .get().then(function(results) {
                                        b.push(results.data());
                                        $scope.$apply(); //重新監聽view
                                    }).catch(function(error) { 
                                        console.log("腦力激盪內容發生錯誤：", error); 
                                    });
                                });
                                
                                // 放入資料
                                $scope.items.push({
                                    ProposalName:a.ProposalName,
                                    brainstorming:b,
                                    time:a.time
                                });

                                $scope.$apply(); //重新監聽view
                                console.log("新增: ", doc.data());
                            });
                        }).catch(function(error) { 
                            console.log("取得 - 腦力激盪內容發生錯誤：", error); 
                        });

                        // 跳出泡泡
                        $ionicPopup.show({
                            title: '討論狀況',
                            template: 
                            '<div class="proposal_card" ng-repeat="item in items">'+
                                '<div class="card">'+
                                    '<div class="item item-divider">'+
                                        '提案：【{{item.ProposalName}}】'+
                                    '</div>'+
                                    '<div ng-repeat="brainstorming in item.brainstorming" class="item item-text-wrap proposal_item">'+
                                        '<span ng-bind-html="brainstorming.msg | linky"></span>'+
                                    '</div>'+
                                '</div>'+
                            '</div>',

                            scope: $scope,
                            buttons: [{
                                text: '關閉',
                                type: 'button-chanry1',
                                onTap: function(e) {
                                    console.log('選擇關閉');
                                }
                            }]
                        });
                    };
                } else {
                    // 提醒
                    $ionicPopup.alert({
                        title: '錯誤',
                        template: '請選擇課程。'
                    });
                }
            };

        }else{
            console.log("尚未登入");
            $state.go("login");
            // window.location.reload();
        }
    });
}])

// ----------------------------------------教師版點數管理----------------------------------------
.controller('root_pointCtrl', ['$scope', '$stateParams', '$state', '$ionicPopup', '$ionicLoading',
function ($scope, $stateParams, $state, $ionicPopup, $ionicLoading) {
    var db = firebase.firestore();
    // 驗證登入
    firebase.auth().onAuthStateChanged((user) => {
        if (user.uid==="eTlMITVmGbSStEQ7B7jw9rIl20N2") { //登入成功，取得使用者
            console.log("已登入狀態");
            $scope.cardShow = false;

            // 列出全部課程
            db.collection("課程")
            .get().then(function (querySnapshot) {
                $scope.AllClass = [];
                querySnapshot.forEach(function (doc) {
                    $scope.AllClass.push(doc.data());
                    $state.go($state.current, {}, {reload: true}); //重新載入view
                });
                console.log($scope.AllClass);
            });

            // 選擇課程 - 選擇中
            $scope.hide = function() {
                $scope.cardShow = false;
            };

            // 選擇課程 - 選擇完成
            $scope.SelectBtn = function(value) {
                $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner><p>載入課程點數中...</p>'});
                if (value!=undefined) {
                    var ClassID = value.ClassID;
                    var StuID = "教師版";
                    $scope.cardShow = true;

                    $scope.StuPoints = [];
                    // 取得課程名單
                    db.collection("課程").doc(ClassID)
                    .get().then(function(results) {
                        var ClassStu = results.data().ClassStu;
                        ClassStu.forEach(function (Stu) {
                            // 載入總點數
                            db.collection("點數").doc(ClassID).collection(Stu).doc("點數歷程記錄").collection("點數歷程記錄")
                            .get().then(function(results) {
                                var This_point = 0;
                                var b = results.docs.length;
                                var countB = 0;
                                var isRepeat = [];
                                results.forEach(function (doc) {
                                    // 判斷是否有重複
                                    if (isRepeat.indexOf(doc.data().check)!=-1) {
                                        console.log(Stu+"發現重複");
                                        $ionicPopup.alert({
                                            title: Stu+'發現重複',
                                            template: '編號：'+doc.id
                                        });
                                        // 自動刪除
                                        db.collection("點數").doc(ClassID).collection(Stu).doc("點數歷程記錄").collection("點數歷程記錄").doc(doc.id)
                                        .delete()
                                        .then(function(data) {
                                            console.log(doc.id+"刪除成功");
                                        })
                                        .catch(function(error) {
                                            console.error("刪除失敗：", error);
                                        });
                                    } else {
                                        isRepeat.push(doc.data().check);
                                    }
                                    // 加總點數
                                    This_point += pasw(doc.data().point);
                                    
                                    // 判斷最後一筆
                                    countB++;
                                    if (countB==b) {
                                        $ionicLoading.hide();
                                        // 查詢姓名
                                        db.collection("帳號").doc(Stu)
                                        .get().then(function(doc) {
                                            $scope.StuPoints.push({
                                                Name:Stu+' '+doc.data().Name,
                                                StuID:Stu,
                                                Point:This_point
                                            });
                                            $scope.$apply(); //重新監聽view
                                        }).catch(function(error) { 
                                            console.log("查詢姓名發生錯誤：", error); 
                                        });
                                    }
                                });
                            }).catch(function(error) { 
                                console.log("載入總點數發生錯誤：", error); 
                            });

                        });
                    }).catch(function(error) { 
                        console.log("取得課程名單發生錯誤：", error); 
                    });
                    
                    // 發放點數
                    $scope.AddBtn = function(value) {
                        $scope.Stus = [];
                        // 取得學生名單
                        $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner><p>載入學生中...</p>'});
                        db.collection("分組").doc(ClassID).collection("student")
                        .get().then(function(results) {
                            results.forEach(function (doc) {
                                var a = results.docs[results.docs.length-1].id;
                                var b = results.docs[results.docs.length-2].id;
                                // 查詢姓名
                                db.collection("帳號").doc(doc.id)
                                .get().then(function(results) {
                                    $scope.Stus.push({StuID:doc.id,Name:results.data().Name,Checked:false});
                                    // 判斷倒數第一or第二筆 關閉轉圈圈
                                    if (doc.id==a || doc.id==b) {
                                        $ionicLoading.hide();
                                    }
                                }).catch(function(error) { 
                                    console.log("查詢姓名發生錯誤：", error); 
                                });
                            });
                        }).catch(function(error) { 
                            console.log("取得未分組名單發生錯誤：", error); 
                        });

                        $scope.checkStus = [];
                        // 取得學生名單 - 偵測勾選
                        $scope.check = function(Stu) {
                            // 判斷有無在陣列中，無則增加、有則刪除
                            if ($scope.checkStus.indexOf(Stu) === -1) {
                                $scope.checkStus.push(Stu);
                            } else {
                                $scope.checkStus.splice($scope.checkStus.indexOf(Stu),1);
                            }
                            console.log($scope.checkStus);
                        };

                        // 設定預設值
                        $scope.AddBtnPopup = [];

                        // 發放點數 - 跳出泡泡
                        $ionicPopup.show({
                            title: '發放點數',
                            template: 
                                '<label class="item item-input item-input">'+
                                    '<div class="input-label">點數說明</div>'+
                                    '<input type="text" ng-model="AddBtnPopup.content" placeholder="輸入說明">'+    
                                '</label>'+

                                '<label class="item item-input item-input">'+
                                    '<div class="input-label">點數數量</div>'+
                                    '<input type="number" ng-model="AddBtnPopup.point" placeholder="輸入數字">'+    
                                '</label>'+
                                
                                '<label class="item item-input item-select">'+
                                    '<div class="input-label">發放日期</div>'+
                                    '<input type="date" ng-model="AddBtnPopup.time">'+    
                                '</label>'+
                                
                                '<div ng-repeat="Stu in Stus">'+
                                    '<ion-checkbox ng-model="Stu.Checked" ng-click="check(Stu.StuID)">{{Stu.StuID}} {{Stu.Name}}</ion-checkbox>'+
                                '</div>',

                            scope: $scope,
                            buttons: [{
                                text: '取消',
                                type: 'button-default',
                                onTap: function(e) {
                                    console.log('選擇取消');
                                }
                            }, {
                                text: '發放',
                                type: 'button-chanry1',
                                onTap: function(e) {
                                    console.log('選擇發放');
                                    // 判斷是否必填未填
                                    if ($scope.AddBtnPopup.content==undefined||$scope.AddBtnPopup.point==undefined||$scope.AddBtnPopup.time==undefined) {
                                        console.log("請填寫完整");
                                        $ionicPopup.alert({
                                            title: '錯誤',
                                            template: '請填寫完整。'
                                        });
                                    } else if ($scope.checkStus.length==0) {
                                        console.log("請至少勾一位");
                                        $ionicPopup.alert({
                                            title: '錯誤',
                                            template: '請至少勾一位。'
                                        });
                                    } else {
                                        // 產生此次發放編號
                                        var now = new Date();
                                        var pointID =now.getFullYear().toString()+now.getMonth()+now.getDate()+now.getHours()+now.getMinutes()+now.getSeconds()+now.getMilliseconds();

                                        // 加分 - 上傳伺服器
                                        for (let index = 0; index < $scope.checkStus.length; index++) {
                                            db.collection("點數").doc(ClassID).collection($scope.checkStus[index]).doc("點數歷程記錄").collection("點數歷程記錄")
                                            .add({
                                                content: $scope.AddBtnPopup.content,
                                                point: paswLock($scope.AddBtnPopup.point),
                                                check: pointID,
                                                time: $scope.AddBtnPopup.time
                                            })
                                            .then(function(data) {
                                                console.log("加分 - 上傳伺服器成功");
                                            })
                                            .catch(function(error) {
                                                console.error("加分 - 上傳伺服器失敗：", error);
                                            });
                                        }
                                    }
                                }
                            }]
                        });
                    };

                    // 更新排行榜
                    $scope.update = function() {
                        // 點數排序
                        $scope.StuPoints = $scope.StuPoints.sort(function (a, b) {
                            return a.Point < b.Point ? 1 : -1;
                        });
                        // 取前五
                        var StuPoints = [];
                        for (let index = 0; index < 5; index++) {
                            StuPoints.push({
                                StuID: $scope.StuPoints[index].StuID,
                                Point: $scope.StuPoints[index].Point
                            });
                        }
                        // 上傳排行榜
                        db.collection("點數").doc(ClassID)
                        .set({
                            top: StuPoints,
                            UpdateTime: new Date()
                        })
                        .then(function(data) {
                            console.log("更新排行榜成功");
                            $ionicPopup.alert({
                                title: '完成',
                                template: 
                                    '更新排行榜成功。<br>'+
                                    '第一名 '+StuPoints[0].StuID+' 共 '+StuPoints[0].Point+'點<br>'+
                                    '第二名 '+StuPoints[1].StuID+' 共 '+StuPoints[1].Point+'點<br>'+
                                    '第三名 '+StuPoints[2].StuID+' 共 '+StuPoints[2].Point+'點<br>'+
                                    '第四名 '+StuPoints[3].StuID+' 共 '+StuPoints[3].Point+'點<br>'+
                                    '第五名 '+StuPoints[4].StuID+' 共 '+StuPoints[4].Point+'點'
                            });
                        })
                        .catch(function(error) {
                            console.error("更新排行榜失敗：", error);
                            $ionicPopup.alert({
                                title: '錯誤',
                                template: '更新排行榜失敗。'
                            });
                        });
                    };

                } else {
                    // 提醒
                    $ionicPopup.alert({
                        title: '錯誤',
                        template: '請選擇課程。'
                    });
                }
            };

        }else{
            console.log("尚未登入");
            $state.go("login");
            // window.location.reload();
        }
    });
}])

// ----------------------------------------教師版選單頁面----------------------------------------
.controller('rootmenuCtrl', ['$scope', '$stateParams', '$state',
function ($scope, $stateParams, $state) {
    var db = firebase.firestore();
    // 驗證登入
    firebase.auth().onAuthStateChanged((user) => {
        if (user) { //登入成功，取得使用者
            console.log("已登入狀態");
            var StuID = user.email.substring(0,user.email.indexOf("@")).toUpperCase();
            var ClassID = localStorage.getItem("ClassID");

            // 查詢姓名
            db.collection("帳號").doc(StuID)
            .get().then(function(results) {
                // 更新使用者姓名
                document.getElementById("menu-heading1").innerText = StuID + ' ' +results.data().Name;
                localStorage.setItem("StuName",results.data().Name);
            }).catch(function(error) { 
                console.log("查詢姓名發生錯誤：", error); 
            });

            // 登出
            var signOutSmtBtn = document.getElementById("menu-list-item8");
            signOutSmtBtn.addEventListener("click",function(){
                firebase.auth().signOut().then(function() {
                    console.log("登出成功");
                    localStorage.clear();
                }).catch(function(error) {
                    console.log("登出發生錯誤!");
                });
            },false);
            
            // 查詢圖片檔名
            db.collection("帳號").doc(StuID)
            .get().then(function(results) {
                // 更新menu的大頭照
                console.log("更新大頭照成功");
                var storage = firebase.storage();
                var storageRef = storage.ref();
                storageRef.child('members/'+results.data().Img).getDownloadURL().then(function(url) {
                    document.getElementById("menu-img").src=url;
                });
            }).catch(function(error) { 
                console.log("查詢圖片檔名發生錯誤：", error); 
            });
              
            // 設定授權文字
            document.getElementById("menu-heading2").innerText="Copyright © 2019 ver "+verson;
        }else{
            console.log("尚未登入");
            $state.go("login");
            // window.location.reload();
        }
    });
}]);